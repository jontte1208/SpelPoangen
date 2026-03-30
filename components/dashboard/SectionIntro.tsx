import { Card } from "@/components/ui/Card";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionIntro({ eyebrow, title, description }: SectionIntroProps) {
  return (
    <Card className="mb-6 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">{eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400 sm:text-base">{description}</p>
    </Card>
  );
}