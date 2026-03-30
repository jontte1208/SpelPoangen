import { Card } from "@/components/ui/Card";
import { SectionIntro } from "@/components/dashboard/SectionIntro";

export const metadata = { title: "Quests" };

export default function QuestsPage() {
  return (
    <main>
      <SectionIntro
        eyebrow="Quests"
        title="Alla uppdrag har sin egen route"
        description="Quests ligger inte langre bakom en fast tab-panel. Du kan landa direkt pa sidan och bygga vidare med filters, progress och claim-actions."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
        <Card className="rounded-3xl bg-slate-950/70 p-6">
          <h2 className="font-display text-xl text-white">Weekly quests</h2>
          <p className="mt-3 text-sm text-slate-400">Placeholder for repeatable weekly actions med XP och coins.</p>
        </Card>
        <Card className="rounded-3xl bg-slate-950/70 p-6">
          <h2 className="font-display text-xl text-white">One-time quests</h2>
          <p className="mt-3 text-sm text-slate-400">Placeholder for onboarding, profile setup och unlock flows.</p>
        </Card>
      </div>
    </main>
  );
}