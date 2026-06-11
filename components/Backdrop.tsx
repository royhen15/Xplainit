// Decorative animated gradient blobs behind everything. Purely visual.
export default function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-indigo-600/30 blur-3xl"
        style={{ animation: "drift 20s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-violet-600/25 blur-3xl"
        style={{ animation: "drift 24s ease-in-out infinite", animationDelay: "-7s" }}
      />
      <div
        className="absolute -bottom-44 left-1/4 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/20 blur-3xl"
        style={{ animation: "drift 28s ease-in-out infinite", animationDelay: "-14s" }}
      />
    </div>
  );
}
