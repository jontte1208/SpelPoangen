import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import XPBar from "@/components/dashboard/XPBar";
import { authOptions } from "@/lib/auth";
import { xpForLevel } from "@/lib/utils";

export const metadata = { title: "Min profil" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { user } = session;
  const currentThreshold = xpForLevel(user.level);
  const nextThreshold = xpForLevel(user.level + 1);
  const levelRange = Math.max(nextThreshold - currentThreshold, 1);
  const currentLevelXP = Math.max(user.xp - currentThreshold, 0);
  const progress = Math.min(Math.max((currentLevelXP / levelRange) * 100, 0), 100);

  return (
    <main className="grid gap-6">
      <section className="glass-panel rounded-[1.75rem] bg-slate-900/40 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">
          Min profil
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
          {user.name ?? "Gamer"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">Din personliga profil och progression.</p>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="glass-panel rounded-[1.5rem] bg-slate-900/40 p-6 lg:col-span-1">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? "Profilbild"}
              className="h-28 w-28 rounded-2xl border border-neon-cyan/30 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 font-display text-2xl text-neon-cyan">
              {(user.name ?? "SP").slice(0, 2).toUpperCase()}
            </div>
          )}
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">Nivå</p>
          <p className="mt-1 font-display text-2xl text-white">{user.level}</p>
        </article>

        <article className="glass-panel rounded-[1.5rem] bg-slate-900/40 p-6 lg:col-span-2">
          <h2 className="font-display text-2xl font-semibold text-white">Statistik</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">XP</p>
              <p className="mt-2 font-display text-2xl text-neon-cyan">{user.xp}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Tier</p>
              <p className="mt-2 font-display text-2xl text-white">{user.tier}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Coins</p>
              <p className="mt-2 font-display text-2xl text-white">{user.coins}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Streak</p>
              <p className="mt-2 font-display text-2xl text-white">{user.streak}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="glass-panel rounded-[1.75rem] bg-slate-900/40 p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.42em] text-neon-cyan/70">
              Mitt Grinds
            </p>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Level {user.level} grindar vidare
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
              Din profil visar din progression, rewards och personliga status.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-slate-500">Nuvarande XP</p>
              <p className="mt-2 font-display text-2xl font-semibold text-neon-cyan">{user.xp}</p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-slate-500">Affiliate Code</p>
              <p className="mt-2 font-display text-lg font-semibold text-white">
                {user.affiliateCode ?? "SP-LOCKED"}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[1.35rem] p-6">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Progress till nasta level</span>
            <span className="font-mono text-neon-cyan">{user.xp} XP</span>
          </div>
          <XPBar progress={progress} />
        </div>
      </section>

      <section className="glass-panel rounded-3xl bg-slate-900/40 p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-neon-cyan">
            Level {user.level}
          </p>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
            {currentLevelXP}/{levelRange} XP
          </p>
        </div>

        <div className="h-4 overflow-hidden rounded-full border border-neon-cyan/20 bg-slate-950/85 p-[3px]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#00f5ff_0%,#38bdf8_50%,#2563eb_100%)] shadow-neon"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-500">
          <span>Current XP {user.xp}</span>
          <span>Next level {nextThreshold}</span>
        </div>
      </section>
    </main>
  );
}
