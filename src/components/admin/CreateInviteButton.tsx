"use client";

import { useState, useTransition } from "react";
import { createInvite } from "@/lib/adminActions";

export default function CreateInviteButton() {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const token = await createInvite();
      setLink(`${window.location.origin}/join/${token}`);
    });
  }

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setLink(null);
    setCopied(false);
  }

  return (
    <>
      <button
        onClick={handleCreate}
        disabled={isPending}
        className="text-xs font-extrabold border-2 border-[var(--color-primary)] text-[var(--color-primary)] px-3 py-1.5 rounded-lg disabled:opacity-60"
      >
        {isPending ? "생성 중..." : "초대 링크"}
      </button>

      {link && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div
            className="relative w-full max-w-[480px] bg-[var(--background)] rounded-t-3xl p-6 pb-10"
            style={{ animation: "floatIn 0.25s ease-out", boxShadow: "0 -4px 24px rgba(0,0,0,0.15)" }}
          >
            <h2 className="text-base font-extrabold mb-1">초대 링크 생성됨</h2>
            <p className="text-xs text-[var(--color-muted)] mb-4">
              1회용 · 참여자가 직접 아이디·비밀번호·별 이름을 설정해요
            </p>
            <p className="text-xs font-mono bg-[var(--color-border)] rounded-xl p-3 mb-4 break-all leading-relaxed">
              {link}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border-2 border-[var(--color-border)] font-bold text-sm text-[var(--color-muted)]"
              >
                닫기
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white font-extrabold text-sm btn-pixel"
              >
                {copied ? "복사됨 ✓" : "링크 복사"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
