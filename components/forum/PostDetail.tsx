"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft, Gamepad2, Pin, Send, Check, X, Trash2, MessageSquareOff, MessageSquare } from "lucide-react";

type Author = { id: string; name: string | null; image: string | null; level: number; xp: number; role: string };
type Post = {
  id: string; title: string; content: string; game: string | null;
  pinned: boolean; commentsEnabled: boolean; createdAt: string; author: Author;
};
type Comment = {
  id: string; content: string; approved: boolean; createdAt: string;
  author: { id: string; name: string | null; image: string | null; level: number };
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just nu";
  if (mins < 60) return `${mins}m sedan`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h sedan`;
  return `${Math.floor(hrs / 24)}d sedan`;
}

function Avatar({ image, name, size = 28 }: { image: string | null; name: string | null; size?: number }) {
  if (image) {
    return <Image src={image} alt="" width={size} height={size} className="rounded-full object-cover shrink-0" />;
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-slate-700 flex items-center justify-center text-[11px] text-slate-400 shrink-0"
    >
      {name?.[0] ?? "?"}
    </div>
  );
}

export default function PostDetail({
  post: initialPost,
  isAdmin,
}: {
  post: Post;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/forum/${post.id}/comments`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data); })
      .finally(() => setLoadingComments(false));
    // Increment view count
    fetch(`/api/forum/${post.id}/view`, { method: "POST" }).catch(() => {});
  }, [post.id]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/forum/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText }),
    });
    if (res.ok) {
      const newComment: Comment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    }
    setSubmitting(false);
  }

  async function handleApprove(commentId: string, approved: boolean) {
    await fetch(`/api/forum/${post.id}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, approved } : c));
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Radera kommentaren?")) return;
    await fetch(`/api/forum/${post.id}/comments/${commentId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  async function handleToggleComments() {
    const res = await fetch(`/api/forum/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentsEnabled: !post.commentsEnabled }),
    });
    if (res.ok) {
      setPost((p) => ({ ...p, commentsEnabled: !p.commentsEnabled }));
    }
  }

  const approvedComments = comments.filter((c) => c.approved);
  const pendingComments = comments.filter((c) => !c.approved);

  return (
    <main className="space-y-6">
      {/* Back link */}
      <Link
        href="/forum"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Tillbaka till forum
      </Link>

      {/* Post card */}
      <div className={cn(
        "rounded-2xl border p-6",
        post.pinned
          ? "border-amber-500/50 bg-amber-950/20 shadow-[0_0_28px_rgba(245,158,11,0.12)]"
          : "border-white/8 bg-slate-900/50"
      )}>
        {/* Author row — top */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar image={post.author.image} name={post.author.name} size={post.pinned ? 44 : 36} />
            <div>
              <div className="flex items-center gap-2">
                <p className={cn("font-semibold text-base", post.pinned ? "text-amber-100" : "text-white")}>
                  {post.author.name ?? "Okänd"}
                </p>
                {post.author.role === "ADMIN" && (
                  <span className="inline-flex items-center rounded border border-neon-cyan/40 bg-neon-cyan/10 px-1.5 py-px text-[8px] font-bold uppercase tracking-widest text-neon-cyan">
                    Owner
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Lv {post.author.level} · {post.author.xp} XP · {timeAgo(post.createdAt)}</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={handleToggleComments}
              title={post.commentsEnabled ? "Stäng av kommentarer" : "Aktivera kommentarer"}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors shrink-0",
                post.commentsEnabled
                  ? "border-white/10 text-slate-400 hover:border-red-500/30 hover:text-red-400"
                  : "border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/5"
              )}
            >
              {post.commentsEnabled ? <><MessageSquareOff size={12} /> Stäng kommentarer</> : <><MessageSquare size={12} /> Öppna kommentarer</>}
            </button>
          )}
        </div>

        {/* Pinned badge */}
        {post.pinned && (
          <div className="flex items-center gap-2 mb-3">
            <Pin size={11} className="text-amber-400" />
            <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Officiellt
            </span>
          </div>
        )}

        {post.game && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neon-cyan">
              <Gamepad2 size={10} /> {post.game}
            </span>
          </div>
        )}

        <h1 className={cn("text-xl font-bold mb-3", post.pinned ? "text-amber-50" : "text-white")}>
          {post.title}
        </h1>
        <p className={cn("text-sm whitespace-pre-wrap leading-relaxed", post.pinned ? "text-amber-100/70" : "text-slate-300")}>
          {post.content}
        </p>
      </div>

      {/* Comments section */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Kommentarer {approvedComments.length > 0 && `· ${approvedComments.length}`}
        </p>

        {/* Pending comments (admin only) */}
        {isAdmin && pendingComments.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-amber-500/70">
              Väntar på godkännande · {pendingComments.length} st
            </p>
            {pendingComments.map((c) => (
              <div key={c.id} className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar image={c.author.image} name={c.author.name} size={22} />
                    <span className="text-xs text-amber-200/70">{c.author.name ?? "Okänd"}</span>
                    <span className="text-[10px] text-slate-600">· {timeAgo(c.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleApprove(c.id, true)}
                      title="Godkänn"
                      className="rounded-lg border border-emerald-500/30 p-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      title="Radera"
                      className="rounded-lg border border-white/10 p-1.5 text-slate-500 hover:border-red-500/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Approved comments */}
        {loadingComments ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/5 bg-slate-900/40" />
          ))
        ) : approvedComments.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-slate-900/30 py-10 text-center text-slate-500 text-sm">
            Inga kommentarer än
          </div>
        ) : (
          approvedComments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/8 bg-slate-900/50 p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Avatar image={c.author.image} name={c.author.name} size={22} />
                  <span className="text-xs text-slate-300">{c.author.name ?? "Okänd"}</span>
                  <span className="text-[10px] text-slate-600">· Lv {c.author.level} · {timeAgo(c.createdAt)}</span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleApprove(c.id, false)}
                      title="Dra tillbaka godkännande"
                      className="rounded-lg border border-white/10 p-1.5 text-slate-500 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      title="Radera"
                      className="rounded-lg border border-white/10 p-1.5 text-slate-500 hover:border-red-500/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))
        )}

        {/* Comment form */}
        {post.commentsEnabled ? (
          submitted ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 px-4 py-3 text-sm text-emerald-400">
              Kommentaren skickades och väntar på godkännande.
            </div>
          ) : (
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Skriv en kommentar…"
                className="flex-1 rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-cyan/40"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 px-4 py-2 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/25 disabled:opacity-50"
              >
                <Send size={13} />
                {submitting ? "…" : "Skicka"}
              </button>
            </form>
          )
        ) : (
          <div className="rounded-2xl border border-white/5 bg-slate-900/30 px-4 py-3 text-sm text-slate-500">
            Kommentarer är stängda för detta inlägg.
          </div>
        )}
      </div>
    </main>
  );
}
