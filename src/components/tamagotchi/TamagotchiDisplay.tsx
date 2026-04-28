"use client";

import type { CSSProperties } from "react";
import type { Pet, PetStage } from "@/types";
import { getMood, getMoodLabel, getMoodColor, type Mood } from "@/lib/pet";

const STAGE_COLORS: Record<PetStage, {
  body: string; border: string; cheek: string;
  glow: string; glowOpacity: number;
}> = {
  1: { body: "#4A4855", border: "#333340", cheek: "#6A6878", glow: "#FFD700", glowOpacity: 0.1 },
  2: { body: "#7A6B50", border: "#5C4F3A", cheek: "#C4A882", glow: "#FFD700", glowOpacity: 0.38 },
  3: { body: "#FFF5C0", border: "#FFD700", cheek: "#FFE082", glow: "#FFD700", glowOpacity: 0.8 },
  4: { body: "#FFFFFF", border: "#B8D4FF", cheek: "#C8E4FF", glow: "#88BFFF", glowOpacity: 1.0 },
};

const STAGE_LABELS: Record<PetStage, string> = {
  1: "돌멩이",
  2: "반짝이는 돌",
  3: "별 ✨",
  4: "별자리 ✨✨",
};

const DARK_MOOD_COLOR: Record<Mood, string> = {
  happy:    "#52b788",
  normal:   "rgba(255,255,255,0.55)",
  sad:      "#60a5fa",
  critical: "#ef476f",
};

const MOOD_ANIMATION: Record<Mood, CSSProperties> = {
  happy:    { animation: "bouncing 1.2s ease-in-out infinite" },
  normal:   {},
  sad:      {},
  critical: { animation: "shaking 0.4s ease-in-out infinite" },
};

function Eye({ mood, cx, cy }: { mood: Mood; cx: number; cy: number }) {
  if (mood === "happy") {
    return (
      <path
        d={`M ${cx - 7} ${cy + 3} Q ${cx} ${cy - 5} ${cx + 7} ${cy + 3}`}
        stroke="#444" strokeWidth="2.5" fill="none" strokeLinecap="round"
      />
    );
  }
  if (mood === "sad") {
    return (
      <path
        d={`M ${cx - 7} ${cy - 2} Q ${cx} ${cy + 6} ${cx + 7} ${cy - 2}`}
        stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round"
      />
    );
  }
  if (mood === "critical") {
    return (
      <g>
        <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} stroke="#ef476f" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6} stroke="#ef476f" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={5} fill="#333" />;
}

function Mouth({ mood, cx, cy }: { mood: Mood; cx: number; cy: number }) {
  if (mood === "happy") {
    return (
      <path
        d={`M ${cx - 14} ${cy - 2} Q ${cx} ${cy + 12} ${cx + 14} ${cy - 2}`}
        stroke="#444" strokeWidth="2.5" fill="none" strokeLinecap="round"
      />
    );
  }
  if (mood === "sad") {
    return (
      <path
        d={`M ${cx - 12} ${cy + 6} Q ${cx} ${cy - 4} ${cx + 12} ${cy + 6}`}
        stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round"
      />
    );
  }
  if (mood === "critical") {
    return (
      <path
        d={`M ${cx - 12} ${cy} Q ${cx - 5} ${cy - 5} ${cx} ${cy} Q ${cx + 5} ${cy + 5} ${cx + 12} ${cy}`}
        stroke="#ef476f" strokeWidth="2.5" fill="none" strokeLinecap="round"
      />
    );
  }
  return <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="#444" strokeWidth="2.5" strokeLinecap="round" />;
}

export default function TamagotchiDisplay({ pet, onClick }: { pet: Pet; onClick?: () => void }) {
  const mood = getMood(pet);
  const c = STAGE_COLORS[pet.stage];
  const glowId = `starGlow-${pet.stage}`;

  const eyeY  = pet.stage === 1 ? 68 : 62;
  const mouthY = pet.stage === 1 ? 84 : 78;
  const glowStyle: CSSProperties = pet.stage >= 3
    ? { animation: "glowPulse 2.5s ease-in-out infinite" }
    : {};

  return (
    <div
      className="flex flex-col items-center"
      style={{ animation: "floatIn 0.4s ease-out", cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    >
      <div className="w-44 h-44 flex items-center justify-center" style={{ ...MOOD_ANIMATION[mood], ...glowStyle }}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
          <defs>
            <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={c.glow} stopOpacity={c.glowOpacity} />
              <stop offset="100%" stopColor={c.glow} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Stage 3 — 별 광선 */}
          {pet.stage === 3 && (
            <>
              <ellipse cx="50" cy="12"  rx="5" ry="13" fill="#FFD700" opacity="0.55" />
              <ellipse cx="50" cy="112" rx="5" ry="13" fill="#FFD700" opacity="0.55" />
              <ellipse cx="10" cy="62"  rx="13" ry="5" fill="#FFD700" opacity="0.55" />
              <ellipse cx="90" cy="62"  rx="13" ry="5" fill="#FFD700" opacity="0.55" />
            </>
          )}

          {/* Stage 4 — 별자리 (8방향 광선 + 위성 별점 + 연결선) */}
          {pet.stage === 4 && (
            <>
              {/* 8방향 광선 */}
              <ellipse cx="50" cy="10"  rx="4" ry="12" fill="#88BFFF" opacity="0.7" />
              <ellipse cx="50" cy="114" rx="4" ry="12" fill="#88BFFF" opacity="0.7" />
              <ellipse cx="8"  cy="62"  rx="12" ry="4" fill="#88BFFF" opacity="0.7" />
              <ellipse cx="92" cy="62"  rx="12" ry="4" fill="#88BFFF" opacity="0.7" />
              <ellipse cx="22" cy="22"  rx="4" ry="11" fill="#88BFFF" opacity="0.5" transform="rotate(-45 22 22)" />
              <ellipse cx="78" cy="22"  rx="4" ry="11" fill="#88BFFF" opacity="0.5" transform="rotate(45 78 22)" />
              <ellipse cx="22" cy="102" rx="4" ry="11" fill="#88BFFF" opacity="0.5" transform="rotate(45 22 102)" />
              <ellipse cx="78" cy="102" rx="4" ry="11" fill="#88BFFF" opacity="0.5" transform="rotate(-45 78 102)" />
              {/* 위성 별점 */}
              <circle cx="12" cy="36" r="2.5" fill="#FFFFFF" opacity="0.9" />
              <circle cx="88" cy="36" r="2.5" fill="#FFFFFF" opacity="0.9" />
              <circle cx="12" cy="88" r="2.5" fill="#FFFFFF" opacity="0.9" />
              <circle cx="88" cy="88" r="2.5" fill="#FFFFFF" opacity="0.9" />
              <circle cx="50" cy="6"  r="2"   fill="#FFFFFF" opacity="0.9" />
              {/* 별자리 연결선 */}
              <line x1="50" y1="6"  x2="12" y2="36" stroke="#88BFFF" strokeWidth="0.7" opacity="0.45" strokeDasharray="2,2" />
              <line x1="50" y1="6"  x2="88" y2="36" stroke="#88BFFF" strokeWidth="0.7" opacity="0.45" strokeDasharray="2,2" />
              <line x1="12" y1="36" x2="12" y2="88" stroke="#88BFFF" strokeWidth="0.7" opacity="0.45" strokeDasharray="2,2" />
              <line x1="88" y1="36" x2="88" y2="88" stroke="#88BFFF" strokeWidth="0.7" opacity="0.45" strokeDasharray="2,2" />
              <line x1="12" y1="88" x2="50" y2="114" stroke="#88BFFF" strokeWidth="0.7" opacity="0.45" strokeDasharray="2,2" />
              <line x1="88" y1="88" x2="50" y2="114" stroke="#88BFFF" strokeWidth="0.7" opacity="0.45" strokeDasharray="2,2" />
            </>
          )}

          {/* 배경 빛 (stage 2+) */}
          {pet.stage >= 2 && (
            <ellipse cx="50" cy="66" rx="46" ry="52" fill={`url(#${glowId})`} />
          )}

          {/* 몸통 */}
          {pet.stage === 1 ? (
            <ellipse cx="50" cy="70" rx="34" ry="42" fill={c.body} stroke={c.border} strokeWidth="3" />
          ) : (
            <ellipse cx="50" cy="66" rx="40" ry="46" fill={c.body} stroke={c.border} strokeWidth="3" />
          )}

          {/* Stage 1 — 희미한 내부 빛 */}
          {pet.stage === 1 && (
            <ellipse cx="50" cy="65" rx="14" ry="16" fill={`url(#${glowId})`} />
          )}

          {/* Stage 2 — 균열 빛 */}
          {pet.stage === 2 && (
            <>
              <path d="M 40 55 Q 45 62 42 68" stroke="#FFD700" strokeWidth="1.5" fill="none" opacity="0.65" />
              <path d="M 61 57 Q 57 65 62 71" stroke="#FFD700" strokeWidth="1.5" fill="none" opacity="0.65" />
              <path d="M 48 79 Q 52 84 49 90" stroke="#FFD700" strokeWidth="1.2" fill="none" opacity="0.65" />
            </>
          )}

          {/* Stage 3 — 반짝이 */}
          {pet.stage === 3 && (
            <>
              <text x="6"  y="30" fontSize="12">✨</text>
              <text x="74" y="30" fontSize="12">✨</text>
            </>
          )}

          {/* Stage 4 — 별자리 반짝이 */}
          {pet.stage === 4 && (
            <>
              <text x="2"  y="20" fontSize="10">⭐</text>
              <text x="78" y="20" fontSize="10">⭐</text>
              <text x="38" y="118" fontSize="9">✨</text>
            </>
          )}

          {/* 볼터치 */}
          {mood !== "critical" && (
            <>
              <ellipse cx={37 - 11} cy={eyeY + 14} rx="8" ry="5" fill={c.cheek} opacity="0.45" />
              <ellipse cx={63 + 11} cy={eyeY + 14} rx="8" ry="5" fill={c.cheek} opacity="0.45" />
            </>
          )}

          <Eye mood={mood} cx={37} cy={eyeY} />
          <Eye mood={mood} cx={63} cy={eyeY} />
          <Mouth mood={mood} cx={50} cy={mouthY} />
        </svg>
      </div>

      <div className="w-24 h-3 rounded-full -mt-3 mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="font-extrabold text-base" style={{ color: "rgba(255,255,255,0.92)" }}>{pet.name}</div>
      <div className="text-xs mt-1 font-bold" style={{ color: DARK_MOOD_COLOR[mood] }}>
        {getMoodLabel(mood)}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
        {STAGE_LABELS[pet.stage]}
      </div>
    </div>
  );
}
