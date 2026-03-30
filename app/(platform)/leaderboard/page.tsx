import { Card } from "@/components/ui/Card";
import { SectionIntro } from "@/components/dashboard/SectionIntro";

export const metadata = { title: "Topplista" };

export default function LeaderboardPage() {
  return (
    <main>
      <SectionIntro
        eyebrow="Topplista"
        title="Leaderboards har nu riktig routing"
        description="Den har sektionen ar frikopplad fran dashboard-previewn sa du kan expandera den till en full ranking-vy med tabs, tidsfilter och rewards."
      />

      <div className="space-y-4">
        {[
          ["01", "ShadowLoot", "1280 XP"],
          ["02", "NovaAim", "1145 XP"],
          ["03", "Jontte0067", "980 XP"],
        ].map(([rank, name, xp]) => (
          <Card key={rank} className="rounded-3xl bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="font-display text-2xl text-neon-cyan">{rank}</span>
                <div>
                  <p className="font-medium text-white">{name}</p>
                  <p className="text-sm text-slate-400">Weekly leaderboard preview</p>
                </div>
              </div>
              <span className="font-mono text-sm text-white">{xp}</span>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}