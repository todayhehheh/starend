"use client";

import { useState, useTransition } from "react";
import type { Pet } from "@/types";
import TamagotchiDisplay from "@/components/tamagotchi/TamagotchiDisplay";
import { useCareItem } from "@/lib/actions";
import { getIdleMessage, getActionMessage, getTapMessage, type CareAction } from "@/lib/petMessages";

export type CareItem = { itemId: string; count: number } | null;

interface Props {
  pet: Pet;
  care: { food: CareItem; toy: CareItem; bath: CareItem };
}

const BUTTONS: Array<{ key: keyof Props["care"]; action: CareAction; label: string; emoji: string; color: string }> = [
  { key: "food", action: "feed",  label: "따뜻하게",   emoji: "🌡️", color: "var(--color-hunger)" },
  { key: "toy",  action: "play",  label: "놀아주기",   emoji: "✨", color: "var(--color-happiness)" },
  { key: "bath", action: "clean", label: "맑게 해주기", emoji: "💎", color: "var(--color-cleanliness)" },
];

const TAP_EMOJIS: Record<1 | 2 | 3 | 4, string[]> = {
  1: ["💜", "✨", "🌟"],
  2: ["💛", "✨", "💜", "🌟"],
  3: ["⭐", "✨", "💫", "🌟", "💜"],
  4: ["🌌", "⭐", "✨", "💫", "🌟", "💜"],
};

type Particle = { id: number; x: number; emoji: string };

export default function PetInteraction({ pet, care }: Props) {
  const [bubble, setBubble] = useState(() => getIdleMessage(pet));
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleCare(action: CareAction, itemId: string) {
    setBubble(getActionMessage(action));
    startTransition(async () => {
      try {
        await useCareItem(itemId);
        setTimeout(() => setBubble(getIdleMessage(pet)), 2500);
      } catch (e) {
        setBubble(e instanceof Error ? e.message : "오류가 발생했어요");
        setTimeout(() => setBubble(getIdleMessage(pet)), 2500);
      }
    });
  }

  function handlePetTap() {
    if (isPending) return;
    setBubble(getTapMessage(pet));

    const pool = TAP_EMOJIS[pet.stage];
    const newParticles: Particle[] = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: 20 + Math.random() * 60,
      emoji: pool[Math.floor(Math.random() * pool.length)],
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
      setBubble(getIdleMessage(pet));
    }, 1200);
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* 말풍선 */}
      <div className="relative">
        <div
          key={bubble}
          className="bg-white pixel-border rounded-2xl px-4 py-2.5 text-sm font-bold text-center max-w-[260px] shadow-sm"
          style={{ animation: "floatIn 0.25s ease-out" }}
        >
          {bubble}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r-2 border-b-2 border-[var(--color-border)]" />
      </div>

      {/* 펫 + 파티클 */}
      <div className="relative flex items-center justify-center">
        <TamagotchiDisplay pet={pet} onClick={handlePetTap} />
        {particles.map(p => (
          <span
            key={p.id}
            className="absolute pointer-events-none select-none text-xl"
            style={{
              left: `${p.x}%`,
              bottom: "45%",
              animation: "floatUp 1s ease-out forwards",
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* 케어 버튼 */}
      <div className="flex gap-3 w-full">
        {BUTTONS.map(({ key, action, label, emoji, color }) => {
          const item = care[key];
          const canUse = !!item && item.count > 0 && !isPending;
          return (
            <button
              key={key}
              onClick={() => item && handleCare(action, item.itemId)}
              disabled={!canUse}
              className="flex-1 flex flex-col items-center gap-1.5 bg-[var(--color-card)] pixel-border rounded-2xl py-3.5 transition-all active:scale-95 disabled:opacity-40"
            >
              <span className="text-2xl leading-none">{emoji}</span>
              <span className="text-xs font-extrabold" style={{ color }}>{label}</span>
              <span className="text-[10px] text-[var(--color-muted)]">
                {item && item.count > 0 ? `${item.count}개` : "없음"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
