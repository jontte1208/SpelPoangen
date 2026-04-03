"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Gamepad2, Send, ChevronDown, ChevronUp, Clock, Pin } from "lucide-react";

type Author = { id: string; name: string | null; xp: number; level: number; image: string | null; role: string };
type Post = { id: string; title: string; content: string; game: string | null; pinned: boolean; createdAt: string; author: Author };

const GAMES = ["Valorant", "CS2", "Fortnite", "Apex Legends", "League of Legends", "Minecraft", "Rocket League", "Annat"];

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
  return (
    <div className="relative shrink-0">
      {author.image ? (
        <Image src={author.image} alt="" width={28} height={28} className="rounded-full object-cover" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] text-slate-400">
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

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > 200;
  const isPinned = post.pinned;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-colors",
        isPinned
          ? "border-amber-500/50 bg-amber-950/20 shadow-[0_0_28px_rgba(245,158,11,0.12)] hover:bg-amber-950/30"
          : "border-white/8 bg-slate-900/50 hover:bg-slate-900/70"
      )}
    >
      {/* Pinned header row */}
      {isPinned && (
        <div className="flex items-center gap-2 mb-3">
          <Pin size={11} className="text-amber-400" />
          <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400">
            Officiellt
          </span>
          <span className="text-[10px] text-amber-600/60 uppercase tracking-widest">· Fäst inlägg</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {post.game && (
              <span className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neon-cyan">
                <Gamepad2 size={10} />
                {post.game}
              </span>
            )}
            {post.author.id === currentUserId && !isPinned && (
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                Du
              </span>
            )}
          </div>
          <h3 className={cn("font-semibold leading-snug", isPinned ? "text-amber-50" : "text-white")}>
            {post.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-slate-500 text-xs">
          <Clock size={11} />
          {timeAgo(post.createdAt)}
        </div>
      </div>

      <p className={cn(
        "mt-2 text-sm whitespace-pre-wrap",
        isPinned ? "text-amber-100/70" : "text-slate-300",
        !expanded && isLong && "line-clamp-3"
      )}>
        {post.content}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? <><ChevronUp size={12} /> Visa mindre</> : <><ChevronDown size={12} /> Visa mer</>}
        </button>
      )}

      <div className={cn("mt-3 flex items-center gap-2 border-t pt-3", isPinned ? "border-amber-500/20" : "border-white/5")}>
        <AuthorAvatar author={post.author} pinned={isPinned} />
        <span className={cn("text-xs", isPinned ? "text-amber-200/80" : "text-slate-400")}>
          {post.author.name ?? "Okänd"}
        </span>
        <span className="text-[10px] text-slate-600">·</span>
        <span className="text-[10px] text-slate-500">Lv {post.author.level} · {post.author.xp} XP</span>
      </div>
    </div>
  );
}

export default function ForumFeed({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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
        setError("Något gick fel. Kontrollera att titeln är minst 3 tecken och texten minst 10 tecken.");
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

  return (
    <div className="space-y-4">
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
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-slate-900/30 py-16 text-center text-slate-500 text-sm">
          Inga inlägg än — var först med att skriva!
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUserId} />
        ))
      )}
    </div>
  );
}
