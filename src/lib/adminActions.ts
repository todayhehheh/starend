"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { MissionDifficulty } from "@/types";

async function assertManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "manager") throw new Error("관리자만 접근할 수 있습니다");
  return supabase;
}

// ─── 초대 링크 ─────────────────────────────────────────────

export async function createInvite(): Promise<string> {
  const supabase = await assertManager();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("invites")
    .insert({ created_by: user!.id })
    .select("token")
    .single();
  if (error) throw new Error("초대 링크 생성에 실패했어요");
  revalidatePath("/admin");
  return data.token as string;
}

// ─── 참여자 계정 관리 ───────────────────────────────────────

export async function createParticipant(
  username: string,
  petName: string,
  password: string,
) {
  await assertManager();

  // 내부 이메일: 랜덤 ID 기반 (한글 등 특수문자 회피)
  const randomId = Math.random().toString(36).slice(2, 10);
  const authEmail = `p_${randomId}@star.app`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: { nickname: username },
  });

  if (error) {
    if (error.message.includes("already")) throw new Error("이미 존재하는 아이디예요");
    throw new Error("계정 생성에 실패했어요: " + error.message);
  }

  const userId = data.user.id;

  // 별 이름 설정
  if (petName.trim()) {
    await supabaseAdmin.from("pets").update({ name: petName.trim() }).eq("user_id", userId);
  }

  // 로그인 정보 저장
  const { error: loginInsertError } = await supabaseAdmin.from("participant_logins").insert({
    user_id: userId,
    username,
    auth_email: authEmail,
  });
  if (loginInsertError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error("로그인 정보 저장에 실패했어요: " + loginInsertError.message);
  }

  revalidatePath("/admin");
  return userId;
}

export async function resetParticipantPassword(userId: string, newPassword: string) {
  await assertManager();

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
    email_confirm: true,
  });

  if (error) throw new Error("비밀번호 변경에 실패했어요");
  revalidatePath(`/admin/participants/${userId}`);
}

export async function updateParticipantUsername(userId: string, newUsername: string) {
  await assertManager();

  // participant_logins 행이 없는 경우(초대 링크로 생성된 구 계정) auth_email을 직접 조회해 upsert
  const { data: existing } = await supabaseAdmin
    .from("participant_logins")
    .select("auth_email")
    .eq("user_id", userId)
    .single();

  let authEmail = existing?.auth_email;
  if (!authEmail) {
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
    authEmail = authData.user?.email;
    if (!authEmail) throw new Error("사용자 정보를 찾을 수 없어요");
  }

  const { error: loginError } = await supabaseAdmin
    .from("participant_logins")
    .upsert({ user_id: userId, username: newUsername, auth_email: authEmail });

  if (loginError) {
    if (loginError.code === "23505") throw new Error("이미 사용 중인 아이디예요");
    throw new Error("아이디 변경에 실패했어요");
  }

  await supabaseAdmin.from("profiles").update({ nickname: newUsername }).eq("id", userId);

  revalidatePath("/admin");
  revalidatePath(`/admin/participants/${userId}`);
}

export async function deleteParticipant(userId: string) {
  await assertManager();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error("참여자 삭제에 실패했어요");
  revalidatePath("/admin");
}

// ─── 미션 관리 ─────────────────────────────────────────────

export interface MissionFormData {
  title: string;
  description: string;
  emoji: string;
  difficulty: MissionDifficulty;
  coins: number;
  assignedTo?: string | null;
  expiresAt?: string | null;
  requiresApproval?: boolean;
}

export async function createMission(data: MissionFormData) {
  const supabase = await assertManager();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("missions").insert({
    title:              data.title,
    description:        data.description,
    emoji:              data.emoji,
    difficulty:         data.difficulty,
    coins:              data.coins,
    is_active:          true,
    requires_approval:  data.requiresApproval ?? false,
    created_by:         user!.id,
    assigned_to:        data.assignedTo ?? null,
    expires_at:         data.expiresAt  ?? null,
  });
  if (error) throw new Error("미션 생성에 실패했어요");

  revalidatePath("/admin");
  revalidatePath("/admin/missions");
  if (data.assignedTo) revalidatePath(`/admin/participants/${data.assignedTo}`);
  revalidatePath("/missions");
}

export async function updateMission(id: string, data: Partial<MissionFormData> & { isActive?: boolean }) {
  const supabase = await assertManager();

  const updates: Record<string, unknown> = {};
  if (data.title       !== undefined) updates.title       = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.emoji       !== undefined) updates.emoji       = data.emoji;
  if (data.difficulty  !== undefined) updates.difficulty  = data.difficulty;
  if (data.coins       !== undefined) updates.coins       = data.coins;
  if (data.isActive    !== undefined) updates.is_active   = data.isActive;
  if (data.expiresAt   !== undefined) updates.expires_at  = data.expiresAt;

  const { error } = await supabase.from("missions").update(updates).eq("id", id);
  if (error) throw new Error("미션 수정에 실패했어요");

  revalidatePath("/admin");
  revalidatePath("/admin/missions");
  revalidatePath("/missions");
}

export async function deleteMission(id: string) {
  const supabase = await assertManager();
  const { error } = await supabase.from("missions").delete().eq("id", id);
  if (error) throw new Error("미션 삭제에 실패했어요");

  revalidatePath("/admin");
  revalidatePath("/admin/missions");
  revalidatePath("/missions");
}

// ─── 피드 관리 ─────────────────────────────────────────────

export async function deleteFeedItem(logId: string) {
  await assertManager();
  const { error } = await supabaseAdmin.from("mission_logs").delete().eq("id", logId);
  if (error) throw new Error("삭제에 실패했어요");
  revalidatePath("/feed");
  revalidatePath("/admin");
}

export async function approveQuestCompletion(missionLogId: string, participantId: string) {
  const supabase = await assertManager();
  const { data: { user: manager } } = await supabase.auth.getUser();

  const { error } = await supabaseAdmin
    .from("mission_logs")
    .update({ approved_at: new Date().toISOString(), approved_by: manager!.id })
    .eq("id", missionLogId);
  if (error) throw new Error("승인에 실패했어요");

  // 참여자 펫이 2단계라면 3단계로 진화
  const { data: pet } = await supabaseAdmin
    .from("pets")
    .select("stage")
    .eq("user_id", participantId)
    .single();

  if (pet?.stage === 2) {
    await supabaseAdmin.from("pets").update({ stage: 3 }).eq("user_id", participantId);
  }

  revalidatePath(`/admin/participants/${participantId}`);
}

export async function toggleIsolation(userId: string, isIsolated: boolean) {
  await assertManager();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_isolated: isIsolated })
    .eq("id", userId);
  if (error) throw new Error("격리 설정에 실패했어요");
  revalidatePath(`/admin/participants/${userId}`);
}

export async function updateFeedContent(logId: string, content: string) {
  await assertManager();
  const { error } = await supabaseAdmin
    .from("mission_logs")
    .update({ content })
    .eq("id", logId);
  if (error) throw new Error("수정에 실패했어요");
  revalidatePath("/feed");
}
