import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MissionCard from "@/components/missions/MissionCard";
import { getTodayRange } from "@/lib/date";
import type { Mission } from "@/types";

export default async function MissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { todayStart, tomorrowStart } = getTodayRange();

  const { data: missions } = await supabase.from("missions").select("*").eq("is_active", true).order("created_at");
  const allMissionsRaw = (missions ?? []) as Mission[];
  const approvalMissionIds = allMissionsRaw.filter(m => m.requires_approval).map(m => m.id);

  const [{ data: todayLogs }, { data: approvalLogs }] = await Promise.all([
    supabase.from("mission_logs").select("mission_id")
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .lt("created_at", tomorrowStart),
    approvalMissionIds.length > 0
      ? supabase.from("mission_logs").select("mission_id, approved_at")
          .eq("user_id", user.id)
          .in("mission_id", approvalMissionIds)
      : Promise.resolve({ data: [] as { mission_id: string; approved_at: string | null }[], error: null }),
  ]);

  const completedTodayIds = new Set(todayLogs?.map(l => l.mission_id) ?? []);
  const pendingApprovalIds = new Set(
    (approvalLogs ?? []).filter(l => !l.approved_at).map(l => l.mission_id)
  );
  const submittedApprovalIds = new Set((approvalLogs ?? []).map(l => l.mission_id));
  const completedIds = new Set([...completedTodayIds, ...submittedApprovalIds]);
  const allMissions = allMissionsRaw;
  const personalMissions = allMissions.filter(m => m.assigned_to !== null);
  const publicMissions = allMissions.filter(m => m.assigned_to === null);
  const completedCount = completedIds.size;
  const remainingCoins = allMissions
    .filter(m => !completedIds.has(m.id))
    .reduce((sum, m) => sum + m.coins, 0);

  const groups = [
    { key: "easy",   label: "쉬움",   emoji: "🌱", color: "#2e7d32" },
    { key: "medium", label: "보통",   emoji: "⭐", color: "#f57f17" },
    { key: "hard",   label: "어려움", emoji: "🔥", color: "#c62828" },
  ] as const;

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-lg font-extrabold text-[var(--color-primary)]">오늘의 미션</h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="text-sm text-[var(--color-muted)]">
            완료 <span className="font-extrabold text-[var(--color-success)]">{completedCount}</span>{" "}
            / {allMissions.length}
          </div>
          {remainingCoins > 0 && (
            <div className="text-sm text-[var(--color-muted)]">
              🪙 <span className="font-extrabold text-[var(--color-secondary)]">+{remainingCoins}</span> 획득 가능
            </div>
          )}
        </div>
        <div className="w-full h-2 bg-[var(--color-border)] rounded-full mt-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${allMissions.length > 0 ? (completedCount / allMissions.length) * 100 : 0}%`,
              background: "var(--color-success)",
            }}
          />
        </div>
      </header>

      {/* 나만의 목표 섹션 */}
      {personalMissions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-extrabold mb-3 flex items-center gap-1.5 text-purple-700">
            <span>🎯</span>
            <span>나만의 목표</span>
          </h2>
          <div className="flex flex-col gap-3">
            {personalMissions.map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                isCompleted={completedIds.has(mission.id)}
                pendingApproval={pendingApprovalIds.has(mission.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 공통 미션 섹션 */}
      {groups.map(({ key, label, emoji, color }) => {
        const group = publicMissions.filter(m => m.difficulty === key);
        if (group.length === 0) return null;
        return (
          <div key={key} className="mb-6">
            <h2 className="text-sm font-extrabold mb-3 flex items-center gap-1.5" style={{ color }}>
              <span>{emoji}</span>
              <span>{label}</span>
            </h2>
            <div className="flex flex-col gap-3">
              {group.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  isCompleted={completedIds.has(mission.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
