"use client";

import type { RefObject } from "react";
import type { ProctorStatus } from "@/hooks/useProctor";

type CameraMonitorProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: ProctorStatus;
  faceVisible: boolean;
  lookingAway: boolean;
};

// Live webcam feed with a proctoring status pill. The <video> always renders
// so the ref can attach; overlays cover it while loading or if denied.
export default function CameraMonitor({
  videoRef,
  status,
  faceVisible,
  lookingAway,
}: CameraMonitorProps) {
  const good = status === "ready" && faceVisible && !lookingAway;

  let pill: { text: string; cls: string };
  if (status === "loading") {
    pill = { text: "Starting camera…", cls: "bg-white/10 text-slate-300" };
  } else if (status === "denied") {
    pill = { text: "⚠ Camera blocked", cls: "bg-red-500/20 text-red-300" };
  } else if (status === "unsupported") {
    pill = { text: "Camera unsupported", cls: "bg-white/10 text-slate-300" };
  } else if (status === "error") {
    pill = { text: "Feed on · eye-tracking off", cls: "bg-amber-500/20 text-amber-300" };
  } else if (!faceVisible) {
    pill = { text: "⚠ Stay in frame", cls: "bg-red-500/20 text-red-300" };
  } else if (lookingAway) {
    pill = { text: "⚠ Look at the screen", cls: "bg-red-500/20 text-red-300" };
  } else {
    pill = { text: "👁 Eyes on screen", cls: "bg-emerald-500/20 text-emerald-300" };
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative h-[112px] w-[150px] overflow-hidden rounded-xl border bg-slate-900 shadow-lg transition-colors ${
          good ? "border-emerald-400/40" : "border-white/15"
        }`}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }} // mirror for a natural selfie view
        />

        {/* REC indicator */}
        {(status === "ready" || status === "error") && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            REC
          </span>
        )}

        {/* Overlays */}
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-xs text-slate-300">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
          </div>
        )}
        {(status === "denied" || status === "unsupported") && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 px-3 text-center text-[11px] text-slate-300">
            {status === "denied"
              ? "Enable camera access to be proctored"
              : "Camera not available"}
          </div>
        )}
      </div>

      <span
        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${pill.cls}`}
      >
        {pill.text}
      </span>
    </div>
  );
}
