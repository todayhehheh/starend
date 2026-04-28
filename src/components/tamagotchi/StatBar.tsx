import { getStatColor } from "@/lib/pet";

interface StatBarProps {
  label: string;
  value: number;
  emoji: string;
}

export default function StatBar({ label, value, emoji }: StatBarProps) {
  const color = getStatColor(value);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xl w-7 text-center leading-none">{emoji}</span>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold">{label}</span>
          <span className="text-xs font-extrabold" style={{ color }}>
            {value}
          </span>
        </div>
        <div
          className="w-full h-3 rounded-sm overflow-hidden"
          style={{ background: "var(--color-border)" }}
        >
          <div
            className="h-full rounded-sm transition-all duration-700"
            style={{ width: `${value}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}
