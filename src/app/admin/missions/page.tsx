"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import MissionFormModal from "@/components/admin/MissionFormModal";
import ToggleMissionButton from "@/components/admin/ToggleMissionButton";
import DeleteMissionButton from "@/components/admin/DeleteMissionButton";
import type { Mission } from "@/types";

const DIFFICULTY_STYLE = {
  easy:   { label: "쉬움",  color: "#2e7d32" },
  medium: { label: "보통",  color: "#f57f17" },
  hard:   { label: "어려움", color: "#c62828" },
};

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mission | undefined>();

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("missions")
      .select("*")
      .is("assigned_to", null)
      .order("difficulty")
      .order("created_at");
    setMissions((data ?? []) as Mission[]);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(undefined); setModalOpen(true); }
  function openEdit(m: Mission) { setEditing(m); setModalOpen(true); }
  function handleClose() { setModalOpen(false); setEditing(undefined); load(); }

  const groups = [
    { key: "easy",   label: "쉬움",   emoji: "🌱" },
    { key: "medium", label: "보통",   emoji: "⭐" },
    { key: "hard",   label: "어려움", emoji: "🔥" },
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-extrabold">공통 미션 관리</h2>
        <button
          onClick={openCreate}
          className="text-xs font-extrabold bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-lg btn-pixel"
        >
          + 새 미션
        </button>
      </div>

      {groups.map(({ key, label, emoji }) => {
        const group = missions.filter(m => m.difficulty === key);
        return (
          <div key={key} className="mb-6">
            <h3 className="text-sm font-extrabold mb-2 flex items-center gap-1.5"
                style={{ color: DIFFICULTY_STYLE[key].color }}>
              {emoji} {label}
              <span className="text-xs font-normal text-[var(--color-muted)]">({group.length})</span>
            </h3>
            {group.length === 0 && (
              <p className="text-xs text-[var(--color-muted)] pl-2">없음</p>
            )}
            <div className="flex flex-col gap-2">
              {group.map(m => (
                <div key={m.id}
                     className={`bg-[var(--color-card)] pixel-border rounded-xl p-3 flex items-center gap-2 ${!m.is_active ? "opacity-50" : ""}`}>
                  <span className="text-xl leading-none">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{m.title}</div>
                    <div className="text-xs text-[var(--color-muted)]">🪙 {m.coins}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ToggleMissionButton missionId={m.id} isActive={m.is_active} />
                    <button
                      onClick={() => openEdit(m)}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg border border-[var(--color-border)] bg-white"
                    >
                      수정
                    </button>
                    <DeleteMissionButton missionId={m.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <MissionFormModal
        open={modalOpen}
        onClose={handleClose}
        initial={editing}
      />
    </div>
  );
}
