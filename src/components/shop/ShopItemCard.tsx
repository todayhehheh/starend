"use client";

import { useState, useTransition } from "react";
import type { ShopItem, PetStage } from "@/types";
import { buyItem } from "@/lib/actions";
import EvolutionOverlay from "@/components/tamagotchi/EvolutionOverlay";

const ITEM_TYPE_INFO = {
  food: { label: "따뜻함", color: "var(--color-hunger)" },
  toy:  { label: "반짝임", color: "var(--color-happiness)" },
  bath: { label: "맑음",   color: "var(--color-cleanliness)" },
};

interface Props {
  item: ShopItem;
  userCoins: number;
  ownedCount: number;
  currentPetStage: PetStage;
}

export default function ShopItemCard({ item, userCoins, ownedCount, currentPetStage }: Props) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [evolvedStage, setEvolvedStage] = useState<2 | 3 | null>(null);
  const canAfford = userCoins >= item.price;
  const typeInfo = ITEM_TYPE_INFO[item.type];

  function handleBuy() {
    startTransition(async () => {
      try {
        const result = await buyItem(item.id);
        if (result.new_stage > currentPetStage) {
          setEvolvedStage(result.new_stage as 2 | 3);
        } else {
          setToast({ msg: "인벤토리에 추가됐어요! 🌟", ok: true });
          setTimeout(() => setToast(null), 2200);
        }
      } catch (err: unknown) {
        setToast({ msg: err instanceof Error ? err.message : "오류 발생", ok: false });
        setTimeout(() => setToast(null), 2200);
      }
    });
  }

  return (
    <>
      {evolvedStage && (
        <EvolutionOverlay
          newStage={evolvedStage}
          onDone={() => setEvolvedStage(null)}
        />
      )}

      <div
        className={`relative bg-[var(--color-card)] rounded-2xl p-3.5 pixel-border flex items-center gap-3 transition-opacity ${
          !canAfford && !isPending ? "opacity-50" : ""
        }`}
      >
        {toast && (
          <div
            className="absolute inset-x-0 top-0 text-center text-xs font-extrabold py-1.5 rounded-t-2xl text-white"
            style={{
              background: toast.ok ? "var(--color-success)" : "var(--color-danger)",
              animation: "floatIn 0.2s ease-out",
            }}
          >
            {toast.msg}
          </div>
        )}

        <span className="text-3xl leading-none">{item.emoji}</span>

        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm">{item.name}</div>
          <div className="text-xs text-[var(--color-muted)] mt-0.5">{item.description}</div>
          <div className="text-xs font-bold mt-1" style={{ color: typeInfo.color }}>
            ▲ {typeInfo.label} +{item.stat_value}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-sm font-extrabold text-[var(--color-secondary)]">
            🪙 {item.price}
          </span>
          {ownedCount > 0 && (
            <span className="text-[10px] text-[var(--color-muted)] font-bold">
              보유 {ownedCount}개
            </span>
          )}
          <button
            onClick={handleBuy}
            disabled={isPending || !canAfford}
            className="text-xs font-extrabold bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-lg btn-pixel disabled:opacity-60"
          >
            {isPending ? "구매 중..." : "구매"}
          </button>
        </div>
      </div>
    </>
  );
}
