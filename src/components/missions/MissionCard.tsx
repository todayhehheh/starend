"use client";

import { useState } from "react";
import type { Mission } from "@/types";
import MissionCompleteModal from "./MissionCompleteModal";

const DIFFICULTY_STYLE = {
  easy: { label: "쉬움", bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
  medium: { label: "보통", bg: "#fff8e1", text: "#f57f17", border: "#ffe082" },
  hard: { label: "어려움", bg: "#fce4ec", text: "#c62828", border: "#f48fb1" },
};

interface Props {
  mission: Mission;
  isCompleted: boolean;
  pendingApproval?: boolean;
}

export default function MissionCard({ mission, isCompleted, pendingApproval }: Props) {
  const [showModal, setShowModal] = useState(false);
  const diff = DIFFICULTY_STYLE[mission.difficulty];

  return (
    <>
      <div
        className={`relative bg-[var(--color-card)] rounded-2xl p-4 pixel-border transition-opacity ${
          isCompleted ? "opacity-55" : ""
        }`}
      >
        {isCompleted && !pendingApproval && (
          <div
            className="absolute top-3 right-3 text-xs font-extrabold px-2 py-0.5 rounded-lg border-2"
            style={{
              color: "var(--color-success)",
              borderColor: "var(--color-success)",
              animation: "stampIn 0.3s ease-out",
              transform: "rotate(-8deg)",
            }}
          >
            완료!
          </div>
        )}
        {pendingApproval && (
          <div
            className="absolute top-3 right-3 text-xs font-extrabold px-2 py-0.5 rounded-lg border-2"
            style={{ color: "#7c3aed", borderColor: "#7c3aed", transform: "rotate(-6deg)" }}
          >
            승인 대기 중
          </div>
        )}

        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none mt-0.5">{mission.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm">{mission.title}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full border"
                style={{ background: diff.bg, color: diff.text, borderColor: diff.border }}
              >
                {diff.label}
              </span>
              {mission.assigned_to && (
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  🎯 나의 목표
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
              {mission.description}
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-xs font-extrabold text-[var(--color-secondary)]">
                🪙 +{mission.coins}
              </span>
              {!isCompleted && (
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs font-extrabold bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-lg btn-pixel"
                >
                  {mission.requires_approval ? "완료 요청" : "완료하기"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <MissionCompleteModal
          mission={mission}
          onClose={() => setShowModal(false)}
          requiresApproval={mission.requires_approval}
        />
      )}
    </>
  );
}
