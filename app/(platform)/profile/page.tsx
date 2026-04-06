import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xpForLevel } from "@/lib/utils";
import { getBanner } from "@/lib/banners";
import { Zap, Coins, Flame, Medal, MessageSquare, Star, CheckCircle2 } from "lucide-react";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ProfileActivity } from "@/components/profile/ProfileActivity";

export const metadata = { title: "Min profil" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      xp: true,
      coins: true,
      streak: true,
      level: true,
      tier: true,
      affiliateCode: true,
      bannerKey: true,
      customImage: true,
      unlockedBanners: { select: { bannerKey: true } },
    },
  });

  const user = {
    ...session.user,
    xp: dbUser?.xp ?? session.user.xp,
    coins: dbUser?.coins ?? session.user.coins,
    streak: dbUser?.streak ?? session.user.streak,
    level: dbUser?.level ?? session.user.level,
    tier: dbUser?.tier ?? session.user.tier,
    affiliateCode: dbUser?.affiliateCode ?? session.user.affiliateCode,
    bannerKey: dbUser?.bannerKey ?? "default",
    customImage: dbUser?.customImage ?? null,
  };

  // Fetch all active banners and the user's current banner from DB
  const [activeBanners, dbBanner] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { key: true, label: true, style: true, imageUrl: true, isPremiumOnly: true },
    }),
    prisma.banner.findUnique({
      where: { key: user.bannerKey },
      select: { style: true, imageUrl: true },
    }),
  ]);

  // Resolve background: prefer imageUrl, then DB style, then hardcoded fallback
  const bannerBackground = dbBanner?.imageUrl
    ? `url(${dbBanner.imageUrl}) center/cover no-repeat`
    : dbBanner?.style ?? getBanner(user.bannerKey).style;

  const displayImage = user.customImage || user.image;

  // Progress ring
  const currentThreshold = xpForLevel(user.level);
  const nextThreshold = xpForLevel(user.level + 1);
  const levelRange = Math.max(nextThreshold - currentThreshold, 1);
  const currentLevelXP = Math.max(user.xp - currentThreshold, 0);
  const progress = Math.min(Math.max(currentLevelXP / levelRange, 0), 1);

  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progress);

  const initials = (user.name ?? "SP")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <main className="grid gap-6">

      {/* Banner + identity */}
      <section className="glass-panel overflow-hidden rounded-[1.75rem] bg-slate-900/40">
        {/* Banner */}
        <div
          className="relative h-36 w-full"
          style={{ background: bannerBackground }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(0,245,255,0.08)_0%,transparent_70%)]" />
          <div className="absolute bottom-4 right-4">
            <ProfileEditor
              currentBannerKey={user.bannerKey}
              currentImage={user.customImage}
              discordImage={user.image ?? null}
              unlockedBannerKeys={dbUser?.unlockedBanners.map((b) => b.bannerKey) ?? []}
              banners={activeBanners}
            />
          </div>
        </div>

        {/* Avatar row */}
        <div className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:items-end">
          {/* Avatar with progress ring — pulled up into banner */}
          <div className="-mt-14 shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
              {/* Background track */}
              <circle
                cx="60" cy="60" r={ringRadius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="5"
              />
              {/* Progress arc */}
              <circle
                cx="60" cy="60" r={ringRadius}
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00f5ff" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              {/* Clip mask for avatar */}
              <defs>
                <clipPath id="avatarClip">
                  <circle cx="60" cy="60" r="50" />
                </clipPath>
              </defs>
              {displayImage ? (
                <image
                  href={displayImage}
                  x="10" y="10"
                  width="100" height="100"
                  clipPath="url(#avatarClip)"
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <>
                  <circle cx="60" cy="60" r="50" fill="rgba(0,245,255,0.08)" clipPath="url(#avatarClip)" />
                  <text x="60" y="67" textAnchor="middle" fill="#00f5ff" fontSize="26" fontWeight="700" fontFamily="monospace">
                    {initials}
                  </text>
                </>
              )}
              {/* Level badge */}
              <circle cx="96" cy="96" r="14" fill="#010b17" stroke="#00f5ff" strokeWidth="1.5" />
              <text x="96" y="100" textAnchor="middle" fill="#00f5ff" fontSize="10" fontWeight="700" fontFamily="monospace">
                {user.level}
              </text>
            </svg>
          </div>

          {/* Name + tier */}
          <div className="mb-1 min-w-0 sm:pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/60">
              Min profil
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
              {user.name ?? "Gamer"}
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
              {user.tier} · LVL {user.level} · {Math.round(progress * 100)}% till nästa nivå
            </p>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Verifierad */}
              <div className="group relative">
                <div className="flex h-8 w-8 cursor-default items-center justify-center rounded-full border border-violet-500/30 bg-white/5 text-violet-400 transition-all duration-200 hover:border-violet-400/60 hover:bg-violet-500/15 hover:shadow-[0_0_10px_rgba(167,139,250,0.35)]">
                  <MessageSquare size={14} />
                </div>
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white opacity-0 shadow-xl backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
                  Verifierad
                </span>
              </div>

              {/* Beta-testare */}
              <div className="group relative">
                <div className="flex h-8 w-8 cursor-default items-center justify-center rounded-full border border-yellow-400/30 bg-white/5 text-yellow-400 transition-all duration-200 hover:border-yellow-400/60 hover:bg-yellow-400/15 hover:shadow-[0_0_10px_rgba(250,204,21,0.35)]">
                  <Star size={14} />
                </div>
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white opacity-0 shadow-xl backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
                  Beta-testare
                </span>
              </div>

              {/* Första köpet */}
              <div className="group relative">
                <div className="flex h-8 w-8 cursor-default items-center justify-center rounded-full border border-emerald-500/30 bg-white/5 text-emerald-400 transition-all duration-200 hover:border-emerald-400/60 hover:bg-emerald-500/15 hover:shadow-[0_0_10px_rgba(52,211,153,0.35)]">
                  <CheckCircle2 size={14} />
                </div>
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white opacity-0 shadow-xl backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
                  Första köpet
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-panel rounded-[1.5rem] bg-slate-900/40 p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-neon-cyan/25 bg-neon-cyan/10">
            <Zap size={16} className="text-neon-cyan" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">XP</p>
          <p className="mt-1 font-display text-2xl font-semibold text-neon-cyan">{user.xp.toLocaleString("sv-SE")}</p>
        </div>

        <div className="glass-panel rounded-[1.5rem] bg-slate-900/40 p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-400/10">
            <Coins size={16} className="text-amber-300" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Coins</p>
          <p className="mt-1 font-display text-2xl font-semibold text-amber-200">{user.coins.toLocaleString("sv-SE")}</p>
        </div>

        <div className="glass-panel rounded-[1.5rem] bg-slate-900/40 p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-400/10">
            <Flame size={16} className="text-orange-400" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Streak</p>
          <p className="mt-1 font-display text-2xl font-semibold text-orange-300">{user.streak}</p>
        </div>

        <div className="glass-panel rounded-[1.5rem] bg-slate-900/40 p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10">
            <Medal size={16} className="text-violet-400" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Tier</p>
          <p className="mt-1 font-display text-xl font-semibold text-violet-300">{user.tier}</p>
        </div>
      </section>

      <ProfileActivity userId={user.id} />

    </main>
  );
}
