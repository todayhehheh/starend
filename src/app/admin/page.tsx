import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getTodayRange } from "@/lib/date";
import AddParticipantButton from "@/components/admin/AddParticipantButton";
import CreateInviteButton from "@/components/admin/CreateInviteButton";
import type { Profile, Pet } from "@/types";

const MOOD_EMOJI = ["", "😭", "😔", "😐", "🙂", "😄"];
const STAGE_LABEL = ["", "돌멩이", "반짝이는 돌", "별 ✨"];

function statColor(v: number) {
  if (v >= 60) return "text-green-600";
  if (v >= 30) return "text-yellow-600";
  return "text-red-500 font-extrabold";
}

function isAlert(pet: Pet | undefined, moodToday: number | undefined) {
  if (!pet) return true;
  const hoursSince = (Date.now() - new Date(pet.updated_at).getTime()) / 3600000;
  return (
    Math.min(pet.hunger, pet.happiness, pet.cleanliness) < 25 ||
    hoursSince > 48 ||
    (moodToday !== undefined && moodToday <= 2)
  );
}

function daysSince(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 86400000;
  if (diff < 1) return "오늘";
  if (diff < 2) return "어제";
  return `${Math.floor(diff)}일 전`;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { todayStart, tomorrowStart } = getTodayRange();

  const [
    { data: participants },
    { data: pets },
    { data: todayLogs },
    { data: todayMoods },
    { count: totalMissions },
    { data: logins },
  ] = await Promise.all([
    supabase.from("profiles").select("id, nickname, coins").eq("role", "participant").order("nickname"),
    supabase.from("pets").select("user_id, stage, hunger, happiness, cleanliness, updated_at"),
    supabase.from("mission_logs").select("user_id")
      .gte("created_at", todayStart).lt("created_at", tomorrowStart),
    supabase.from("mood_checkins").select("user_id, mood")
      .gte("created_at", todayStart).lt("created_at", tomorrowStart)
      .order("created_at", { ascending: false }),
    supabase.from("missions").select("*", { count: "exact", head: true })
      .eq("is_active", true).is("assigned_to", null),
    supabase.from("participant_logins").select("user_id, username"),
  ]);

  const petMap = new Map((pets ?? []).map(p => [p.user_id, p as Pet]));
  const usernameMap = new Map((logins ?? []).map(l => [l.user_id, l.username]));
  const logCountMap = new Map<string, number>();
  for (const l of todayLogs ?? [])
    logCountMap.set(l.user_id, (logCountMap.get(l.user_id) ?? 0) + 1);
  const moodMap = new Map<string, number>();
  for (const m of todayMoods ?? [])
    if (!moodMap.has(m.user_id)) moodMap.set(m.user_id, m.mood);

  const list = (participants as Pick<Profile, "id" | "nickname" | "coins">[] ?? [])
    .map(p => ({
      profile: p,
      username: usernameMap.get(p.id),
      pet: petMap.get(p.id),
      missionsToday: logCountMap.get(p.id) ?? 0,
      moodToday: moodMap.get(p.id),
    }))
    .sort((a, b) => Number(isAlert(b.pet, b.moodToday)) - Number(isAlert(a.pet, a.moodToday)));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-extrabold">참여자 현황</h2>
        <div className="flex gap-2">
          <CreateInviteButton />
          <AddParticipantButton />
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-[var(--color-muted)]">공통 미션 {totalMissions ?? 0}개</span>
      </div>

      {list.length === 0 && (
        <p className="text-sm text-[var(--color-muted)] text-center py-12">참여자가 없어요</p>
      )}

      <div className="flex flex-col gap-3">
        {list.map(({ profile, username, pet, missionsToday, moodToday }) => {
          const alert = isAlert(pet, moodToday);
          return (
            <div
              key={profile.id}
              className={`bg-[var(--color-card)] rounded-2xl p-4 pixel-border ${alert ? "border-red-300" : ""}`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    {alert && <span className="text-sm">⚠️</span>}
                    <span className="font-extrabold text-sm">{profile.nickname}</span>
                    {username && (
                      <span className="text-[10px] font-mono text-[var(--color-muted)] bg-[var(--color-border)] px-1.5 py-0.5 rounded">
                        @{username}
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-muted)]">🪙 {profile.coins}</span>
                  </div>
                  <div className="text-xs text-[var(--color-muted)] mt-0.5">
                    {pet ? `${STAGE_LABEL[pet.stage]} · ${daysSince(pet.updated_at)}` : "데이터 없음"}
                  </div>
                </div>
                <Link
                  href={`/admin/participants/${profile.id}`}
                  className="text-xs font-bold text-[var(--color-primary)] bg-purple-50 px-2.5 py-1 rounded-lg shrink-0"
                >
                  상세 →
                </Link>
              </div>

              {pet && (
                <div className="flex gap-4 text-xs font-bold mb-2.5">
                  <span className={statColor(pet.hunger)}>🌡️ {pet.hunger}</span>
                  <span className={statColor(pet.happiness)}>✨ {pet.happiness}</span>
                  <span className={statColor(pet.cleanliness)}>💎 {pet.cleanliness}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                <span>
                  오늘 미션{" "}
                  <span className={`font-extrabold ${missionsToday > 0 ? "text-green-600" : ""}`}>
                    {missionsToday}
                  </span>
                  /{totalMissions ?? 0}
                </span>
                {moodToday !== undefined && <span>기분 {MOOD_EMOJI[moodToday]}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
