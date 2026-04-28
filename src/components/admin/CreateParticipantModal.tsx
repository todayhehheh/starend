"use client";

import { useState, useTransition } from "react";
import { createParticipant } from "@/lib/adminActions";

interface Props {
  onClose: () => void;
}

export default function CreateParticipantModal({ onClose }: Props) {
  const [username, setUsername] = useState("");
  const [petName, setPetName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await createParticipant(username.trim(), petName.trim(), password);
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "오류가 발생했어요");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-[480px] bg-[var(--background)] rounded-t-3xl p-6 pb-10"
        style={{ animation: "floatIn 0.25s ease-out", boxShadow: "0 -4px 24px rgba(0,0,0,0.15)" }}
      >
        <h2 className="text-base font-extrabold mb-5">참여자 추가</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold block mb-1">아이디</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="예: 홍길동, 별이" required maxLength={20}
              className="w-full border-2 border-[var(--color-border)] bg-[var(--color-card)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold block mb-1">별 이름</label>
            <input
              type="text" value={petName} onChange={e => setPetName(e.target.value)}
              placeholder="예: 반짝이, 루나" required maxLength={20}
              className="w-full border-2 border-[var(--color-border)] bg-[var(--color-card)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold block mb-1">비밀번호</label>
            <input
              type="text" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="참여자에게 알려줄 비밀번호" required minLength={6}
              className="w-full border-2 border-[var(--color-border)] bg-[var(--color-card)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] font-mono"
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">6자 이상 · 참여자에게 직접 전달해주세요</p>
          </div>

          {error && (
            <p className="text-[var(--color-danger)] text-xs text-center bg-red-50 rounded-xl p-2 border border-red-200">
              {error}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-[var(--color-border)] font-bold text-sm text-[var(--color-muted)]">
              취소
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white font-extrabold text-sm btn-pixel disabled:opacity-60">
              {isPending ? "생성 중..." : "계정 만들기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
