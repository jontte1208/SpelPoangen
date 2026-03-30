"use client";

import { BadgeCheck, Coins, Gift, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BattlePassProgressProps = {
  currentLevel: number;
};

const levels = Array.from({ length: 10 }, (_, i) => i + 1);

function rewardForLevel(level: number) {
  if (level === 1) {
    return {
      label: "Starter Badge",
      icon: BadgeCheck,
      color: "text-cyan-200",
      bg: "bg-cyan-400/10",
      border: "border-cyan-300/25",
    };
  }

  if (level === 5) {
    return {
      label: "500 Coins",
      icon: Coins,
      color: "text-cyan-100",
      bg: "bg-cyan-300/10",
      border: "border-cyan-300/20",
    };
  }

  if (level === 10) {
    return {
      label: "Mystery Box",
      icon: Gift,
      color: "text-violet-200",
      bg: "bg-violet-400/10",
      border: "border-violet-300/25",
    };
  }

  return null;
}

export default function BattlePassProgress({ currentLevel }: BattlePassProgressProps) {
  const normalizedLevel = Math.min(Math.max(currentLevel, 1), 10);

  return (
    <section className="glass-panel col-span-12 rounded-[1.75rem] bg-slate-900/40 p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">
            Battle Pass
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            Progress Track Level 1 till 10
          </h2>
        </div>

        <Link
          href="/premium"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/30 bg-[linear-gradient(120deg,#facc15,#f59e0b)] px-4 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-slate-950 shadow-gold-soft transition-all duration-300 hover:brightness-110"
        >
          <Sparkles size={16} />
          LAS UPP PREMIUM
        </Link>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="relative min-w-[760px]">
          <div className="absolute left-0 right-0 top-[34px] h-[3px] rounded-full bg-slate-700/70" />
          <div
            className="absolute left-0 top-[34px] h-[3px] rounded-full bg-[linear-gradient(90deg,#00f5ff,#2563eb)]"
            style={{ width: `${((normalizedLevel - 1) / 9) * 100}%` }}
          />

          <div className="grid grid-cols-10 gap-3">
            {levels.map((level) => {
              const isUnlocked = level <= normalizedLevel;
              const reward = rewardForLevel(level);
              const RewardIcon = reward?.icon;

              return (
                <div key={level} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold",
                      isUnlocked
                        ? "border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan"
                        : "border-white/15 bg-slate-900/80 text-slate-500"
                    )}
                  >
                    {level}
                  </div>

                  <div
                    className={cn(
                      "mt-3 w-full rounded-xl border px-2 py-2.5 transition-all duration-300",
                      isUnlocked
                        ? "border-white/10 bg-slate-900/70"
                        : "border-white/10 bg-slate-900/50 opacity-50"
                    )}
                  >
                    {reward && RewardIcon ? (
                      <>
                        <div
                          className={cn(
                            "mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-lg border",
                            reward.bg,
                            reward.border
                          )}
                        >
                          <RewardIcon size={14} className={reward.color} />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">
                          {reward.label}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-800/70">
                          <Lock size={13} className="text-slate-500" />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                          Locked
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}