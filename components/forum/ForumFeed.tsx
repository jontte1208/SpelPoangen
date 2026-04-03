"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Gamepad2, Send, ChevronDown, ChevronUp, Clock, Pin, PinOff, Trash2, MessageCircle, Flame, Eye, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Author = { id: string; name: string | null; xp: number; level: number; image: string | null; role: string };
type Post = { id: string; title: string; content: string; game: string | null; pinned: boolean; commentsEnabled: boolean; views: number; replyCount: number; likeCount: number; likedByMe: boolean; createdAt: string; author: Author };

const GAMES = ["Valorant", "CS2", "Fortnite", "Apex Legends", "League of Legends", "Minecraft", "Rocket League", "Annat"];

const TABS: { label: string; value: string | null; icon: string }[] = [
  { label: "Alla",     value: null,       icon: "🎮" },
  { label: "CS2",      value: "CS2",      icon: "🔫" },
  { label: "Valorant", value: "Valorant", icon: "⚡" },
  { label: "LoL",      value: "League of Legends", icon: "⚔️" },
  { label: "Fortnite", value: "Fortnite", icon: "🏗️" },
  { label: "Annat",    value: "Annat",    icon: "🕹️" },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just nu";
  if (mins < 60) return `${mins}m sedan`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h sedan`;
  return `${Math.floor(hrs / 24)}d sedan`;
}

function AuthorAvatar({ author, pinned }: { author: Author; pinned: boolean }) {
  const showOwnerBadge = pinned && author.role === "ADMIN";
  const size = pinned ? 40 : 32;
  return (
    <div className="relative shrink-0">
      {author.image ? (
        <Image src={author.image} alt="" width={size} height={size} className="rounded-full object-cover" />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="rounded-full bg-slate-700 flex items-center justify-center text-[11px] text-slate-400"
        >
          {author.name?.[0] ?? "?"}
        </div>
      )}
      {showOwnerBadge && (
        <span className="absolute -bottom-1 -right-1 inline-flex items-center rounded border border-neon-cyan/40 bg-neon-cyan/10 px-[3px] py-px text-[7px] font-bold uppercase tracking-widest text-neon-cyan shadow-[0_0_6px_rgba(0,245,255,0.4)] leading-none">
          Owner
        </span>
      )}
    </div>
  );
}

function PostCard({
  post,
  currentUserId,
  isAdmin,
  onPin,
  onDelete,
  onEdit,
}: {
  post: Post;
  currentUserId: string;
  isAdmin: boolean;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Post>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [editGame, setEditGame] = useState(post.game ?? "");
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const isLong = post.content.length > 200;
  const isPinned = post.pinned;
  const router = useRouter();

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/forum/${post.id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLikeCount(data.count);
      setLikedByMe(data.liked);
    }
  }

  async function handlePin() {
    setActionLoading(true);
    await fetch(`/api/forum/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !isPinned }),
    });
    onPin(post.id, !isPinned);
    setActionLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Radera det här inlägget?")) return;
    setActionLoading(true);
    await fetch(`/api/forum/${post.id}`, { method: "DELETE" });
    onDelete(post.id);
  }

  async function handleSaveEdit() {
    setActionLoading(true);
    const res = await fetch(`/api/forum/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, content: editContent, game: editGame || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      onEdit(post.id, updated);
      setEditing(false);
    }
    setActionLoading(false);
  }

  // Accent line color: amber for pinned, neon-cyan for game posts, subtle for rest
  const accentColor = isPinned
    ? "border-l-amber-500/60"
    : post.game
    ? "border-l-neon-cyan/40"
    : "border-l-white/10";

  return (
    <div
      onClick={() => router.push(`/forum/${post.id}`)}
      className={cn(
        "group relative rounded-2xl border border-l-4 p-5 transition-colors cursor-pointer",
        accentColor,
        isPinned
          ? "border-amber-500/50 bg-amber-950/20 shadow-[0_0_28px_rgba(245,158,11,0.12)] hover:bg-amber-950/30"
          : "border-white/8 bg-slate-900/50 hover:bg-slate-900/70"
      )}
    >
      {/* Author row — always on top */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <AuthorAvatar author={post.author} pinned={isPinned} />
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-base font-semibold", isPinned ? "text-amber-100" : "text-white")}>
                {post.author.name ?? "Okänd"}
              </span>
              {post.author.id === currentUserId && (
                <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                  Du
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">Lv {post.author.level}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Admin controls — only visible on hover */}
          {isAdmin && (
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setEditing(true); setEditTitle(post.title); setEditContent(post.content); setEditGame(post.game ?? ""); }}
                title="Redigera inlägg"
                className="rounded-lg border border-white/10 p-1.5 text-slate-500 transition-colors hover:border-neon-cyan/30 hover:text-neon-cyan"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={handlePin}
                disabled={actionLoading}
                title={isPinned ? "Avfäst" : "Fäst överst"}
                className={cn(
                  "rounded-lg border p-1.5 transition-colors disabled:opacity-40",
                  isPinned
                    ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    : "border-white/10 text-slate-500 hover:border-amber-500/30 hover:text-amber-400"
                )}
              >
                {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                title="Radera inlägg"
                className="rounded-lg border border-white/10 p-1.5 text-slate-500 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Clock size={11} />
            {timeAgo(post.createdAt)}
          </div>
        </div>
      </div>

      {/* Pinned badge */}
      {isPinned && (
        <div className="flex items-center gap-2 mb-2">
          <Pin size={11} className="text-amber-400" />
          <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400">
            Officiellt
          </span>
          <span className="text-[10px] text-amber-600/60 uppercase tracking-widest">· Fäst inlägg</span>
        </div>
      )}

      {editing ? (
        /* Inline edit form */
        <div className="space-y-2 mt-1" onClick={(e) => e.stopPropagation()}>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-xl border border-neon-cyan/30 bg-slate-800/60 px-3 py-2 text-sm font-bold text-white outline-none"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-neon-cyan/30 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 outline-none"
          />
          <select
            value={editGame}
            onChange={(e) => setEditGame(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 outline-none"
          >
            <option value="">Inget spel</option>
            {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-semibold text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-50 transition-colors"
            >
              <Check size={12} /> Spara
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <X size={12} /> Avbryt
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Game tag */}
          {post.game && (
            <div className="mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neon-cyan">
                <Gamepad2 size={10} />
                {post.game}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className={cn("text-lg font-bold leading-snug", isPinned ? "text-amber-50" : "text-white")}>
            {post.title}
          </h3>

          {/* Body */}
          <p className={cn(
            "mt-1.5 text-sm leading-relaxed",
            isPinned ? "text-amber-100/60" : "text-slate-400",
            !expanded && isLong && "line-clamp-3"
          )}>
            {post.content}
          </p>
          {isLong && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="mt-1 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {expanded ? <><ChevronUp size={12} /> Visa mindre</> : <><ChevronDown size={12} /> Visa mer</>}
            </button>
          )}
        </>
      )}

      {/* Interaction row */}
      <div
        className={cn("mt-3 flex items-center gap-4 border-t pt-3", isPinned ? "border-amber-500/15" : "border-white/5")}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex items-center gap-1.5 text-slate-500 text-xs">
          <MessageCircle size={13} />
          <span>{post.replyCount} svar</span>
        </span>
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
            likedByMe ? "text-orange-400" : "text-slate-500 hover:text-orange-400"
          )}
        >
          <Flame size={13} className={likedByMe ? "fill-orange-400" : ""} />
          <span>{likeCount}</span>
        </button>
        <span className="flex items-center gap-1.5 text-slate-600 text-xs">
          <Eye size={13} />
          <span>{post.views}</span>
        </span>
      </div>
    </div>
  );
}

export default function ForumFeed({ currentUserId, isAdmin }: { currentUserId: string; isAdmin: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [game, setGame] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/forum")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPosts(data); })
      .finally(() => setLoading(false));
  }, []);

  function handlePin(id: string, pinned: boolean) {
    setPosts((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, pinned } : p);
      return [...updated.filter((p) => p.pinned), ...updated.filter((p) => !p.pinned)];
    });
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleEdit(id: string, updates: Partial<Post>) {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, game: game || undefined }),
      });
      if (!res.ok) {
        await res.json();
        setError("Något gick fel. Kontrollera att titeln och texten är minst 3 tecken.");
        return;
      }
      const newPost: Post = await res.json();
      setPosts((prev) => {
        const pinned = prev.filter((p) => p.pinned);
        const rest = prev.filter((p) => !p.pinned);
        return [...pinned, newPost, ...rest];
      });
      setTitle("");
      setContent("");
      setGame("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  const visiblePosts = activeTab === null
    ? posts
    : [
        ...posts.filter((p) => p.pinned),
        ...posts.filter((p) => !p.pinned && p.game === activeTab),
      ];

  return (
    <div className="space-y-4">
      {/* Game tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? "text-neon-cyan bg-neon-cyan/10"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-neon-cyan shadow-[0_0_6px_rgba(0,245,255,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Create post button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 py-4 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/10"
        >
          + Skapa nytt inlägg
        </button>
      ) : (
        <div ref={formRef} className="rounded-2xl border border-neon-cyan/20 bg-slate-900/60 p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-neon-cyan/70">Nytt inlägg</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel — t.ex. 'Söker duo för ranked Valorant'"
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-cyan/40"
              required
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Beskriv vad du letar efter, din rank, speltider osv."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-cyan/40"
              required
            />
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-neon-cyan/40"
            >
              <option value="">Välj spel (valfritt)</option>
              {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 px-4 py-2 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/25 disabled:opacity-50"
              >
                <Send size={13} />
                {submitting ? "Publicerar…" : "Publicera"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-white/8 px-4 py-2 text-sm text-slate-400 transition-colors hover:text-white"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Post list */}
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-slate-900/40" />
        ))
      ) : visiblePosts.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-slate-900/30 py-16 text-center text-slate-500 text-sm">
          {activeTab ? `Inga inlägg för ${activeTab} än.` : "Inga inlägg än — var först med att skriva!"}
        </div>
      ) : (
        visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onPin={handlePin}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))
      )}
    </div>
  );
}
