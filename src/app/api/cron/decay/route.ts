import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  // Vercel이 자동으로 Authorization: Bearer {CRON_SECRET} 헤더를 보냄
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 참여자 ID 목록 조회
  const { data: participants } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "participant");

  const ids = (participants ?? []).map(p => p.id);
  if (!ids.length) return NextResponse.json({ ok: true, updated: 0 });

  // 현재 스탯 조회
  const { data: pets } = await supabaseAdmin
    .from("pets")
    .select("id, user_id, hunger, happiness, cleanliness")
    .in("user_id", ids);

  if (!pets?.length) return NextResponse.json({ ok: true, updated: 0 });

  // 스탯 감소 계산 (updated_at 건드리지 않음 → 관리자 "마지막 활동" 기준 유지)
  const updates = pets.map(pet => ({
    id:          pet.id,
    user_id:     pet.user_id,
    hunger:      Math.max(0, pet.hunger      - 8),
    happiness:   Math.max(0, pet.happiness   - 8),
    cleanliness: Math.max(0, pet.cleanliness - 5),
  }));

  const { error } = await supabaseAdmin
    .from("pets")
    .upsert(updates, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, updated: updates.length });
}
