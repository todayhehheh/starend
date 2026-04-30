import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedItem from "@/components/feed/FeedItem";
import { getTodayRange } from "@/lib/date";
import type { FeedLog } from "@/types";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, is_isolated").eq("id", user.id).single();
  const isManager = profile?.role === "manager";
  const isIsolated = profile?.is_isolated ?? false;
  const { todayStart, tomorrowStart } = getTodayRange();

  const query = supabase
    .from("mission_logs")
    .select(`
      id, content, photo_url, coins_earned, created_at, user_id, is_private,
      profiles:user_id ( nickname, role, is_isolated ),
      missions:mission_id ( title, emoji ),
      reactions ( id, user_id, type )
    `)
    .not("photo_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  // 청소년은 당일치 피드만, 관리자는 전체
  if (!isManager) {
    query.gte("created_at", todayStart).lt("created_at", tomorrowStart);
  }

  const { data: logs } = await query;

  type RawLog = typeof logs extends (infer T)[] | null ? T : never;
  type LogProfile = { nickname: string; role: string; is_isolated: boolean } | null;

  const filtered = (logs ?? []).filter((log: RawLog) => {
    const p = log.profiles as unknown as LogProfile;
    if (isManager) return true;
    if (isIsolated) return log.user_id === user.id || p?.role === "manager";
    if ((log as { is_private: boolean }).is_private && log.user_id !== user.id) return false;
    if (p?.is_isolated) return false;
    return true;
  });

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-lg font-extrabold text-[var(--color-primary)]">인증 피드</h1>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          {isIsolated ? "나의 오늘 기록 ✨" : "오늘의 인증 피드 ✨"}
        </p>
      </header>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-3">
          <div className="text-5xl">📷</div>
          <p className="text-sm font-bold text-[var(--color-muted)]">아직 인증글이 없어요</p>
          <p className="text-xs text-[var(--color-muted)]">미션을 완료하고 첫 번째로 올려보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((log) => (
            <FeedItem
              key={log.id}
              log={log as unknown as FeedLog}
              currentUserId={user.id}
              isManager={isManager}
            />
          ))}
        </div>
      )}
    </div>
  );
}
