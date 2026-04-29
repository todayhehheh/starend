"use client";

import { useEffect, useState } from "react";
import type { Pet } from "@/types";

export type PetAnim = "idle" | "happy" | "sad" | "tap" | "sleep";

// 5×5px 프레임을 32배 확대 → 160×160px 표시
const FRAME_PX = 5;
const SCALE    = 32;
const DISPLAY  = FRAME_PX * SCALE; // 160

// 애니메이션별 프레임 수 (Piskel에서 만든 프레임 수와 일치시킬 것)
const FRAMES: Record<PetAnim, number> = {
  idle:  4,
  happy: 4,
  sad:   4,
  tap:   4,
  sleep: 4,
};

// 프레임 전환 속도 (ms)
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
  const frameCount = FRAMES[currentAnim];

  // 애니메이션 전환 시 프레임 리셋
  useEffect(() => {
    setFrame(0);
    const id = setInterval(
      () => setFrame(f => (f + 1) % frameCount),
      SPEED[currentAnim],
    );
    return () => clearInterval(id);
  }, [currentAnim, frameCount]);

  // 스트립 가로: 프레임 수 × 160px, 세로: 160px (1행)
  const bgX = -(frame * DISPLAY);

  return (
    <div
      role={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        width:              DISPLAY,
        height:             DISPLAY,
        backgroundImage:    `url(${spriteUrl})`,
        backgroundSize:     `${frameCount * DISPLAY}px ${DISPLAY}px`,
        backgroundPosition: `${bgX}px 0px`,
        imageRendering:     "pixelated",
        cursor:             onClick ? "pointer" : "default",
        flexShrink:         0,
      }}
    >
      {/* PNG 로드 실패 시 폴백 트리거 */}
      <img
        src={spriteUrl}
        alt=""
        className="hidden"
        onError={() => { onMissing?.(); }}
      />
    </div>
  );
}
