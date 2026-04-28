"use client";

import { useState, useTransition } from "react";
import { submitMoodCheckin } from "@/lib/actions";

const MOODS = [
  { value: 1, emoji: "😭", label: "많이 힘들어요" },
  { value: 2, emoji: "😔", label: "조금 힘들어요" },
  { value: 3, emoji: "😐", label: "그냥 그래요" },
  { value: 4, emoji: "🙂", label: "괜찮아요" },
  { value: 5, emoji: "😄", label: "좋아요!" },
];

interface Props {
  onComplete?: () => void;
}

export default function MoodCheckin({ onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(mood: number) {
    if (isPending || done) return;
    setSelected(mood);
    startTransition(async () => {
      try {
        await submitMoodCheckin(mood);
        setDone(true);
        setTimeout(() => onComplete?.(), 1200);
      } catch {
        setSelected(null);
      }
    });
  }

  if (done) {
    return (
      <div
        className="w-full bg-[var(--color-card)] pixel-border rounded-2xl px-4 py-3 text-center"
        style={{ animation: "floatIn 0.3s ease-out" }}
      >
        <p className="text-sm font-bold">오늘의 기분을 기록했어요! 🌟</p>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">+5 코인 획득!</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--color-card)] pixel-border rounded-2xl px-4 py-4">
      <p className="text-xs text-[var(--color-muted)] text-center mb-3">별이 물어봐요 💜</p>
      <p className="text-sm font-extrabold text-center mb-4">오늘 기분이 어때요?</p>
      <div className="flex justify-between px-1">
        {MOODS.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            disabled={isPending}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all
              ${selected === value ? "bg-purple-100 scale-110" : "active:scale-95 hover:bg-purple-50"}`}
          >
            <span className="text-2xl leading-none">{emoji}</span>
            <span className="text-[9px] text-[var(--color-muted)] leading-tight text-center max-w-[44px]">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
