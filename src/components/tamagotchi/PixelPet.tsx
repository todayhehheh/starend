"use client";

import { useEffect, useState } from "react";
import type { Pet } from "@/types";

export type PetAnim = "idle" | "happy" | "sad" | "tap" | "sleep";

const FRAME_SIZE = 32;   // px per frame in the sprite sheet
const DISPLAY_SCALE = 5; // 32 × 5 = 160px on screen
const FRAME_COUNT = 5;

const ANIM_ROW: Record<PetAnim, number> = {
  idle:  0,
  happy: 1,
  sad:   2,
  tap:   3,
  sleep: 4,
};

const ANIM_MS: Record<PetAnim, number> = {
  idle:  220,
  happy: 100,
  sad:   320,
  tap:    80,
  sleep: 450,
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
  const [hasSprite, setHasSprite] = useState(true);
  const currentAnim = anim ?? getAutoAnim(pet);
  const displaySize = FRAME_SIZE * DISPLAY_SCALE;
  const spriteUrl = `/sprites/stage${pet.stage}.png`;

  useEffect(() => {
    setFrame(0);
    const id = setInterval(
      () => setFrame(f => (f + 1) % FRAME_COUNT),
      ANIM_MS[currentAnim],
    );
    return () => clearInterval(id);
  }, [currentAnim]);

  if (!hasSprite) return null;

  const bgX = -(frame * displaySize);
  const bgY = -(ANIM_ROW[currentAnim] * displaySize);
  const totalCols = FRAME_COUNT;
  const totalRows = Object.keys(ANIM_ROW).length;

  return (
    <div
      role={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${spriteUrl})`,
        backgroundSize: `${totalCols * displaySize}px ${totalRows * displaySize}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        imageRendering: "pixelated",
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
      }}
    >
      <img
        src={spriteUrl}
        alt=""
        className="hidden"
        onError={() => { setHasSprite(false); onMissing?.(); }}
      />
    </div>
  );
}
