"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { kstDateStr } from "@/lib/date";
import type { ReactionType } from "@/types";

export async function completeMission(
  missionId: string,
  content: string,
  coinsEarned: number,
  photoUrl?: string,
  isPrivate?: boolean,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase.from("mission_logs").insert({
    user_id:      user.id,
    mission_id:   missionId,
    content,
    emoji:        "📸",
    coins_earned: coinsEarned,
    photo_url:    photoUrl ?? null,
    is_private:   isPrivate ?? false,
  });

  if (error) {
    if (error.code === "23505") throw new Error("오늘 이미 완료한 미션이에요");
    throw new Error("미션 완료에 실패했어요");
  }

  // 진화 조건 확인
  const [{ data: pet }, { count: totalMissions }] = await Promise.all([
    supabase.from("pets").select("stage").eq("user_id", user.id).single(),
    supabase.from("mission_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const stage = pet?.stage ?? 1;
  const count = totalMissions ?? 0;

  if (stage === 1 && count >= 5) {
    await supabase.from("pets").update({ stage: 2 }).eq("user_id", user.id);
  } else if (stage === 3 && count >= 40) {
    const { data: allLogs } = await supabase
      .from("mission_logs")
      .select("created_at")
      .eq("user_id", user.id);
    const distinctDays = new Set(
      (allLogs ?? []).map(l => kstDateStr(new Date(l.created_at as string).getTime()))
    ).size;
    if (distinctDays >= 15) {
      await supabase.from("pets").update({ stage: 4 }).eq("user_id", user.id);
    }
  }

  revalidatePath("/missions");
  revalidatePath("/feed");
  revalidatePath("/");
}

export async function completeMissionWithApproval(
  missionId: string,
  content: string,
  coinsEarned: number,
  photoUrl?: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase.from("mission_logs").insert({
    user_id:      user.id,
    mission_id:   missionId,
    content,
    emoji:        "📸",
    coins_earned: coinsEarned,
    photo_url:    photoUrl ?? null,
    approved_at:  null,
  });

  if (error) {
    if (error.code === "23505") throw new Error("이미 완료 요청을 보냈어요");
    throw new Error("완료 요청에 실패했어요");
  }

  revalidatePath("/missions");
}

export async function toggleReaction(logId: string, type: ReactionType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("mission_log_id", logId)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("reactions").insert({
      user_id:        user.id,
      mission_log_id: logId,
      type,
    });
  }

  revalidatePath("/feed");
}

export async function buyItem(itemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("buy_item", { p_item_id: itemId });
  if (error) throw new Error("구매에 실패했어요");
  const result = data as { ok: boolean; error?: string; new_stage: number; item_type: string };
  if (!result.ok) throw new Error(result.error || "구매에 실패했어요");
  revalidatePath("/shop");
  revalidatePath("/");
  return result;
}

export async function useCareItem(itemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("use_care_item", { p_item_id: itemId });
  if (error) throw new Error("사용에 실패했어요");
  const result = data as { ok: boolean; error?: string; new_stat: number; item_type: string };
  if (!result.ok) throw new Error(result.error || "아이템이 없어요");
  revalidatePath("/");
  return result;
}

export async function submitMoodCheckin(mood: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_mood_checkin", { p_mood: mood });
  if (error) throw new Error("체크인에 실패했어요");
  const result = data as { ok: boolean; error?: string; coins_earned: number };
  if (!result.ok) throw new Error(result.error || "체크인에 실패했어요");
  revalidatePath("/");
  return result;
}
