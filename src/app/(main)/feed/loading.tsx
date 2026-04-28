export default function Loading() {
  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="h-6 w-24 rounded-xl bg-[var(--color-border)] animate-pulse mb-1" />
        <div className="h-3 w-32 rounded-xl bg-[var(--color-border)] animate-pulse" />
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[var(--color-card)] rounded-2xl pixel-border overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-border)] animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-20 rounded bg-[var(--color-border)] animate-pulse mb-1" />
                <div className="h-2 w-12 rounded bg-[var(--color-border)] animate-pulse" />
              </div>
            </div>
            <div className="w-full bg-[var(--color-border)] animate-pulse" style={{ height: 200 }} />
            <div className="px-4 py-3">
              <div className="h-3 w-full rounded bg-[var(--color-border)] animate-pulse mb-3" />
              <div className="flex gap-2">
                <div className="h-8 w-16 rounded-full bg-[var(--color-border)] animate-pulse" />
                <div className="h-8 w-16 rounded-full bg-[var(--color-border)] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
