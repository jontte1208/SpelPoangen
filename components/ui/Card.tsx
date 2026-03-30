import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-[1.5rem] p-6 shadow-card transition-all duration-300",
        glow && "border-neon-cyan/25 shadow-neon-soft",
        className
      )}
      {...props}
    />
  );
}
