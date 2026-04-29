"use client";

import { useEffect, useState } from "react";
import type { Pet } from "@/types";

export type PetAnim = "idle" | "happy" | "sad" | "tap" | "sleep";

// 5열 × 5행 = 25프레임 그리드
const COLS = 5;
const ROWS = 5;
const TOTAL_FRAMES = COLS * ROWS; // 25

// 화면 표시 크기 (px) — 프레임 1개 기준
const DISPLAY = 160;

// 애니메이션별 프레임 전환 속도 (ms)
const SPEED: Record<PetAnim, number> = {
  idle:  260,
  happy: 110,
  sad:   340,
  tap:    90,
  sleep: 480,
};

export function getAutoAnim(pet: Pet): PetAnim {
  const min = Math.min(pet.hunger, pet.happiness, pet.cleanliness);
  if (min < 25) return "sad";
  return "idle";
}

interface Props {
  pet: Pet;
  anim?: PetAnim;
  onClick?: () => void;
  onMissing?: () => void;
}

export default function PixelPet({ pet, anim, onClick, onMissing }: Props) {
  const [frame, setFrame] = useState(0);
  const currentAnim = anim ?? getAutoAnim(pet);
  const spriteUrl = `/sprites/stage${pet.stage}_${currentAnim}.png`;

  // 애니메이션 전환 시 프레임 리셋
  useEffect(() => {
    setFrame(0);
    const id = setInterval(
      () => setFrame(f => (f + 1) % TOTAL_FRAMES),
      SPEED[currentAnim],
    );
    return () => clearInterval(id);
  }, [currentAnim]);

  // 5×5 그리드에서 현재 프레임의 열/행 계산
  const col = frame % COLS;       // 0~4
  const row = Math.floor(frame / COLS); // 0~4
  const bgX = -(col * DISPLAY);
  const bgY = -(row * DISPLAY);

  return (
    <div
      role={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        width:              DISPLAY,
        height:             DISPLAY,
        backgroundImage:    `url(${spriteUrl})`,
        backgroundSize:     `${COLS * DISPLAY}px ${ROWS * DISPLAY}px`, // 800×800px
        backgroundPosition: `${bgX}px ${bgY}px`,
        imageRendering:     "pixelated",
        cursor:             onClick ? "pointer" : "default",
        flexShrink:         0,
      }}
    >
      <img
        src={spriteUrl}
        alt=""
        className="hidden"
        onError={() => onMissing?.()}
      />
    </div>
  );
}
