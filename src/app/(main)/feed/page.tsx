import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedItem from "@/components/feed/FeedItem";
import type { FeedLog } from "@/types";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const isManager = profile?.role === "manager";

  const { data: logs } = await supabase
    .from("mission_logs")
    .select(`
      id, content, photo_url, coins_earned, created_at, user_id,
      profiles:user_id ( nickname ),
      missions:mission_id ( title, emoji ),
      reactions ( id, user_id, type )
    `)
    .not("photo_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-lg font-extrabold text-[var(--color-primary)]">인증 피드</h1>
        <p className="text-xs text-[var(--color-muted)] mt-1">모두의 오늘 기록 ✨</p>
      </header>

      {!logs || logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-3">
          <div className="text-5xl">📷</div>
          <p className="text-sm font-bold text-[var(--color-muted)]">아직 인증글이 없어요</p>
          <p className="text-xs text-[var(--color-muted)]">미션을 완료하고 첫 번째로 올려보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {logs.map((log) => (
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
