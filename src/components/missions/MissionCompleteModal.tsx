"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Mission } from "@/types";
import { completeMission, completeMissionWithApproval } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";

interface Props {
  mission: Mission;
  onClose: () => void;
  requiresApproval?: boolean;
}

export default function MissionCompleteModal({ mission, onClose, requiresApproval }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const router = useRouter();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoFile) {
      setError("사진을 선택해주세요");
      return;
    }
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("로그인이 필요합니다");

        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}_${mission.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("mission-photos")
          .upload(path, photoFile, { upsert: false });

        if (uploadError) throw new Error("사진 업로드에 실패했어요");

        const { data: { publicUrl } } = supabase.storage
          .from("mission-photos")
          .getPublicUrl(path);

        if (requiresApproval) {
          await completeMissionWithApproval(mission.id, caption.trim(), mission.coins, publicUrl);
        } else {
          await completeMission(mission.id, caption.trim(), mission.coins, publicUrl);
        }
        setStep("success");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "오류가 발생했어요");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={step === "success" ? onClose : undefined} />
      <div
        className="relative w-full max-w-[480px] bg-[var(--background)] rounded-t-3xl p-6 pb-10"
        style={{ animation: "floatIn 0.25s ease-out", boxShadow: "0 -4px 24px rgba(0,0,0,0.15)" }}
      >
        {step === "success" ? (
          <div className="text-center py-4">
            <div
              className="text-7xl mb-4 inline-block"
              style={{ animation: "floatIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
            >
              {requiresApproval ? "🔮" : "🌟"}
            </div>
            <h2 className="text-xl font-extrabold text-[var(--color-primary)] mb-2">
              {requiresApproval ? "완료 요청 전송!" : "미션 완료!"}
            </h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              {requiresApproval
                ? "관리자 승인 후 진화해요 ✨"
                : "피드에 올라갔어요 📸"}
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border-2 border-[var(--color-border)] font-bold text-sm text-[var(--color-muted)] bg-[var(--color-card)]"
              >
                닫기
              </button>
              {!requiresApproval && (
                <button
                  onClick={() => { onClose(); router.push("/feed"); }}
                  className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white font-extrabold text-sm btn-pixel"
                >
                  피드 보기 →
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-5">
              <span className="text-5xl">{mission.emoji}</span>
              <h2 className="text-base font-extrabold mt-2">{mission.title}</h2>
              <p className="text-sm font-bold text-[var(--color-secondary)] mt-1">
                🪙 +{mission.coins} 코인 획득!
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {photoPreview ? (
                <div className="relative mb-4">
                  <img
                    src={photoPreview}
                    alt="인증 사진"
                    className="w-full aspect-square object-cover rounded-2xl border-2 border-[var(--color-border)]"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full text-white text-sm flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full aspect-[3/2] border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center gap-2 mb-4 bg-[var(--color-card)] active:scale-[0.98] transition-transform"
                >
                  <span className="text-4xl">📷</span>
                  <span className="text-sm font-bold text-[var(--color-muted)]">사진으로 인증하기</span>
                  <span className="text-xs text-[var(--color-muted)]">탭해서 촬영 또는 선택</span>
                </button>
              )}

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="한 마디 남겨봐요 (선택)"
                maxLength={60}
                rows={2}
                className="w-full border-2 border-[var(--color-border)] bg-[var(--color-card)] rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-[var(--color-primary)] transition-colors mb-4"
              />

              {error && (
                <p className="text-[var(--color-danger)] text-xs mb-3 text-center bg-red-50 rounded-xl p-2 border border-red-200">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-2 border-[var(--color-border)] font-bold text-sm text-[var(--color-muted)] bg-[var(--color-card)]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending || !photoFile}
                  className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white font-extrabold text-sm btn-pixel disabled:opacity-60"
                >
                  {isPending ? "올리는 중..." : "완료! 🎉"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
