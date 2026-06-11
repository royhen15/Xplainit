"use client";

import { useEffect, useRef, useState } from "react";

export type ProctorStatus =
  | "idle"
  | "loading"
  | "ready"
  | "denied"
  | "error"
  | "unsupported";

// WASM must match the installed @mediapipe/tasks-vision version.
const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Landmark = { x: number; y: number; z: number };

// Estimate horizontal eye gaze from iris position within each eye.
// Returns deviation from centre (~0 = looking straight ahead).
function horizontalGaze(lm: Landmark[]): number | null {
  const rOuter = lm[33];
  const rInner = lm[133];
  const rIris = lm[468];
  const lInner = lm[362];
  const lOuter = lm[263];
  const lIris = lm[473];
  if (!rOuter || !rInner || !rIris || !lInner || !lOuter || !lIris) return null;

  const rPos = (rIris.x - rInner.x) / (rOuter.x - rInner.x);
  const lPos = (lIris.x - lInner.x) / (lOuter.x - lInner.x);
  return (rPos - 0.5 + (lPos - 0.5)) / 2;
}

// True when the head is turned or the eyes are looking well off-centre.
function isLookingAway(lm: Landmark[]): boolean {
  // Head turn: nose tip vs the horizontal span of the face.
  const nose = lm[1];
  const left = lm[234];
  const right = lm[454];
  if (nose && left && right) {
    const ratio = (nose.x - left.x) / (right.x - left.x); // ~0.5 = centred
    if (ratio < 0.36 || ratio > 0.64) return true;
  }
  const gaze = horizontalGaze(lm);
  if (gaze != null && Math.abs(gaze) > 0.22) return true;
  return false;
}

// Webcam proctor: shows a live feed and watches the user's face/eyes.
// Counts a violation each time they look away or leave frame for >1.2s.
export function useProctor(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<ProctorStatus>("idle");
  const [faceVisible, setFaceVisible] = useState(true);
  const [lookingAway, setLookingAway] = useState(false);
  const [violations, setViolations] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const awaySinceRef = useRef<number | null>(null);
  const countedRef = useRef(false);
  const lastTsRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) return;

      const now = performance.now();
      if (now - lastTsRef.current < 120) return; // throttle to ~8fps
      lastTsRef.current = now;

      let res;
      try {
        res = landmarker.detectForVideo(video, now);
      } catch {
        return;
      }

      const lm: Landmark[] | undefined = res?.faceLandmarks?.[0];
      const hasFace = !!lm && lm.length > 0;
      const away = hasFace ? isLookingAway(lm as Landmark[]) : false;
      setFaceVisible(hasFace);
      setLookingAway(away);

      const bad = !hasFace || away;
      if (bad) {
        if (awaySinceRef.current == null) {
          awaySinceRef.current = now;
        } else if (!countedRef.current && now - awaySinceRef.current > 1200) {
          countedRef.current = true;
          setViolations((v) => v + 1);
        }
      } else {
        awaySinceRef.current = null;
        countedRef.current = false;
      }
    }

    async function setup() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      setStatus("loading");

      // 1) Camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
      } catch {
        if (!cancelled) setStatus("denied");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // autoplay quirks — ignore
        }
      }

      // 2) Face landmarker (eye/gaze tracking)
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
        const landmarker = await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: 1,
          }
        );
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setStatus("ready");
        loop();
      } catch {
        // Model couldn't load (e.g. offline). Keep the camera feed running.
        if (!cancelled) setStatus("error");
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          // ignore
        }
        landmarkerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      awaySinceRef.current = null;
      countedRef.current = false;
      setStatus("idle");
    };
  }, [active]);

  function reset() {
    setViolations(0);
    awaySinceRef.current = null;
    countedRef.current = false;
  }

  return { videoRef, status, faceVisible, lookingAway, violations, reset };
}
