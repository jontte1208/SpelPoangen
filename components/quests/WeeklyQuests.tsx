"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Users, UserPlus, ShoppingBag, Trophy, Zap, Coins } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Quest = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  xp: number;
  coins: number;
  progress: number;
  goal: number;
};

// ─── Static quest definitions ─────────────────────────────────────────────────
// To add a new quest: append an entry to this array.

const WEEKLY_QUESTS: Quest[] = [
  {
    id: "forum-warrior",
    title: "Forum-krigaren",
    description: "Skriv 5 inlägg i forumet och visa att du hör hemma här.",
    icon: Users,
    xp: 150,
    coins: 25,
    progress: 0,
    goal: 5,
  },
  {
    id: "social-gaming",
    title: "Social Gaming",
    description: "Bjud in en vän till SpelPoängen och dela loot-jakten.",
    icon: UserPlus,
    xp: 200,
    coins: 50,
    progress: 0,
    goal: 1,
  },
  {
    id: "loot-scout",
    title: "Loot-spanaren",
    description: "Besök 3 olika produkter i butiken och hitta ditt nästa köp.",
    icon: ShoppingBag,
    xp: 50,
    coins: 10,
    progress: 0,
    goal: 3,
  },
];

// ─── Countdown hook ───────────────────────────────────────────────────────────

function msUntilNextMonday() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const daysUntilMonday = ((1 - day + 7) % 7) || 7;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday));
  return next.getTime() - now.getTime();
}

function useCountdown() {
  const [ms, setMs] = useState(msUntilNextMonday);
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextMonday()), 1000);
    return () => clearInterval(id);
  }, []);
  const totalSecs = Math.floor(ms / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

// ─── QuestCard ────────────────────────────────────────────────────────────────

function QuestCard({ quest, claimed, onClaim }: { quest: Quest; claimed: boolean; onClaim: () => void }) {
  const pct = Math.min((quest.progress / quest.goal) * 100, 100);
  const complete = quest.progress >= quest.goal;
  const Icon = quest.icon;

  return (
    <div className={cn(
      "relative flex flex-col rounded-2xl border p-5 backdrop-blur-xl transition-colors",
      claimed
        ? "border-emerald-500/30 bg-emerald-950/20"
        : complete
        ? "border-neon-cyan/30 bg-slate-900/50 shadow-[0_0_20px_rgba(0,245,255,0.06)]"
        : "border-white/8 bg-slate-900/50"
    )}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
          claimed
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : complete
            ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
            : "border-white/10 bg-slate-800/60 text-slate-400"
        )}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white leading-snug">{quest.title}</h3>
          <p className="mt-0.5 text-sm text-slate-400 leading-snug">{quest.description}</p>
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
          <Zap size={10} />
          +{quest.xp} XP
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-400">
          <Coins size={10} />
          +{quest.coins} Coins
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>Framsteg</span>
          <span className={complete ? "text-neon-cyan font-semibold" : ""}>{quest.progress}/{quest.goal}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              claimed
                ? "bg-emerald-400"
                : complete
                ? "bg-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.6)]"
                : "bg-slate-600"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Claim button */}
      <button
        onClick={onClaim}
        disabled={!complete || claimed}
        className={cn(
          "mt-auto w-full rounded-xl py-2.5 text-sm font-semibold transition-all",
          claimed
            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 cursor-default"
            : complete
            ? "border border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan hover:bg-neon-cyan/25 shadow-[0_0_14px_rgba(0,245,255,0.2)]"
            : "border border-white/5 bg-slate-800/40 text-slate-600 cursor-not-allowed"
        )}
      >
        {claimed ? "✓ Hämtad" : complete ? "Hämta belöning" : "Låst"}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WeeklyQuests() {
  const countdown = useCountdown();
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  const allClaimed = claimed.size === WEEKLY_QUESTS.length;

  function handleClaim(id: string) {
    setClaimed((prev) => new Set(Array.from(prev).concat(id)));
  }

  return (
    <div className="space-y-6">
      {/* Weekly header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
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

      {/* Success state */}
      {allClaimed ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 py-16 text-center shadow-[0_0_40px_rgba(234,179,8,0.08)]">
          <Trophy size={52} className="text-yellow-400" />
          <div>
            <p className="text-lg font-bold text-yellow-300">Veckans loot säkrad!</p>
            <p className="mt-1 text-sm text-slate-400">Kom tillbaka nästa vecka för mer.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {WEEKLY_QUESTS.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              claimed={claimed.has(quest.id)}
              onClaim={() => handleClaim(quest.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
