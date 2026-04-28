export default function Loading() {
  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="h-6 w-28 rounded-xl bg-[var(--color-border)] animate-pulse mb-2" />
        <div className="h-2 w-full rounded-full bg-[var(--color-border)] animate-pulse mt-3" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[var(--color-card)] rounded-2xl pixel-border p-4 flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-border)] animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-[var(--color-border)] animate-pulse mb-2" />
              <div className="h-3 w-full rounded bg-[var(--color-border)] animate-pulse mb-3" />
              <div className="flex justify-between">
                <div className="h-3 w-12 rounded bg-[var(--color-border)] animate-pulse" />
                <div className="h-7 w-16 rounded-lg bg-[var(--color-border)] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
