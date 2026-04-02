import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { SectionIntro } from "@/components/dashboard/SectionIntro";
import { TrendingUp, Crown, Medal } from "lucide-react";

export const metadata = { title: "Topplista" };

function OwnerBadge() {
  return (
    <span className="inline-flex items-center rounded-md border border-neon-cyan/40 bg-neon-cyan/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.4)]">
      Owner
    </span>
  );
}

const entries = [
  { rank: "01", name: "ShadowLoot", xp: "1280 XP", isAdmin: false },
  { rank: "02", name: "NovaAim", xp: "1145 XP", isAdmin: false },
  { rank: "03", name: "Jontte0067", xp: "980 XP", isAdmin: true },
];

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const currentUserName = session?.user?.name;
  const currentUserIsAdmin = session?.user?.role === "ADMIN";

  return (
    <main>
      <SectionIntro
        eyebrow="Topplista"
        title="Leaderboards har nu riktig routing"
        description="Den har sektionen ar frikopplad fran dashboard-previewn sa du kan expandera den till en full ranking-vy med tabs, tidsfilter och rewards."
      />

      <div className="space-y-4">
        {entries.map(({ rank, name, xp, isAdmin }, i) => {
          const isCurrentUser = name === currentUserName;
          const showBadge = isAdmin || (currentUserIsAdmin && isCurrentUser);

          const rankStyles = [
            { card: "border-yellow-400/20 bg-yellow-400/5 shadow-[0_0_20px_rgba(250,204,21,0.1)]", num: "text-yellow-400" },
            { card: "border-slate-400/15 bg-slate-900/60", num: "text-slate-300" },
            { card: "border-amber-700/20 bg-slate-900/60", num: "text-amber-600" },
          ][i] ?? { card: "bg-slate-950/70", num: "text-neon-cyan" };

          return (
            <Card
              key={rank}
              className={`rounded-3xl border p-5 transition-colors duration-150 hover:bg-white/5 ${rankStyles.card}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Crown size={16} className="text-yellow-400" />}
                    {i === 1 && <Medal size={16} className="text-slate-300" />}
                    {i === 2 && <Medal size={16} className="text-amber-600" />}
                    <span className={`font-display text-2xl ${rankStyles.num}`}>{rank}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{name}</p>
                      {showBadge && <OwnerBadge />}
                      {isCurrentUser && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">Weekly leaderboard preview</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-emerald-400" />
                  <span className="font-mono text-sm text-white">{xp}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
