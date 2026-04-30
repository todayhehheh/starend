"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Pet, Profile } from "@/types";
import PetInteraction, { type CareItem } from "@/components/home/PetInteraction";
import WeekStrip from "@/components/home/WeekStrip";
import MoodCheckin from "@/components/home/MoodCheckin";
import CoinDisplay from "@/components/ui/CoinDisplay";
import EvolutionOverlay from "@/components/tamagotchi/EvolutionOverlay";
import StorySlide from "@/components/home/StorySlide";
import { getStatColor } from "@/lib/pet";

interface Props {
  profile: Pick<Profile, "nickname" | "coins" | "role" | "created_at">;
  pet: Pet;
  care: { food: CareItem; toy: CareItem; bath: CareItem };
  weekNum: number;
  activeDates: string[];
  streak: number;
  completedToday: number;
  checkedInToday: boolean;
  programDone: boolean;
  showIntro: boolean;
}

function MiniStat({ emoji, value }: { emoji: string; value: number }) {
  const color = getStatColor(value);
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-base leading-none">{emoji}</span>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

export default function HomeClient({
  profile, pet, care, weekNum, activeDates, streak,
  completedToday, checkedInToday, programDone, showIntro,
}: Props) {
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [evolutionStage, setEvolutionStage] = useState<2 | 3 | 4 | null>(null);
  const minStat = Math.min(pet.hunger, pet.happiness, pet.cleanliness);

  useEffect(() => {
    // 진화 감지: localStorage에 저장된 마지막 단계와 현재 단계 비교
    const key = `lastSeenStage_${pet.user_id}`;
    const lastSeen = parseInt(localStorage.getItem(key) ?? "1");
    if (pet.stage > lastSeen && pet.stage >= 2) {
      setEvolutionStage(pet.stage as 2 | 3 | 4);
      localStorage.setItem(key, String(pet.stage));
    }
  }, [pet.stage, pet.user_id]);

  useEffect(() => {
    if (!checkedInToday) {
      const t = setTimeout(() => setShowMoodModal(true), 600);
      return () => clearTimeout(t);
    }
  }, [checkedInToday]);

  return (
    <>
    {showIntro && <StorySlide petName={pet.name} />}
    <div
      className="flex flex-col"
      style={{ minHeight: "calc(100vh - 64px)", background: "radial-gradient(ellipse at 50% 20%, #1e0a3c 0%, #07050f 70%)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div>
          <h1 className="text-sm font-extrabold" style={{ color: "#c4a8ff" }}>잘먹고 잘살기</h1>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>안녕, {profile.nickname}!</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 출석 아이콘 */}
          <button
            onClick={() => setShowAttendance(true)}
            className="flex flex-col items-center px-2 py-1 rounded-xl relative"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <span className="text-base leading-none">📅</span>
            {streak > 1 && (
              <span className="text-[9px] font-bold mt-0.5" style={{ color: "#f4a261" }}>🔥{streak}일</span>
            )}
            {completedToday > 0 && (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: "var(--color-primary)" }}
              >
                {completedToday}
              </span>
            )}
          </button>

          <CoinDisplay coins={profile.coins} />

          {profile.role === "manager" && (
            <Link
              href="/admin"
              className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              🛠️
            </Link>
          )}
        </div>
      </header>

      {/* Pet zone */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-2 gap-4">
        {programDone && (
          <div className="text-center" style={{ animation: "floatIn 0.4s ease-out" }}>
            <div className="text-3xl mb-1" style={{ filter: "drop-shadow(0 0 12px #FFD700)" }}>⭐</div>
            <p className="font-extrabold text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>4주 프로그램 완료!</p>
          </div>
        )}

        <div
          className="flex flex-col items-center w-full"
          style={
            minStat < 25
              ? { filter: "drop-shadow(0 0 28px rgba(239,71,111,0.5))" }
              : minStat < 50
              ? { filter: "drop-shadow(0 0 20px rgba(244,162,97,0.3))" }
              : undefined
          }
        >
          <PetInteraction pet={pet} care={care} />
        </div>

        {/* Compact stats */}
        <div className="flex gap-4 w-full max-w-[220px]">
          <MiniStat emoji="🌡️" value={pet.hunger} />
          <MiniStat emoji="✨" value={pet.happiness} />
          <MiniStat emoji="💎" value={pet.cleanliness} />
        </div>

        {/* Crisis badge */}
        {minStat < 25 && (
          <div
            className="px-4 py-1.5 rounded-full text-xs font-bold text-center"
            style={{ background: "rgba(239,71,111,0.15)", color: "#ef476f", border: "1px solid rgba(239,71,111,0.3)" }}
          >
            💔 별이 위험해요 · 상점에서 아이템을 써주세요
          </div>
        )}
        {minStat >= 25 && minStat < 50 && (
          <div
            className="px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(244,162,97,0.12)", color: "#f4a261", border: "1px solid rgba(244,162,97,0.28)" }}
          >
            🌡️ 별이 기운을 잃고 있어요
          </div>
        )}
      </div>

      {/* 진화 오버레이 */}
      {evolutionStage && (
        <EvolutionOverlay newStage={evolutionStage} onDone={() => setEvolutionStage(null)} />
      )}

      {/* 기분 체크인 모달 — 접속 시 자동 등장 */}
      {showMoodModal && (
        <>
          <div
            className="fixed inset-0 z-[58]"
            style={{ background: "rgba(0,0,0,0.75)", animation: "fadeIn 0.3s ease-out" }}
          />
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center px-6"
            style={{ animation: "fadeIn 0.35s ease-out" }}
          >
            <div className="w-full max-w-sm">
              <p className="text-center text-xs mb-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                별이 물어봐요 ✨
              </p>
              <MoodCheckin onComplete={() => setShowMoodModal(false)} />
              <button
                onClick={() => setShowMoodModal(false)}
                className="w-full mt-3 text-xs py-2"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                나중에 하기
              </button>
            </div>
          </div>
        </>
      )}

      {/* 출석 시트 */}
      {showAttendance && (
        <>
          <div className="fixed inset-0 z-[58] bg-black/60" onClick={() => setShowAttendance(false)} />
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] rounded-t-3xl px-4 pt-3 pb-20 flex flex-col gap-4"
            style={{
              background: "linear-gradient(to bottom, #180930, #0d0518)",
              border: "1px solid rgba(255,255,255,0.08)",
              animation: "slideUp 0.25s ease-out",
            }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: "rgba(255,255,255,0.15)" }} />

            <WeekStrip weekNum={weekNum} activeDates={activeDates} streak={streak} />

            {completedToday > 0 && (
              <div
                className="rounded-2xl px-4 py-3 text-center"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}
              >
                <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  오늘 미션 {completedToday}개 완료! 🎉
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </>
  );
}
