import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/5 border border-border p-6 shadow-card",
        glow && "shadow-neon border-neon-cyan/30",
        className
      )}
      {...props}
    />
  );
}
