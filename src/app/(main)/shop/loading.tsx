export default function Loading() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-16 rounded-xl bg-[var(--color-border)] animate-pulse" />
        <div className="h-8 w-20 rounded-xl bg-[var(--color-border)] animate-pulse" />
      </div>
      <div className="flex flex-col gap-6">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="h-4 w-24 rounded bg-[var(--color-border)] animate-pulse mb-3" />
            <div className="bg-[var(--color-card)] rounded-2xl pixel-border p-4 flex gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-border)] animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-28 rounded bg-[var(--color-border)] animate-pulse mb-2" />
                <div className="h-3 w-full rounded bg-[var(--color-border)] animate-pulse" />
              </div>
              <div className="h-9 w-16 rounded-xl bg-[var(--color-border)] animate-pulse self-center" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
