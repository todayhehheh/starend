"use client";

import { useTransition } from "react";
import { deleteMission } from "@/lib/adminActions";

interface Props {
  missionId: string;
  onDone?: () => void;
}

export default function DeleteMissionButton({ missionId, onDone }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("미션을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteMission(missionId);
      onDone?.();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-[10px] font-extrabold px-2 py-1 rounded-lg border border-red-200 text-red-400 bg-red-50 disabled:opacity-50"
    >
      삭제
    </button>
  );
}
