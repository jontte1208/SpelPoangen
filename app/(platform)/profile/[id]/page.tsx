import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import XPBar from "@/components/dashboard/XPBar";
import { authOptions } from "@/lib/auth";
import { xpForLevel } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

type ProfilePageProps = {
  params: {
    id: string;
  };
};

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    notFound();
  }

  const profileUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      image: true,
      xp: true,
      coins: true,
      streak: true,
      level: true,
      tier: true,
      role: true,
    },
  });

  if (!profileUser) {
    notFound();
  }

  const currentThreshold = xpForLevel(profileUser.level);
  const nextThreshold = xpForLevel(profileUser.level + 1);
  const levelRange = Math.max(nextThreshold - currentThreshold, 1);
  const currentLevelXP = Math.max(profileUser.xp - currentThreshold, 0);
  const progress = Math.min(Math.max((currentLevelXP / levelRange) * 100, 0), 100);

  return (
    <main className="grid gap-6">
      <section className="glass-panel rounded-[1.75rem] bg-slate-900/40 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">
          Spelarprofil
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
          {profileUser.name ?? "Gamer"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">Offentlig profil och progression.</p>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="glass-panel rounded-[1.5rem] bg-slate-900/40 p-6 lg:col-span-1">
          {profileUser.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileUser.image}
              alt={profileUser.name ?? "Profilbild"}
              className="h-28 w-28 rounded-2xl border border-neon-cyan/30 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 font-display text-2xl text-neon-cyan">
              {(profileUser.name ?? "SP").slice(0, 2).toUpperCase()}
            </div>
          )}
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">Nivå</p>
          <p className="mt-1 font-display text-2xl text-white">{profileUser.level}</p>
        </article>

        <article className="glass-panel rounded-[1.5rem] bg-slate-900/40 p-6 lg:col-span-2">
          <h2 className="font-display text-2xl font-semibold text-white">Statistik</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">XP</p>
              <p className="mt-2 font-display text-2xl text-neon-cyan">{profileUser.xp}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Tier</p>
              <p className="mt-2 font-display text-2xl text-white">{profileUser.tier}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Coins</p>
              <p className="mt-2 font-display text-2xl text-white">{profileUser.coins}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Streak</p>
              <p className="mt-2 font-display text-2xl text-white">{profileUser.streak}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="glass-panel rounded-[1.75rem] bg-slate-900/40 p-6">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Progress till nasta level</span>
          <span className="font-mono text-neon-cyan">{profileUser.xp} XP</span>
        </div>
        <XPBar progress={progress} />
      </section>
    </main>
  );
}
