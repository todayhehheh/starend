import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeClient from "@/components/home/HomeClient";
import { getTodayRange, kstDateStr } from "@/lib/date";
import type { Pet, Profile, Inventory } from "@/types";
import type { CareItem } from "@/components/home/PetInteraction";

function calcWeekNum(createdAt: string): number {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  return Math.min(4, Math.floor(days / 7) + 1);
}

function calcStreak(activeDates: string[]): number {
  const activeSet = new Set(activeDates);
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    if (activeSet.has(kstDateStr(Date.now() - i * 86400000))) streak++;
    else break;
  }
  return streak;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { todayStart, tomorrowStart } = getTodayRange();
  const sevenDaysAgoStart = `${kstDateStr(Date.now() - 6 * 86400000)}T00:00:00+09:00`;

  const [
    { data: profile },
    { data: pet },
    { count: completedToday },
    { data: invData },
    { count: checkedInToday },
    { data: weekLogs },
  ] = await Promise.all([
    supabase.from("profiles").select("nickname, coins, role, created_at").eq("id", user.id).single(),
    supabase.from("pets").select("*").eq("user_id", user.id).single(),
    supabase.from("mission_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .lt("created_at", tomorrowStart),
    supabase.from("inventory")
      .select("item_id, quantity, shop_items(type)")
      .eq("user_id", user.id)
      .gt("quantity", 0),
    supabase.from("mood_checkins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .lt("created_at", tomorrowStart),
    supabase.from("mission_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgoStart),
  ]);

  if (!profile || !pet) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <div className="text-4xl">🌑</div>
        <p className="text-[var(--color-muted)] text-sm">별을 불러오는 중이에요...</p>
        <p className="text-[var(--color-muted)] text-xs">잠시 후 새로고침 해주세요</p>
      </div>
    );
  }

  const typedProfile = profile as Pick<Profile, "nickname" | "coins" | "role" | "created_at">;
  const typedPet = pet as Pet;

  const careMap: Record<string, { itemId: string; count: number }> = {};
  for (const row of (invData as Inventory[] | null) ?? []) {
    const type = row.shop_items?.type;
    if (!type) continue;
    if (!careMap[type]) careMap[type] = { itemId: row.item_id, count: row.quantity };
    else careMap[type].count += row.quantity;
  }
  const care = {
    food: (careMap["food"] ?? null) as CareItem,
    toy:  (careMap["toy"]  ?? null) as CareItem,
    bath: (careMap["bath"] ?? null) as CareItem,
  };

  const activeDates = [...new Set(
    (weekLogs ?? []).map(l => kstDateStr(new Date(l.created_at as string).getTime()))
  )];
  const weekNum = calcWeekNum(typedProfile.created_at);
  const streak = calcStreak(activeDates);
  const programDone = weekNum >= 4 && typedPet.stage === 3;

  return (
    <HomeClient
      profile={typedProfile}
      pet={typedPet}
      care={care}
      weekNum={weekNum}
      activeDates={activeDates}
      streak={streak}
      completedToday={completedToday ?? 0}
      checkedInToday={(checkedInToday ?? 0) > 0}
      programDone={programDone}
    />
  );
}
