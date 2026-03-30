"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import LootMarketSection from "@/components/market/LootMarketSection";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Tier } from "@/types/user";

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