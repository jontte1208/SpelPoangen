"use client";

import { motion } from "framer-motion";
import { Coins, Gem } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, xpForLevel } from "@/lib/utils";
import { TIER_COLORS, TIER_LABELS } from "@/types/user";
import type { Tier } from "@/types/user";

const navItems = [
  { href: "/dashboard", label: "Hem" },
  { href: "/products", label: "Produkter" },
  { href: "/quests", label: "Quests" },
  { href: "/shop", label: "Butik" },
  { href: "/leaderboard", label: "Topplista" },
  { href: "/premium", label: "Premium", premium: true },
];

type PlatformShellProps = {
  user: {
    name?: string | null;
    image?: string | null;
    xp: number;
    coins: number;
    gold: number;
    streak: number;
    level: number;
    tier: Tier;
  };
  children: React.ReactNode;
};

function getInitials(name?: string | null) {
  if (!name) return "SP";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function PlatformShell({ user, children }: PlatformShellProps) {
  const pathname = usePathname();
  const currentThreshold = xpForLevel(user.level);
  const nextThreshold = xpForLevel(user.level + 1);
  const levelRange = Math.max(nextThreshold - currentThreshold, 1);
  const currentLevelXP = Math.max(user.xp - currentThreshold, 0);
  const progress = Math.min(Math.max((currentLevelXP / levelRange) * 100, 0), 100);

  return (
    <div className="min-h-screen bg-[#020617] px-4 pb-8 pt-0 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="sticky top-0 z-50 mb-6 rounded-b-2xl border border-white/10 bg-slate-900/65 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-base font-semibold tracking-[0.34em] text-neon-cyan sm:text-lg">
                SPELPOANGEN
              </p>
            </div>

            <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
              {navItems.filter((item) => !item.premium).map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition-all duration-300",
                      isActive
                        ? "border-neon-cyan/30 bg-neon-cyan/10 text-white"
                        : "text-neon-cyan/85 hover:border-neon-cyan/20 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                title="Visa min profil"
                aria-label="Visa min profil"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 transition-all hover:border-neon-cyan/30 hover:bg-neon-cyan/10 hover:opacity-80"
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? "Avatar"}
                    className="h-8 w-8 rounded-lg border border-neon-cyan/30 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 text-xs font-semibold text-neon-cyan">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="hidden leading-tight md:block">
                  <p className="text-xs font-semibold text-white">{user.name ?? "Gamer"}</p>
                  <p className={cn("text-[10px] uppercase tracking-[0.18em]", TIER_COLORS[user.tier])}>
                    {TIER_LABELS[user.tier]}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <nav className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 lg:hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full border border-transparent px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition-all duration-300",
                    isActive
                      ? "border-neon-cyan/25 bg-neon-cyan/10 text-white"
                      : "text-neon-cyan/85 hover:border-neon-cyan/20 hover:bg-white/5 hover:text-white",
                    item.premium && !isActive && "bg-neon-cyan/5"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-400/5 px-2.5 py-1.5">
                <Coins size={14} className="text-cyan-200" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Coins</span>
                <span className="text-xs font-semibold text-white">{user.coins}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-2.5 py-1.5">
                <Gem size={14} className="text-amber-300" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-amber-100/70">Gold</span>
                <span className="text-xs font-semibold text-amber-200">{user.gold}</span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                XP {currentLevelXP}/{levelRange}
              </span>
            </div>

            <div className="rounded-xl border border-neon-cyan/15 bg-slate-950/70 p-2">
              <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#00f5ff_0%,#38bdf8_50%,#2563eb_100%)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </header>

        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}