import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  };

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

    </main>
  );
}
