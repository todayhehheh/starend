"use client";

import { useState, useTransition } from "react";
import { completeTutorial } from "@/lib/actions";

const SLIDES = [
  {
    emoji: "🌌",
    text: "어딘가 깊고 어두운 하늘에서...",
    sub: null,
  },
  {
    emoji: "✨",
    text: "별 하나가 빛을 잃고\n땅으로 떨어졌어요.",
    sub: null,
  },
  {
    emoji: "🌑",
    text: "아무도 알아채지 못했어요.",
    sub: "그저 작은 돌멩이처럼 보였거든요.",
  },
  {
    emoji: "🫧",
    text: "하지만 당신은\n그 돌멩이를 발견했어요.",
    sub: null,
  },
  {
    emoji: "💜",
    text: "이 별에게\n따뜻함이 필요해요.",
    sub: "함께해줄 수 있나요?",
  },
];

interface Props {
  petName: string;
}

export default function StorySlide({ petName }: Props) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [, startTransition] = useTransition();

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  function next() {
    if (fading) return;
    if (isLast) {
      startTransition(async () => {
        await completeTutorial();
      });
      return;
    }
    setFading(true);
    setTimeout(() => {
      setIndex(i => i + 1);
      setFading(false);
    }, 300);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #0d0520 0%, #030208 100%)",
      }}
      onClick={next}
    >
      {/* 배경 별 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width:  (i % 3) + 1,
              height: (i % 3) + 1,
              top:    `${(i * 13 + 7) % 95}%`,
              left:   `${(i * 19 + 11) % 95}%`,
              opacity: 0.15 + (i % 5) * 0.07,
              animation: `glowPulse ${1.5 + (i % 4) * 0.4}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* 슬라이드 내용 */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 px-10 text-center"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        <div
          className="text-7xl"
          style={{ filter: "drop-shadow(0 0 20px rgba(196,168,255,0.6))" }}
        >
          {slide.emoji}
        </div>

        <h2
          className="text-xl font-extrabold leading-relaxed whitespace-pre-line"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          {slide.text}
        </h2>

        {slide.sub && (
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            {slide.sub}
          </p>
        )}

        {isLast && (
          <div
            className="mt-4 px-8 py-3 rounded-2xl font-extrabold text-sm"
            style={{
              background: "rgba(124,92,191,0.8)",
              border: "1px solid rgba(196,168,255,0.4)",
              color: "#fff",
              animation: "floatIn 0.5s ease-out",
            }}
          >
            {petName}와 함께 시작하기 💜
          </div>
        )}
      </div>

      {/* 진행 점 */}
      <div className="absolute bottom-16 flex gap-2">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width:   i === index ? 20 : 6,
              height:  6,
              background: i === index
                ? "rgba(196,168,255,0.9)"
                : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      <p
        className="absolute bottom-8 text-xs"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        {isLast ? "" : "탭하면 계속"}
      </p>
    </div>
  );
}
