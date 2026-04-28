"use client";

import { useState, useTransition } from "react";
import type { Mission, MissionDifficulty } from "@/types";
import { createMission, updateMission, type MissionFormData } from "@/lib/adminActions";

const DIFFICULTY_COINS: Record<MissionDifficulty, number> = {
  easy: 10, medium: 20, hard: 40,
};

interface Props {
  open: boolean;
  onClose: () => void;
  assignedTo?: string;
  initial?: Mission;
}

export default function MissionFormModal({ open, onClose, assignedTo, initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<MissionFormData>({
    emoji:            initial?.emoji             ?? "🌟",
    title:            initial?.title             ?? "",
    description:      initial?.description       ?? "",
    difficulty:       initial?.difficulty        ?? "easy",
    coins:            initial?.coins             ?? 10,
    assignedTo:       assignedTo ?? initial?.assigned_to ?? null,
    expiresAt:        initial?.expires_at        ?? null,
    requiresApproval: initial?.requires_approval ?? false,
  });

  if (!open) return null;

  function handleDifficultyChange(d: MissionDifficulty) {
    setForm(f => ({ ...f, difficulty: d, coins: DIFFICULTY_COINS[d] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("제목을 입력해주세요"); return; }
    setError(null);
    startTransition(async () => {
      try {
        if (initial) {
          await updateMission(initial.id, form);
        } else {
          await createMission(form);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했어요");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[480px] bg-[var(--color-card)] rounded-t-3xl p-5 pixel-border border-b-0"
           style={{ animation: "floatIn 0.25s ease-out" }}>
        <h2 className="text-base font-extrabold mb-4">
          {initial ? "미션 수정" : assignedTo ? "개인 미션 추가" : "공통 미션 추가"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="w-16">
              <label className="text-xs font-bold text-[var(--color-muted)]">이모지</label>
              <input
                value={form.emoji}
                onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                className="w-full mt-1 text-center text-2xl bg-white pixel-border rounded-xl p-2"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-[var(--color-muted)]">미션 제목 *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="예: 오늘 아침밥 먹기"
                className="w-full mt-1 bg-white pixel-border rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--color-muted)]">설명</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="미션 상세 내용"
              rows={2}
              className="w-full mt-1 bg-white pixel-border rounded-xl px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-bold text-[var(--color-muted)]">난이도</label>
              <select
                value={form.difficulty}
                onChange={e => handleDifficultyChange(e.target.value as MissionDifficulty)}
                className="w-full mt-1 bg-white pixel-border rounded-xl px-3 py-2 text-sm"
              >
                <option value="easy">🌱 쉬움</option>
                <option value="medium">⭐ 보통</option>
                <option value="hard">🔥 어려움</option>
              </select>
            </div>
            <div className="w-20">
              <label className="text-xs font-bold text-[var(--color-muted)]">코인</label>
              <input
                type="number"
                value={form.coins}
                onChange={e => setForm(f => ({ ...f, coins: parseInt(e.target.value) || 0 }))}
                min={1}
                max={100}
                className="w-full mt-1 bg-white pixel-border rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          {assignedTo && (
            <>
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)]">만료일 (선택)</label>
                <input
                  type="date"
                  value={form.expiresAt?.split("T")[0] ?? ""}
                  onChange={e => setForm(f => ({
                    ...f,
                    expiresAt: e.target.value ? `${e.target.value}T23:59:59Z` : null,
                  }))}
                  className="w-full mt-1 bg-white pixel-border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.requiresApproval ?? false}
                  onChange={e => setForm(f => ({ ...f, requiresApproval: e.target.checked }))}
                  className="w-4 h-4 accent-purple-600"
                />
                <div>
                  <div className="text-xs font-extrabold text-purple-700">🔮 진화 퀘스트 (관리자 승인 필요)</div>
                  <div className="text-[10px] text-purple-500 mt-0.5">청소년이 완료 요청 → 관리자 승인 시 2단계 → 3단계 진화</div>
                </div>
              </label>
            </>
          )}

          {error && <p className="text-xs text-[var(--color-danger)] font-bold">{error}</p>}

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold bg-[var(--color-border)] rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 text-sm font-extrabold bg-[var(--color-primary)] text-white rounded-xl btn-pixel disabled:opacity-60"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
