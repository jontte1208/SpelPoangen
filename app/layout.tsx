import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/ui/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Spelpoängen - Grind. Shop. Level Up.",
    template: "%s | Spelpoängen",
  },
  description: "Spelpoängen - Grind. Shop. Level Up.",
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
        className={`${inter.variable} ${rajdhani.variable} font-sans bg-background text-foreground antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
