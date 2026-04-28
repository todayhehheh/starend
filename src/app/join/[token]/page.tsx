import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import JoinForm from "./JoinForm";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { token } = await params;

  // 토큰 유효성 확인 (비인증 상태에서도 조회 가능)
  const supabase = await createClient();
  const { data: invite } = await supabase
    .from("invites")
    .select("id, used_at")
    .eq("token", token)
    .single();

  // 이미 로그인된 경우 홈으로
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  if (!invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4"
        style={{ background: "linear-gradient(180deg, #0d0820 0%, #1a0a2e 100%)" }}>
        <div className="text-5xl">🌑</div>
        <p className="text-white font-extrabold text-lg">유효하지 않은 링크예요</p>
        <p className="text-white/50 text-sm text-center">
          링크가 만료되었거나 잘못된 주소예요.<br />담당 선생님께 새 링크를 요청해주세요.
        </p>
      </div>
    );
  }

  if (invite.used_at) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4"
        style={{ background: "linear-gradient(180deg, #0d0820 0%, #1a0a2e 100%)" }}>
        <div className="text-5xl">✨</div>
        <p className="text-white font-extrabold text-lg">이미 사용된 링크예요</p>
        <p className="text-white/50 text-sm text-center">
          계정이 이미 만들어졌어요.<br />앱에 로그인해 주세요.
        </p>
        <a href="/login"
          className="mt-2 px-6 py-2.5 bg-[var(--color-primary)] text-white font-bold rounded-xl text-sm">
          로그인하기
        </a>
      </div>
    );
  }

  return <JoinForm token={token} />;
}
