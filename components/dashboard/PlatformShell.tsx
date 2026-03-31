"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Coins, Gem, User, Settings, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
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

const dropdownItems = [
  { href: "/profile", label: "Profil", icon: User },
  { href: "/profile", label: "Inställningar", icon: Settings },
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
    role: "USER" | "ADMIN";
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

function OwnerBadge() {
  return (
    <span className="inline-flex items-center rounded-md border border-neon-cyan/40 bg-neon-cyan/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.4)]">
      Owner
    </span>
  );
}

export default function PlatformShell({ user, children }: PlatformShellProps) {
  const pathname = usePathname();
  const currentThreshold = xpForLevel(user.level);
  const nextThreshold = xpForLevel(user.level + 1);
  const levelRange = Math.max(nextThreshold - currentThreshold, 1);
  const currentLevelXP = Math.max(user.xp - currentThreshold, 0);
  const progress = Math.min(Math.max((currentLevelXP / levelRange) * 100, 0), 100);
  const isAdmin = user.role === "ADMIN";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-label="Profilmeny"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 transition-all hover:border-neon-cyan/30 hover:bg-neon-cyan/10"
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-white">{user.name ?? "Gamer"}</p>
                      {isAdmin && <OwnerBadge />}
                    </div>
                    <p className={cn("text-[10px] uppercase tracking-[0.18em]", TIER_COLORS[user.tier])}>
                      {TIER_LABELS[user.tier]}
                    </p>
                  </div>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "hidden text-slate-400 transition-transform duration-200 md:block",
                      dropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-xl backdrop-blur-md"
                    >
                      <div className="border-b border-white/5 px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white">{user.name ?? "Gamer"}</p>
                          {isAdmin && <OwnerBadge />}
                        </div>
                        <p className={cn("text-[10px] uppercase tracking-[0.18em]", TIER_COLORS[user.tier])}>
                          {TIER_LABELS[user.tier]}
                        </p>
                      </div>

                      <div className="p-1">
                        {dropdownItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                          >
                            <item.icon size={15} className="text-slate-400" />
                            {item.label}
                          </Link>
                        ))}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10"
                          >
                            <ShieldCheck size={15} className="text-neon-cyan" />
                            Admin Panel
                          </Link>
                        )}

                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <LogOut size={15} className="text-slate-400" />
                          Logga ut
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
