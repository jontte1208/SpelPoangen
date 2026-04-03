import { SectionIntro } from "@/components/dashboard/SectionIntro";
import WeeklyQuests from "@/components/quests/WeeklyQuests";

export const metadata = { title: "Quests" };

export default function QuestsPage() {
  return (
    <main className="space-y-8">
      <SectionIntro
        eyebrow="Uppdrag"
        title="Slutför quests, samla belöningar"
        description="Slutför veckans utmaningar för att tjäna XP och Coins. Nya quests varje måndag."
      />
      <WeeklyQuests />
    </main>
  );
}
