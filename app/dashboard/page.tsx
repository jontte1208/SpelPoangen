import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TIER_LABELS, TIER_COLORS } from "@/types/user";
import XPBar from "@/components/dashboard/XPBar";
import { getLevelProgress } from "@/services/xp-logic";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { user } = session;
  const progress = getLevelProgress(user.xp, user.level);

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-10">
        {user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? "Avatar"}
            className="w-16 h-16 rounded-full border-2 border-neon-cyan shadow-neon"
          />
        )}
        <div>
          <h1 className="text-2xl font-display">{user.name ?? "Gamer"}</h1>
          <span className={`text-sm font-semibold ${TIER_COLORS[user.tier]}`}>
            {TIER_LABELS[user.tier]}
          </span>
        </div>
      </div>

      <section className="bg-white/5 rounded-xl p-6 border border-border mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Level {user.level}</span>
          <span className="text-neon-cyan font-mono">{user.xp} XP</span>
        </div>
        <XPBar progress={progress} />
      </section>

      <section className="bg-white/5 rounded-xl p-6 border border-border">
        <h2 className="text-lg font-display mb-3">Your Affiliate Code</h2>
        <p className="font-mono text-neon-cyan text-xl tracking-wider">
          {user.affiliateCode ?? "—"}
        </p>
        <p className="text-slate-400 text-sm mt-2">
          Share this code to earn bonus XP when friends sign up.
        </p>
      </section>
    </main>
  );
}
