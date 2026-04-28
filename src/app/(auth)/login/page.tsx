"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let email = identifier.trim();

      // 아이디 입력 시 participant_logins에서 auth_email 조회
      if (!email.includes("@")) {
        const { data, error: lookupError } = await supabase
          .from("participant_logins")
          .select("auth_email")
          .eq("username", email)
          .single();

        if (lookupError || !data) {
          throw new Error("아이디 또는 비밀번호가 올바르지 않아요");
        }
        email = data.auth_email;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "오류가 발생했어요";
      setError(
        msg === "Invalid login credentials"
          ? "아이디 또는 비밀번호가 올바르지 않아요"
          : msg
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(180deg, #0d0820 0%, #1a0a2e 50%, var(--background) 100%)" }}
    >
      {/* 배경 별 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[[15,20],[72,8],[40,35],[85,15],[25,60],[60,48],[90,70],[10,80],[50,12],[35,75]].map(([l,t],i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width:(i%3)+1, height:(i%3)+1, left:`${l}%`, top:`${t}%`,
              opacity:0.4+(i%4)*0.1, animation:`glowPulse ${1.5+(i%3)*0.4}s ease-in-out infinite` }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
        <div className="text-6xl mb-3"
          style={{ filter:"drop-shadow(0 0 12px #FFD700)", animation:"glowPulse 2s ease-in-out infinite" }}>
          ⭐
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-1">잘먹고 잘살기</h1>
        <p className="text-white/50 text-sm mb-2">별이 당신을 기억하고 있어요</p>
        <p className="text-white/30 text-xs mb-8 text-center">
          돌멩이가 된 별 · 함께라면 다시 빛날 수 있어요
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold block mb-1 text-white/70">아이디</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="아이디 입력"
              required
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full border-2 border-white/20 bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold block mb-1 text-white/70">비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호 입력" required
              className="w-full border-2 border-white/20 bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]" />
          </div>

          {error && (
            <p className="text-red-300 text-xs text-center bg-red-900/30 rounded-xl p-2 border border-red-500/30">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl btn-pixel mt-2 disabled:opacity-60">
            {loading ? "잠깐만요..." : "별에게 돌아가기 ✨"}
          </button>
        </form>

        <p className="text-white/20 text-xs mt-8 text-center">
          처음이라면 담당 선생님께 아이디를 받아주세요
        </p>
      </div>
    </div>
  );
}
