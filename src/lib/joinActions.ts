"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function setupFromInvite(
  token: string,
  username: string,
  password: string,
  petName: string,
): Promise<{ authEmail: string }> {
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("id, used_at")
    .eq("token", token)
    .single();

  if (!invite || invite.used_at) throw new Error("유효하지 않은 초대 링크예요");

  // 아이디 중복 확인
  const { data: dup } = await supabaseAdmin
    .from("participant_logins")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();
  if (dup) throw new Error("이미 사용 중인 아이디예요");

  const randomId = Math.random().toString(36).slice(2, 10);
  const authEmail = `p_${randomId}@star.app`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: { nickname: username },
  });

  if (error) throw new Error("계정 생성에 실패했어요");

  const userId = data.user.id;

  if (petName.trim()) {
    await supabaseAdmin.from("pets").update({ name: petName.trim() }).eq("user_id", userId);
  }

  const { error: loginError } = await supabaseAdmin.from("participant_logins").insert({
    user_id: userId,
    username,
    auth_email: authEmail,
  });

  if (loginError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error("아이디 저장에 실패했어요");
  }

  await supabase.rpc("use_invite", { p_token: token });

  return { authEmail };
}
