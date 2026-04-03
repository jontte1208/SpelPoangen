"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import LootMarketSection from "@/components/market/LootMarketSection";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Tier } from "@/types/user";
import { Zap, ShoppingCart, Trophy, Crown, Medal, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

type ActivityType = "forum_post" | "quest_claim" | "affiliate_click" | "purchase";

type LiveActivity = {
  id: string;
  type: ActivityType;
  text: string;
  createdAt: string;
};

const feedItemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: "easeOut", delay: i * 0.07 },
  }),
};

function RecentActivity() {
  const [activityFeed, setActivityFeed] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(true);

  function formatActivityTime(createdAt: string) {
    const ts = new Date(createdAt).getTime();
    if (Number.isNaN(ts)) return "-";

    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 60) return "NU";

    const minutes = Math.floor(diffSec / 60);
    if (minutes < 60) return `${minutes} MIN`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} H`;

    const days = Math.floor(hours / 24);
    return `${days} D`;
  }

  function getActivityVisual(type: ActivityType) {
    if (type === "forum_post") {
      return { icon: Trophy, color: "text-neon-cyan", bg: "bg-neon-cyan/10 border-neon-cyan/20" };
    }
    if (type === "quest_claim") {
      return { icon: CheckCircle2, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" };
    }
    if (type === "purchase") {
      return { icon: ShoppingCart, color: "text-amber-300", bg: "bg-amber-400/10 border-amber-300/20" };
    }
    return { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" };
  }

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/activity/recent?limit=8", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setActivityFeed(data);
        }
      } catch {
        // Ignore polling errors to keep dashboard stable.
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
    const poll = setInterval(fetchActivity, 10000);
    return () => clearInterval(poll);
  }, []);

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">
          Senaste Aktivitet
        </p>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">Live</span>
        </span>
      </div>

      <motion.ul
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {loading && activityFeed.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <li key={`activity-skeleton-${i}`} className="h-[50px] animate-pulse rounded-xl border border-white/5 bg-white/[0.03]" />
          ))
        ) : activityFeed.length === 0 ? (
          <li className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
            Ingen aktivitet ännu.
          </li>
        ) : activityFeed.map((item, i) => {
          const visual = getActivityVisual(item.type);
          return (
          <motion.li
            key={item.id}
            custom={i}
            variants={feedItemVariants}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${visual.bg}`}>
              <visual.icon size={13} className={visual.color} />
            </div>
            <p className="min-w-0 flex-1 truncate text-sm text-slate-300">{item.text}</p>
            <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-slate-600">
              {formatActivityTime(item.createdAt)}
            </span>
          </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}

type DashboardShellProps = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    xp: number;
    level: number;
    tier: Tier;
    affiliateCode?: string;
  };
};

type LeaderboardEntry = { id: string; name: string | null; xp: number; role: string };

export default function DashboardShell({ user }: DashboardShellProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowWelcome(false);
    }, 30000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    fetch("/api/leaderboard?limit=3")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(() => {});
  }, []);

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-[60vh]"
    >
      <div className="grid grid-cols-12 gap-6">
        <AnimatePresence>
          {showWelcome && (
            <motion.section
              variants={itemVariants}
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="col-span-12 overflow-hidden"
            >
              <Card className="rounded-2xl border-white/5 bg-slate-900/40 p-5 shadow-none">
                <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                  Välkommen tillbaka, {user.name ?? "Gamer"}
                </h1>
                <p className="mt-2 text-sm text-slate-400 sm:text-base">
                  Här är din progression
                </p>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>

        <motion.section variants={itemVariants} className="col-span-12 xl:col-span-9">
          <LootMarketSection inDashboard />
        </motion.section>

        <motion.aside variants={itemVariants} className="col-span-12 space-y-5 xl:col-span-3">
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:shadow-neon-soft">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">
                Dagens Push
              </p>
              <span className="rounded-full border border-neon-cyan/25 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-neon-cyan">
                2 live
              </span>
            </div>
            <div className="space-y-2">
              {[
                ["Dela din kod", "+25 XP"],
                ["Kolla veckans gear", "+10 XP"],
              ].map(([title, reward]) => (
                <div key={title} className="rounded-2xl border border-white/5 bg-slate-900/40 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-200">{title}</span>
                    <span className="text-xs font-semibold text-neon-cyan">{reward}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:shadow-neon-soft">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">Topplista</p>
            <div className="space-y-2">
              {leaderboard.length === 0
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[52px] animate-pulse rounded-2xl border border-white/5 bg-slate-900/40" />
                  ))
                : leaderboard.map((entry, i) => {
                    const isCurrentUser = entry.id === user.id;
                    const rank = String(i + 1).padStart(2, "0");
                    return (
                      <Link key={entry.id} href={`/profile/${entry.id}`} className="block">
                        <div
                          className={cn(
                            "rounded-2xl border p-4 transition-colors hover:bg-white/5",
                            i === 0 && "border-yellow-400/20 bg-yellow-400/5 shadow-[0_0_14px_rgba(250,204,21,0.08)]",
                            i === 1 && "border-white/10 bg-slate-900/40",
                            i === 2 && "border-white/10 bg-slate-900/40",
                            isCurrentUser && i !== 0 && "border-neon-cyan/25",
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {i === 0 && <Crown size={13} className="shrink-0 text-yellow-400" />}
                              {i === 1 && <Medal size={13} className="shrink-0 text-slate-300" />}
                              {i === 2 && <Medal size={13} className="shrink-0 text-amber-600" />}
                              <span className={cn(
                                "font-display text-base",
                                i === 0 && "text-yellow-400",
                                i === 1 && "text-slate-300",
                                i === 2 && "text-amber-600",
                              )}>{rank}</span>
                              <span className="text-sm text-slate-200 transition-colors hover:text-neon-cyan">{entry.name ?? "Okänd"}</span>
                            </div>
                            <span className="text-xs font-semibold text-white">{entry.xp} XP</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
            </div>
            <Link
              href="/leaderboard"
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              Visa alla
            </Link>
          </div>
        </motion.aside>

        <motion.section variants={itemVariants} className="col-span-12">
          <RecentActivity />
        </motion.section>

      </div>
    </motion.main>
  );
}