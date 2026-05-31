export function MeshBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-float-slow" />
      <div className="absolute -right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px] animate-float-slower" />
      <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-fuchsia-500/10 blur-[90px] animate-float-slow" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--foreground) 8%, transparent) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
