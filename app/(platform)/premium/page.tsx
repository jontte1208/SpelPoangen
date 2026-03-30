import { Card } from "@/components/ui/Card";
import { SectionIntro } from "@/components/dashboard/SectionIntro";

export const metadata = { title: "Premium" };

export default function PremiumPage() {
  return (
    <main>
      <SectionIntro
        eyebrow="Premium"
        title="Premium har nu en egen sida"
        description="Detta ar inte langre en fast state i dashboarden. Du kan navigera hit och tillbaka via riktiga Next.js-routes med aktiv lankmarkering i navbaren."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card glow className="rounded-3xl border-neon-cyan/25 bg-slate-950/70 p-7">
          <h2 className="font-display text-2xl text-white">Premium perks</h2>
          <p className="mt-3 text-sm text-slate-400">Placeholder for double XP windows, exclusive drops och advanced affiliate tools.</p>
        </Card>
        <Card className="rounded-3xl bg-slate-950/70 p-7">
          <h2 className="font-display text-2xl text-white">Upgrade funnel</h2>
          <p className="mt-3 text-sm text-slate-400">Placeholder for pricing tiers, Stripe products och conversion experiments.</p>
        </Card>
      </div>
    </main>
  );
}