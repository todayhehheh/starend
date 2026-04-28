"use client";

import { useState, useTransition } from "react";
import { updateMission } from "@/lib/adminActions";

interface Props {
  missionId: string;
  isActive: boolean;
}

export default function ToggleMissionButton({ missionId, isActive }: Props) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      try {
        await updateMission(missionId, { isActive: next });
      } catch {
        setActive(!next);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border transition-colors ${
        active
          ? "bg-green-50 text-green-700 border-green-300"
          : "bg-gray-50 text-gray-400 border-gray-200"
      }`}
    >
      {active ? "활성" : "비활성"}
    </button>
  );
}
