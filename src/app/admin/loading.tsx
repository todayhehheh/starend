export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-8 w-40 rounded-xl bg-[var(--color-border)] animate-pulse mb-2" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-[var(--color-card)] pixel-border rounded-2xl p-4 flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-[var(--color-border)] animate-pulse shrink-0" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded bg-[var(--color-border)] animate-pulse mb-1.5" />
            <div className="h-3 w-36 rounded bg-[var(--color-border)] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
