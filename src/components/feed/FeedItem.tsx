"use client";

import { useState, useTransition } from "react";
import type { FeedLog, ReactionType } from "@/types";
import { toggleReaction } from "@/lib/actions";
import { deleteFeedItem, updateFeedContent } from "@/lib/adminActions";

interface Props {
  log: FeedLog;
  currentUserId: string;
  isManager?: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function FeedItem({ log, currentUserId, isManager }: Props) {
  const [reactions, setReactions] = useState(log.reactions);
  const [deleted, setDeleted] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [editText, setEditText] = useState(log.content ?? "");
  const [displayContent, setDisplayContent] = useState(log.content ?? "");
  const [isPending, startTransition] = useTransition();

  if (deleted) return null;

  const likes = reactions.filter(r => r.type === "like");
  const cheers = reactions.filter(r => r.type === "cheer");
  const iLiked = likes.some(r => r.user_id === currentUserId);
  const iCheered = cheers.some(r => r.user_id === currentUserId);

  function handleReaction(type: ReactionType) {
    if (isPending) return;
    const existing = reactions.find(r => r.user_id === currentUserId && r.type === type);
    if (existing) {
      setReactions(prev => prev.filter(r => r.id !== existing.id));
    } else {
      setReactions(prev => [...prev, { id: `tmp_${Date.now()}`, user_id: currentUserId, type }]);
    }
    startTransition(async () => {
      try {
        await toggleReaction(log.id, type);
      } catch {
        setReactions(log.reactions);
      }
    });
  }

  function handleDelete() {
    if (!confirm("이 게시물을 삭제할까요?")) return;
    setDeleted(true);
    startTransition(async () => {
      try {
        await deleteFeedItem(log.id);
      } catch {
        setDeleted(false);
      }
    });
  }

  function handleSaveContent() {
    startTransition(async () => {
      try {
        await updateFeedContent(log.id, editText);
        setDisplayContent(editText);
        setEditingContent(false);
      } catch {
        setEditText(displayContent);
        setEditingContent(false);
      }
    });
  }

  return (
    <div className="bg-[var(--color-card)] rounded-2xl pixel-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-extrabold text-[var(--color-primary)] shrink-0">
          {log.profiles?.nickname?.[0] ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold truncate">{log.profiles?.nickname ?? "익명"}</p>
          <p className="text-[10px] text-[var(--color-muted)]">{formatTimeAgo(log.created_at)}</p>
        </div>
        <div className="text-xs bg-purple-50 text-[var(--color-primary)] font-bold px-2.5 py-1 rounded-lg shrink-0 max-w-[120px] truncate">
          {log.missions?.emoji} {log.missions?.title}
        </div>
        {isManager && (
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <button
              onClick={() => { setEditingContent(true); setEditText(displayContent); }}
              className="text-[10px] font-bold px-2 py-1 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-muted)]"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-[10px] font-bold px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-400 disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* Photo */}
      <div className="w-full overflow-hidden" style={{ background: "#ece8e0" }}>
        <img
          src={log.photo_url}
          alt="인증 사진"
          className="w-full object-contain block"
          style={{ maxHeight: "400px" }}
          loading="lazy"
        />
      </div>

      {/* Caption + reactions */}
      <div className="px-4 py-3">
        {editingContent ? (
          <div className="mb-3">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={3}
              className="w-full border-2 border-[var(--color-border)] bg-[var(--color-card)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] resize-none"
            />
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={handleSaveContent}
                disabled={isPending}
                className="flex-1 py-1.5 rounded-xl bg-[var(--color-primary)] text-white font-extrabold text-xs btn-pixel disabled:opacity-60"
              >
                저장
              </button>
              <button
                onClick={() => setEditingContent(false)}
                className="flex-1 py-1.5 rounded-xl border-2 border-[var(--color-border)] text-xs font-bold text-[var(--color-muted)]"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          displayContent && (
            <p className="text-sm mb-3 text-[var(--color-foreground)]">{displayContent}</p>
          )
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleReaction("like")}
            className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border-2 transition-all active:scale-95 ${
              iLiked
                ? "border-pink-400 bg-pink-50 text-pink-500"
                : "border-[var(--color-border)] text-[var(--color-muted)]"
            }`}
          >
            <span>❤️</span>
            {likes.length > 0 && <span>{likes.length}</span>}
          </button>
          <button
            onClick={() => handleReaction("cheer")}
            className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border-2 transition-all active:scale-95 ${
              iCheered
                ? "border-yellow-400 bg-yellow-50 text-yellow-600"
                : "border-[var(--color-border)] text-[var(--color-muted)]"
            }`}
          >
            <span>🎉</span>
            {cheers.length > 0 && <span>{cheers.length}</span>}
          </button>
          <span className="ml-auto text-xs text-[var(--color-muted)] font-bold">
            🪙 +{log.coins_earned}
          </span>
        </div>
      </div>
    </div>
  );
}
