import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        {/* Silent portrait of the examiner */}
        <Avatar text="" autoSpeak={false} />

        <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          AI-Powered Oral Exam
        </span>

        <h1 className="mt-5 bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          AI Oral Testing Tool
        </h1>

        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-slate-400">
          Meet your AI examiner. It asks 3 questions out loud, listens to your
          spoken answers, then scores you 0–100 and explains why.
        </p>

        <Link
          href="/test"
          className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400 hover:shadow-indigo-500/50 active:scale-95"
        >
          Start Test
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            🎤 Voice answers
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            🤖 AI scoring
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            🛡️ Proctored
          </span>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          Best experienced in Google Chrome on desktop · microphone required
        </p>
      </div>
    </main>
  );
}
