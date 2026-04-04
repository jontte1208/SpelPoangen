import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { SectionIntro } from "@/components/dashboard/SectionIntro";
import { PremiumCheckoutButton } from "@/components/premium/PremiumCheckoutButton";

export const metadata = { title: "Premium" };

const PERKS = [
  { icon: "⚡", title: "1,5x XP", desc: "Tjäna 50% mer XP på allt du gör." },
  { icon: "🎁", title: "Tidiga drops", desc: "Få tillgång till nya drops 24h innan alla andra." },
  { icon: "👑", title: "Premium-roll på Discord", desc: "Exklusiv roll som syns i servern." },
];

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string };
}) {
  const session = await getServerSession(authOptions);
  const isPremium = session?.user?.tier === "PREMIUM";

  return (
    <main>
      <SectionIntro
        eyebrow="Premium"
        title={isPremium ? "Du är redan Premium" : "Uppgradera till Premium"}
        description={
          isPremium
            ? "Tack för att du stödjer SpelPoängen. Här kan du hantera din prenumeration."
            : "Få mer XP, tidiga drops och exklusiv Discord-roll för 49 kr i månaden."
        }
      />

      {searchParams.success && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm text-green-400">
          Välkommen som Premium-medlem! Dina förmåner är nu aktiva.
        </div>
      )}

      {searchParams.canceled && (
        <div className="mb-6 rounded-xl border border-slate-600/30 bg-slate-800/50 px-5 py-3 text-sm text-slate-400">
          Köpet avbröts. Du kan försöka igen när du vill.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {PERKS.map((perk) => (
          <Card key={perk.title} className="rounded-3xl bg-slate-950/70 p-7">
            <div className="mb-3 text-3xl">{perk.icon}</div>
            <h3 className="font-display text-lg text-white">{perk.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{perk.desc}</p>
          </Card>
        ))}
      </div>

      <Card
        glow
        className="mt-6 rounded-3xl border-neon-cyan/25 bg-slate-950/70 p-8 text-center"
      >
        <p className="font-display text-3xl text-white">49 kr</p>
        <p className="mt-1 text-sm text-slate-400">per månad · avsluta när som helst</p>
        <div className="mx-auto mt-6 max-w-xs">
          {session ? (
            <PremiumCheckoutButton isPremium={isPremium} />
          ) : (
            <p className="text-sm text-slate-400">Logga in för att bli Premium.</p>
          )}
        </div>
      </Card>
    </main>
  );
}
