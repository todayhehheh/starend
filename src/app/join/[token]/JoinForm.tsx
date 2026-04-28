"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setupFromInvite } from "@/lib/joinActions";

interface Props {
  token: string;
}

export default function JoinForm({ token }: Props) {
  const [username, setUsername] = useState("");
  const [petName, setPetName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const { authEmail } = await setupFromInvite(
          token,
          username.trim(),
          password,
          petName.trim(),
        );
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });
        if (signInError) throw signInError;
        router.push("/");
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "오류가 발생했어요");
      }
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(180deg, #0d0820 0%, #1a0a2e 50%, var(--background) 100%)" }}
    >
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
          🌑
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-1">잘먹고 잘살기</h1>
        <p className="text-white/50 text-sm mb-2">빛을 잃은 별이 당신을 기다리고 있어요</p>
        <p className="text-white/30 text-xs mb-8 text-center">
          아이디와 별 이름을 정해주세요
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold block mb-1 text-white/70">아이디</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="로그인에 사용할 아이디" required maxLength={20}
              autoCapitalize="none" autoCorrect="off"
              className="w-full border-2 border-white/20 bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold block mb-1 text-white/70">별 이름</label>
            <input
              type="text" value={petName} onChange={e => setPetName(e.target.value)}
              placeholder="내가 돌볼 별의 이름" required maxLength={20}
              className="w-full border-2 border-white/20 bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
            <p className="text-white/30 text-[10px] mt-1">예: 반짝이, 루나, 별이</p>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1 text-white/70">비밀번호</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="6자 이상" required minLength={6}
              className="w-full border-2 border-white/20 bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {error && (
            <p className="text-red-300 text-xs text-center bg-red-900/30 rounded-xl p-2 border border-red-500/30">
              {error}
            </p>
          )}

          <button type="submit" disabled={isPending}
            className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl btn-pixel mt-2 disabled:opacity-60">
            {isPending ? "별을 깨우는 중..." : "별 찾으러 가기 🌟"}
          </button>
        </form>
      </div>
    </div>
  );
}
