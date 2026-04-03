"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, UserPlus, ShoppingBag, MessageSquare, Gamepad2, Headphones, Trophy, Zap, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LevelUpModal from "./LevelUpModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestDef = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  xp: number;
  goal: number;
  image: string;
};

// ─── Quest pool ───────────────────────────────────────────────────────────────

const QUEST_POOL: QuestDef[] = [
  {
    id: "forum-warrior",
    title: "Forum-krigaren",
    description: "Skriv 5 inlägg i forumet och visa att du hör hemma här.",
    icon: MessageSquare,
    xp: 150,
    goal: 5,
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80",
  },
  {
    id: "social-gaming",
    title: "Social Gaming",
    description: "Bjud in en vän till SpelPoängen och dela loot-jakten.",
    icon: UserPlus,
    xp: 200,
    goal: 1,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
  },
  {
    id: "loot-scout",
    title: "Loot-spanaren",
    description: "Besök 3 olika produkter i butiken och hitta ditt nästa köp.",
    icon: ShoppingBag,
    xp: 50,
    goal: 3,
    image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80",
  },
  {
    id: "squad-up",
    title: "Squad Up",
    description: "Hitta tre spelare att köra med via forumet.",
    icon: Users,
    xp: 175,
    goal: 3,
    image: "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=800&q=80",
  },
  {
    id: "gear-check",
    title: "Gear Check",
    description: "Kolla in 5 produkter i butiken — uppgradera din setup.",
    icon: Headphones,
    xp: 75,
    goal: 5,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  },
  {
    id: "grind-session",
    title: "Grind Session",
    description: "Logga in 3 dagar i rad och håll streaken vid liv.",
    icon: Gamepad2,
    xp: 100,
    goal: 3,
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
  },
];

// ─── Week rotation ────────────────────────────────────────────────────────────

function getWeekIndex() {
  const EPOCH_MONDAY = 4 * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - EPOCH_MONDAY) / (7 * 24 * 60 * 60 * 1000));
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function msUntilNextMonday() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntil = ((1 - day + 7) % 7) || 7;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntil));
  return next.getTime() - now.getTime();
}

function useCountdown() {
  const [ms, setMs] = useState(msUntilNextMonday);
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextMonday()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
}

// ─── QuestCard ────────────────────────────────────────────────────────────────

function QuestCard({ quest, progress, claimed, onClaim, claiming }: {
  quest: QuestDef;
  progress: number;
  claimed: boolean;
  claiming: boolean;
  onClaim: () => void;
}) {
  const pct = Math.min((progress / quest.goal) * 100, 100);
  const complete = progress >= quest.goal;
  const Icon = quest.icon;

  return (
    <div className={cn(
      "flex flex-col overflow-hidden rounded-2xl border backdrop-blur-xl transition-colors",
      claimed ? "border-emerald-500/30"
        : complete ? "border-neon-cyan/25 shadow-[0_0_20px_rgba(0,245,255,0.06)]"
        : "border-white/8"
    )}>
      {/* Image header */}
      <div className="relative h-36 w-full shrink-0">
        <Image src={quest.image} alt={quest.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 px-5 pb-4">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            claimed ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
              : complete ? "border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan"
              : "border-white/15 bg-slate-900/70 text-slate-300"
          )}>
            <Icon size={17} />
          </div>
          <h3 className="font-bold text-white text-base leading-snug drop-shadow-md">{quest.title}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 bg-slate-900/80 p-5">
        <p className="text-sm text-slate-400 leading-relaxed">{quest.description}</p>

        {/* XP badge */}
        <div>
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-bold",
            claimed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : complete ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
              : "border-blue-500/30 bg-blue-500/10 text-blue-400"
          )}>
            <Zap size={13} />
            +{quest.xp} XP
          </span>
        </div>

        {/* Progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Framsteg</span>
            <span className={complete ? "font-semibold text-neon-cyan" : ""}>{progress}/{quest.goal}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                claimed ? "bg-emerald-400"
                  : complete ? "bg-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.5)]"
                  : "bg-slate-600"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Claim button */}
        <button
          onClick={onClaim}
          disabled={!complete || claimed || claiming}
          className={cn(
            "mt-auto w-full rounded-xl py-2.5 text-sm font-semibold transition-all",
            claimed ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 cursor-default"
              : complete ? "border border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan hover:bg-neon-cyan/25 shadow-[0_0_14px_rgba(0,245,255,0.2)] disabled:opacity-70"
              : "border border-white/5 bg-slate-800/40 text-slate-600 cursor-not-allowed"
          )}
        >
          {claimed ? "✓ Hämtad" : claiming ? "Hämtar…" : complete ? "Hämta belöning" : "Låst"}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WeeklyQuests() {
  const countdown = useCountdown();
  const router = useRouter();
  const quests = useMemo(() => seededShuffle(QUEST_POOL, getWeekIndex()).slice(0, 3), []);

  // Progress: stored locally for demo. In production, hook into forum/shop actions.
  const [progress, setProgress] = useState<Record<string, number>>(
    Object.fromEntries(quests.map((q) => [q.id, 0]))
  );
  const [claimed, setClaimed] = useState<string[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

  // Level up modal state
  const [levelUp, setLevelUp] = useState<{ newLevel: number; xpAwarded: number } | null>(null);

  // Load claimed quests from server on mount
  useEffect(() => {
    fetch("/api/quests/claim")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.claimed)) setClaimed(data.claimed); })
      .catch(() => {});
  }, []);

  async function handleClaim(quest: QuestDef) {
    if (claiming) return;
    setClaiming(quest.id);
    try {
      const res = await fetch("/api/quests/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId: quest.id, xp: quest.xp }),
      });
      if (res.ok) {
        const data = await res.json();
        setClaimed((prev) => prev.concat(quest.id));
        if (data.didLevelUp) {
          setLevelUp({ newLevel: data.newLevel, xpAwarded: data.xpAwarded });
        }
        // Refresh server components so header XP updates
        router.refresh();
      }
    } finally {
      setClaiming(null);
    }
  }

  const allClaimed = quests.every((q) => claimed.includes(q.id));
  const totalXP = quests.reduce((sum, q) => sum + q.xp, 0);

  return (
    <>
      <LevelUpModal
        show={!!levelUp}
        newLevel={levelUp?.newLevel ?? 1}
        xpAwarded={levelUp?.xpAwarded ?? 0}
        onClose={() => setLevelUp(null)}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neon-cyan/70 mb-1">Den här veckan</p>
            <h2 className="text-2xl font-bold text-white">Veckans Utmaningar</h2>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Nollställs om:</span>
            <span className="font-mono font-semibold text-white">{countdown}</span>
          </div>
        </div>

        {/* Demo progress controls */}
        <div className="flex flex-wrap gap-2 rounded-xl border border-white/5 bg-slate-900/30 p-3">
          <p className="w-full text-[10px] uppercase tracking-widest text-slate-600 mb-1">Demo — fyll progress</p>
          {quests.map((q) => (
            <button
              key={q.id}
              onClick={() => setProgress((p) => ({ ...p, [q.id]: Math.min((p[q.id] ?? 0) + 1, q.goal) }))}
              disabled={claimed.includes(q.id) || (progress[q.id] ?? 0) >= q.goal}
              className="flex items-center gap-1 rounded-lg border border-white/8 px-2.5 py-1 text-[11px] text-slate-500 hover:text-white transition-colors disabled:opacity-30"
            >
              <Plus size={10} /> {q.title}
            </button>
          ))}
        </div>

        {/* Success state */}
        {allClaimed ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 py-16 text-center shadow-[0_0_40px_rgba(234,179,8,0.08)]">
            <Trophy size={52} className="text-yellow-400" />
            <div>
              <p className="text-lg font-bold text-yellow-300">Veckans loot säkrad!</p>
              <p className="mt-1 text-sm text-slate-400">
                Du tjänade <span className="text-blue-400 font-semibold">{totalXP} XP</span> den här veckan.
              </p>
              <p className="mt-0.5 text-sm text-slate-500">Kom tillbaka nästa måndag för nya utmaningar.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                progress={progress[quest.id] ?? 0}
                claimed={claimed.includes(quest.id)}
                claiming={claiming === quest.id}
                onClaim={() => handleClaim(quest)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
