"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import MissionFormModal from "@/components/admin/MissionFormModal";
import ToggleMissionButton from "@/components/admin/ToggleMissionButton";
import DeleteMissionButton from "@/components/admin/DeleteMissionButton";
import { kstDateStr } from "@/lib/date";
import { resetParticipantPassword, updateParticipantUsername, approveQuestCompletion, toggleIsolation } from "@/lib/adminActions";
import type { Mission, Profile, Pet } from "@/types";

const MOOD_EMOJI = ["", "😭", "😔", "😐", "🙂", "😄"];
const STAGE_LABEL = ["", "돌멩이", "반짝이는 돌", "별 ✨", "별자리 ✨✨"];
const DIFFICULTY_COLOR = { easy: "#2e7d32", medium: "#f57f17", hard: "#c62828" };

function statColor(v: number) {
  if (v >= 60) return "#52b788";
  if (v >= 30) return "#f4a261";
  return "#ef476f";
}

interface LoginInfo {
  username: string;
  auth_email: string;
}

interface PhotoLog {
  id: string;
  photo_url: string;
  content: string;
  coins_earned: number;
  created_at: string;
  missions: { title: string; emoji: string } | null;
}

interface PendingApproval {
  id: string;
  content: string;
  coins_earned: number;
  created_at: string;
  missions: { title: string; emoji: string } | null;
}

export default function ParticipantDetailPage() {
  const params = useParams();
  const participantId = params.id as string;

  const [profile, setProfile] = useState<Pick<Profile, "nickname" | "coins" | "is_isolated"> | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [loginInfo, setLoginInfo] = useState<LoginInfo | null>(null);
  const [personalMissions, setPersonalMissions] = useState<Mission[]>([]);
  const [weekMoods, setWeekMoods] = useState<(number | null)[]>(Array(7).fill(null));
  const [weekMissionCount, setWeekMissionCount] = useState(0);
  const [recentPhotos, setRecentPhotos] = useState<PhotoLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mission | undefined>();

  // 계정 정보 편집 상태
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isApprovePending, startApproveTransition] = useTransition();

  async function load() {
    const supabase = createClient();
    const weekAgoStr = kstDateStr(Date.now() - 6 * 86400000);
    const tomorrowStr = kstDateStr(Date.now() + 86400000);
    const weekAgoISO = `${weekAgoStr}T00:00:00+09:00`;
    const tomorrowISO = `${tomorrowStr}T00:00:00+09:00`;

    const [
      { data: profileData },
      { data: petData },
      { data: loginData },
      { data: missionData },
      { data: moodData },
      { data: logData },
      { data: photoData },
      { data: pendingData },
    ] = await Promise.all([
      supabase.from("profiles").select("nickname, coins, is_isolated").eq("id", participantId).single(),
      supabase.from("pets").select("*").eq("user_id", participantId).single(),
      supabase.from("participant_logins").select("username, auth_email").eq("user_id", participantId).single(),
      supabase.from("missions").select("*").eq("assigned_to", participantId).order("created_at", { ascending: false }),
      supabase.from("mood_checkins").select("mood, created_at")
        .eq("user_id", participantId)
        .gte("created_at", weekAgoISO).lt("created_at", tomorrowISO),
      supabase.from("mission_logs").select("created_at")
        .eq("user_id", participantId)
        .gte("created_at", weekAgoISO).lt("created_at", tomorrowISO),
      supabase.from("mission_logs")
        .select("id, photo_url, content, coins_earned, created_at, missions:mission_id(title, emoji)")
        .eq("user_id", participantId)
        .not("photo_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("mission_logs")
        .select("id, content, coins_earned, created_at, missions:mission_id(title, emoji, requires_approval)")
        .eq("user_id", participantId)
        .is("approved_at", null),
    ]);

    setProfile(profileData as Pick<Profile, "nickname" | "coins" | "is_isolated"> | null);
    setPet(petData as Pet | null);
    setLoginInfo(loginData as LoginInfo | null);
    setPersonalMissions((missionData ?? []) as Mission[]);
    setWeekMissionCount(logData?.length ?? 0);
    setRecentPhotos((photoData ?? []) as unknown as PhotoLog[]);
    const rawPending = (pendingData ?? []) as unknown as (PendingApproval & { missions: { requires_approval?: boolean } | null })[];
    setPendingApprovals(
      rawPending.filter(l => l.missions?.requires_approval) as unknown as PendingApproval[]
    );

    // KST 기준 7일 기분 집계 (today = index 6)
    const todayKST = kstDateStr();
    const moods: (number | null)[] = Array(7).fill(null);
    for (const c of moodData ?? []) {
      const checkinKST = kstDateStr(new Date(c.created_at).getTime());
      const daysAgo = Math.round(
        (new Date(todayKST).getTime() - new Date(checkinKST).getTime()) / 86400000
      );
      const idx = 6 - daysAgo;
      if (idx >= 0 && idx < 7 && moods[idx] === null) moods[idx] = c.mood;
    }
    setWeekMoods(moods);
  }

  useEffect(() => { load(); }, [participantId]);

  function handleApprove(logId: string) {
    startApproveTransition(async () => {
      await approveQuestCompletion(logId, participantId);
      load();
    });
  }

  function handleToggleIsolation() {
    const next = !(profile?.is_isolated ?? false);
    startTransition(async () => {
      await toggleIsolation(participantId, next);
      load();
    });
  }

  function openCreate() { setEditing(undefined); setModalOpen(true); }
  function openEdit(m: Mission) { setEditing(m); setModalOpen(true); }
  function handleClose() { setModalOpen(false); setEditing(undefined); load(); }

  function startUsernameEdit() {
    setNewUsername(loginInfo?.username ?? "");
    setAccountError("");
    setEditingUsername(true);
  }

  function startPasswordEdit() {
    setNewPassword("");
    setAccountError("");
    setEditingPassword(true);
  }

  function saveUsername() {
    if (!newUsername.trim()) return;
    setAccountError("");
    startTransition(async () => {
      try {
        await updateParticipantUsername(participantId, newUsername.trim());
        setEditingUsername(false);
        load();
      } catch (err: unknown) {
        setAccountError(err instanceof Error ? err.message : "오류가 발생했어요");
      }
    });
  }

  function savePassword() {
    if (newPassword.length < 6) { setAccountError("6자 이상 입력해주세요"); return; }
    setAccountError("");
    startTransition(async () => {
      try {
        await resetParticipantPassword(participantId, newPassword);
        setEditingPassword(false);
        setNewPassword("");
      } catch (err: unknown) {
        setAccountError(err instanceof Error ? err.message : "오류가 발생했어요");
      }
    });
  }

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const dateStr = kstDateStr(Date.now() - (6 - i) * 86400000);
    const dow = new Date(dateStr + "T12:00:00+09:00").getDay();
    return ["일", "월", "화", "수", "목", "금", "토"][dow];
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Link href="/admin" className="text-sm text-[var(--color-muted)]">← 뒤로</Link>
        <span className="text-base font-extrabold">{profile?.nickname ?? "..."}</span>
        {profile && <span className="text-xs text-[var(--color-muted)]">🪙 {profile.coins}</span>}
        <div className="ml-auto">
          <button
            onClick={handleToggleIsolation}
            disabled={isPending || !profile}
            className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border-2 btn-pixel disabled:opacity-50 ${
              profile?.is_isolated
                ? "bg-red-50 border-red-300 text-red-600"
                : "bg-gray-50 border-gray-300 text-gray-500"
            }`}
          >
            {profile?.is_isolated ? "🔴 격리 중" : "격리"}
          </button>
        </div>
      </div>

      {/* 계정 정보 */}
      <div className="bg-[var(--color-card)] pixel-border rounded-2xl p-4 mb-4">
        <div className="text-xs font-bold text-[var(--color-muted)] mb-3">계정 정보</div>

        {/* 아이디 */}
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <div className="text-[10px] text-[var(--color-muted)]">아이디</div>
            {editingUsername ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  maxLength={20}
                  className="border-2 border-[var(--color-border)] bg-[var(--color-card)] rounded-lg px-2 py-1 text-sm outline-none focus:border-[var(--color-primary)] w-36"
                />
                <button
                  onClick={saveUsername}
                  disabled={isPending}
                  className="text-xs font-extrabold bg-[var(--color-primary)] text-white px-2.5 py-1 rounded-lg btn-pixel disabled:opacity-60"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingUsername(false)}
                  className="text-xs text-[var(--color-muted)] px-2 py-1"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="font-bold text-sm font-mono mt-0.5">{loginInfo?.username ?? "—"}</div>
            )}
          </div>
          {!editingUsername && (
            <button
              onClick={startUsernameEdit}
              className="text-xs font-bold text-[var(--color-primary)] bg-purple-50 px-2.5 py-1 rounded-lg"
            >
              변경
            </button>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--color-muted)]">비밀번호</div>
            {editingPassword ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="6자 이상"
                  minLength={6}
                  className="border-2 border-[var(--color-border)] bg-[var(--color-card)] rounded-lg px-2 py-1 text-sm outline-none focus:border-[var(--color-primary)] font-mono w-36"
                />
                <button
                  onClick={savePassword}
                  disabled={isPending}
                  className="text-xs font-extrabold bg-[var(--color-primary)] text-white px-2.5 py-1 rounded-lg btn-pixel disabled:opacity-60"
                >
                  설정
                </button>
                <button
                  onClick={() => setEditingPassword(false)}
                  className="text-xs text-[var(--color-muted)] px-2 py-1"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="font-bold text-sm tracking-widest mt-0.5">••••••</div>
            )}
          </div>
          {!editingPassword && (
            <button
              onClick={startPasswordEdit}
              className="text-xs font-bold text-[var(--color-primary)] bg-purple-50 px-2.5 py-1 rounded-lg"
            >
              재설정
            </button>
          )}
        </div>

        {accountError && (
          <p className="text-[var(--color-danger)] text-xs mt-2 bg-red-50 rounded-xl p-2 border border-red-200">
            {accountError}
          </p>
        )}
      </div>

      {/* 별 상태 */}
      {pet && (
        <div className="bg-[var(--color-card)] pixel-border rounded-2xl p-4 mb-4">
          <div className="text-xs font-bold text-[var(--color-muted)] mb-2">{STAGE_LABEL[pet.stage]}</div>
          <div className="flex gap-4">
            {[
              { label: "따뜻함", val: pet.hunger,      emoji: "🌡️" },
              { label: "반짝임", val: pet.happiness,   emoji: "✨" },
              { label: "맑음",   val: pet.cleanliness, emoji: "💎" },
            ].map(({ label, val, emoji }) => (
              <div key={label} className="flex-1 text-center">
                <div className="text-lg">{emoji}</div>
                <div className="text-xs font-extrabold mt-0.5" style={{ color: statColor(val) }}>{val}</div>
                <div className="text-[10px] text-[var(--color-muted)]">{label}</div>
                <div className="w-full h-1.5 bg-[var(--color-border)] rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${val}%`, background: statColor(val) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7일 기분 추이 */}
      <div className="bg-[var(--color-card)] pixel-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-extrabold">7일 기분 추이</span>
          <span className="text-xs text-[var(--color-muted)]">이번 주 미션 {weekMissionCount}개</span>
        </div>
        <div className="flex justify-between">
          {dayLabels.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xl leading-none">{weekMoods[i] !== null ? MOOD_EMOJI[weekMoods[i]!] : "·"}</span>
              <span className="text-[10px] text-[var(--color-muted)]">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 인증 사진 */}
      {recentPhotos.length > 0 && (
        <div className="mb-4">
          <span className="text-sm font-extrabold">📷 최근 인증 사진</span>
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {recentPhotos.map(p => (
              <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-border)]">
                <img
                  src={p.photo_url}
                  alt="인증"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1.5 py-1">
                  <p className="text-white text-[9px] font-bold truncate">
                    {p.missions?.emoji} {p.missions?.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 대기 중인 승인 요청 */}
      {pendingApprovals.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-extrabold text-purple-700">🔮 승인 대기 중</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: "var(--color-primary)" }}
            >
              {pendingApprovals.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {pendingApprovals.map(log => (
              <div
                key={log.id}
                className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center gap-3"
              >
                <span className="text-xl leading-none">{log.missions?.emoji ?? "🌟"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{log.missions?.title ?? "진화 퀘스트"}</div>
                  {log.content && (
                    <div className="text-xs text-[var(--color-muted)] mt-0.5 truncate">{log.content}</div>
                  )}
                  <div className="text-[10px] text-purple-500 mt-0.5">
                    {new Date(log.created_at).toLocaleDateString("ko-KR")} 요청
                  </div>
                </div>
                <button
                  onClick={() => handleApprove(log.id)}
                  disabled={isApprovePending}
                  className="text-xs font-extrabold bg-purple-600 text-white px-3 py-1.5 rounded-lg btn-pixel disabled:opacity-60 shrink-0"
                >
                  {isApprovePending ? "..." : "승인"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 나만의 목표 미션 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-extrabold">🎯 나만의 목표 미션</span>
          <button
            onClick={openCreate}
            className="text-xs font-extrabold bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-lg btn-pixel"
          >
            + 추가
          </button>
        </div>

        {personalMissions.length === 0 && (
          <p className="text-xs text-[var(--color-muted)] text-center py-6 bg-[var(--color-card)] pixel-border rounded-2xl">
            아직 개인 미션이 없어요
            <br />상담 후 목표를 함께 세워보세요
          </p>
        )}

        <div className="flex flex-col gap-2">
          {personalMissions.map(m => (
            <div
              key={m.id}
              className={`bg-[var(--color-card)] pixel-border rounded-xl p-3 flex items-center gap-2 ${!m.is_active ? "opacity-50" : ""}`}
            >
              <span className="text-xl leading-none">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{m.title}</div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                  <span style={{ color: DIFFICULTY_COLOR[m.difficulty] }}>
                    {m.difficulty === "easy" ? "쉬움" : m.difficulty === "medium" ? "보통" : "어려움"}
                  </span>
                  <span>🪙 {m.coins}</span>
                  {m.expires_at && <span>~ {m.expires_at.split("T")[0]}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ToggleMissionButton missionId={m.id} isActive={m.is_active} />
                <button
                  onClick={() => openEdit(m)}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg border border-[var(--color-border)] bg-white"
                >
                  수정
                </button>
                <DeleteMissionButton missionId={m.id} onDone={load} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <MissionFormModal
        open={modalOpen}
        onClose={handleClose}
        assignedTo={participantId}
        initial={editing}
      />
    </div>
  );
}
