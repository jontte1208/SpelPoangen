"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import LootMarketSection from "@/components/market/LootMarketSection";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Tier } from "@/types/user";
import { Zap, ShoppingCart, Trophy, BadgeCheck, Flame } from "lucide-react";

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

const activityFeed = [
  { icon: BadgeCheck, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20", text: "jontte0067 låste precis upp en ny badge!", time: "Nu" },
  { icon: ShoppingCart, color: "text-amber-300", bg: "bg-amber-400/10 border-amber-300/20", text: "NovaAim köpte SteelSeries Apex Pro", time: "1 min" },
  { icon: Trophy, color: "text-neon-cyan", bg: "bg-neon-cyan/10 border-neon-cyan/20", text: "ShadowLoot nådde Level 5!", time: "3 min" },
  { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", text: "UserX tjänade 250 XP på Razer DeathAdder V3", time: "5 min" },
  { icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", text: "GrindKing håller en 7-dagars streak!", time: "8 min" },
  { icon: ShoppingCart, color: "text-amber-300", bg: "bg-amber-400/10 border-amber-300/20", text: "ProGamer99 köpte HyperX Cloud III", time: "12 min" },
];

const feedItemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: "easeOut", delay: i * 0.07 },
  }),
};

function RecentActivity() {
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
        {activityFeed.map((item, i) => (
          <motion.li
            key={i}
            custom={i}
            variants={feedItemVariants}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${item.bg}`}>
              <item.icon size={13} className={item.color} />
            </div>
            <p className="min-w-0 flex-1 truncate text-sm text-slate-300">{item.text}</p>
            <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-slate-600">
              {item.time}
            </span>
          </motion.li>
        ))}
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

export default function DashboardShell({ user }: DashboardShellProps) {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowWelcome(false);
    }, 30000);

    return () => clearTimeout(timeout);
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

        <motion.section variants={itemVariants} className="col-span-12">
          <RecentActivity />
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
              {[
                ["01", user.name ?? "Du", `${user.xp} XP`, true],
                ["02", "ShadowLoot", "1280 XP", false],
                ["03", "NovaAim", "1145 XP", false],
              ].map(([rank, name, xp, current]) => (
                <div
                  key={String(rank)}
                  className={cn(
                    "rounded-2xl border bg-slate-900/40 p-5",
                    current ? "border-neon-cyan/25" : "border-white/5"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-base text-neon-cyan">{rank}</span>
                      <span className="text-sm text-slate-200">{name}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{xp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

      </div>
    </motion.main>
  );
}