"use client";

import { useState } from "react";
import CreateParticipantModal from "./CreateParticipantModal";

export default function AddParticipantButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-extrabold bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-lg btn-pixel"
      >
        + 참여자 추가
      </button>
      {open && <CreateParticipantModal onClose={() => setOpen(false)} />}
    </>
  );
}
