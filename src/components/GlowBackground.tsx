export default function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="blob h-[420px] w-[420px] bg-fuchsia-600"
        style={{ top: "-10%", right: "-8%" }}
      />
      <div
        className="blob h-[380px] w-[380px] bg-violet-600"
        style={{ top: "30%", left: "-10%", animationDelay: "2s" }}
      />
      <div
        className="blob h-[340px] w-[340px] bg-cyan-500"
        style={{ bottom: "-10%", right: "15%", animationDelay: "4s" }}
      />
      <div
        className="blob h-[300px] w-[300px] bg-amber-500"
        style={{ bottom: "5%", left: "20%", animationDelay: "6s" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.08),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
