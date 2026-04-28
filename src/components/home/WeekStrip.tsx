import { kstDateStr } from "@/lib/date";

const DAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  weekNum: number;
  activeDates: string[];
  streak: number;
}

export default function WeekStrip({ weekNum, activeDates, streak }: Props) {
  const activeSet = new Set(activeDates);
  const todayKST = kstDateStr();

  const days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = kstDateStr(Date.now() - (6 - i) * 86400000);
    const dayOfWeek = new Date(dateStr + "T12:00:00+09:00").getDay();
    return {
      label: DAY_LABEL[dayOfWeek],
      dateStr,
      isToday: dateStr === todayKST,
      done: activeSet.has(dateStr),
    };
  });

  return (
    <div className="w-full bg-[var(--color-card)] rounded-2xl p-4 pixel-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[var(--color-primary)] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            {weekNum}주차
          </span>
          <span className="text-xs text-[var(--color-muted)]">4주 프로그램</span>
        </div>
        {streak > 1 && (
          <span className="text-xs font-extrabold text-orange-500">
            🔥 {streak}일 연속
          </span>
        )}
      </div>

      <div className="flex justify-between">
        {days.map(({ label, dateStr, isToday, done }) => (
          <div key={dateStr} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                done
                  ? "bg-[var(--color-primary)] text-white"
                  : isToday
                  ? "border-2 border-dashed border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "bg-[var(--color-border)] text-[var(--color-muted)]"
              }`}
              style={done ? { boxShadow: "0 0 6px rgba(139,92,246,0.4)" } : undefined}
            >
              {done ? "✓" : isToday ? "·" : ""}
            </div>
            <span
              className="text-[10px] font-bold"
              style={{ color: isToday ? "var(--color-primary)" : "var(--color-muted)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
