import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/ui/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Spelpoängen — Gamified Gamer Hub",
    template: "%s | Spelpoängen",
  },
  description:
    "Earn XP, unlock rewards, and discover the best gaming gear — all in one gamified affiliate hub.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Spelpoängen",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${orbitron.variable} font-sans bg-background text-foreground antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
