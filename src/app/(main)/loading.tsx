export default function Loading() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 64px)", background: "radial-gradient(ellipse at 50% 20%, #1e0a3c 0%, #07050f 70%)" }}
    >
      <span className="text-5xl" style={{ animation: "glowPulse 1s ease-in-out infinite" }}>⭐</span>
    </div>
  );
}
