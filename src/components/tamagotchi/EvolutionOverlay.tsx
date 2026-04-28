"use client";

import { useEffect, useState } from "react";

const STAGE_INFO = {
  2: {
    title: "반짝이는 돌이 됐어요!",
    subtitle: "돌봄을 받아 빛이 깃들기 시작했어요",
    emoji: "🌟",
    color: "#FFD700",
  },
  3: {
    title: "별이 되어 돌아가요!",
    subtitle: "당신의 돌봄 덕분에 별이 다시 빛을 찾았어요",
    emoji: "⭐",
    color: "#FFF5C0",
  },
  4: {
    title: "별자리가 됐어요!",
    subtitle: "이제 별이 하늘에 자리를 잡았어요\n함께해준 모든 시간 덕분이에요 💜",
    emoji: "🌌",
    color: "#88BFFF",
  },
} as const;

// 결정론적 별 위치 (hydration 안전)
const STARS = Array.from({ length: 22 }, (_, i) => ({
  size: (i % 3) + 1,
  top: (i * 17 + 5) % 97,
  left: (i * 23 + 11) % 97,
  opacity: 0.3 + (i % 5) * 0.1,
  dur: 1.5 + (i % 3) * 0.5,
}));

interface Props {
  newStage: 2 | 3 | 4;
  onDone: () => void;
}

export default function EvolutionOverlay({ newStage, onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const info = STAGE_INFO[newStage];

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setFading(true), 3600);
    const t3 = setTimeout(onDone, 4300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
      style={{
        background: "radial-gradient(ellipse at center, #1a0a2e 0%, #050510 70%)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.7s ease",
      }}
      onClick={onDone}
    >
      {/* 배경 별 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: s.size,
              height: s.size,
              top: `${s.top}%`,
              left: `${s.left}%`,
              opacity: s.opacity,
              animation: `glowPulse ${s.dur}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div
        className="text-center px-8 relative z-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.9)",
          transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          className="text-8xl mb-6 inline-block"
          style={{
            filter: `drop-shadow(0 0 24px ${info.color}) drop-shadow(0 0 48px ${info.color}80)`,
            animation: "glowPulse 1.4s ease-in-out infinite",
          }}
        >
          {info.emoji}
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-3 leading-snug">
          {info.title}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          {info.subtitle}
        </p>
        <p className="text-xs mt-10" style={{ color: "rgba(255,255,255,0.3)" }}>
          탭하면 계속
        </p>
      </div>
    </div>
  );
}
