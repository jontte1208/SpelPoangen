"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useState, useTransition, useEffect } from "react";
import { handleAffiliateClick } from "@/app/(platform)/shop/actions";

type LootMarketSectionProps = {
  inDashboard?: boolean;
};

const marketProducts = [
  {
    name: "Razer Deathadder V3",
    priceSek: 1590,
    xpReward: 250,
    coinReward: 50,
    affiliateLink: "https://www.inet.se/produkt/6608751/razer-deathadder-v3",
    image:
      "https://images.unsplash.com/photo-1613141411244-0e4ac259d217?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "SteelSeries Apex Pro",
    priceSek: 2390,
    xpReward: 310,
    coinReward: 65,
    affiliateLink: "https://www.inet.se/produkt/6103338/steelseries-apex-pro-tkl",
    image:
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Corsair Vengeance RAM",
    priceSek: 1290,
    xpReward: 190,
    coinReward: 40,
    affiliateLink: "https://www.inet.se/produkt/5304912/corsair-vengeance-rgb-pro-32gb",
    image:
      "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "HyperX Cloud III",
    priceSek: 1090,
    xpReward: 210,
    coinReward: 45,
    affiliateLink: "https://www.inet.se/produkt/6305069/hyperx-cloud-iii",
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
  },
];

function formatSEK(amount: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 0,
  }).format(amount);
}

function useCountdownToMidnight() {
  const getSecondsLeft = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(getSecondsLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const s = String(secondsLeft % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function LootMarketSection({ inDashboard = false }: LootMarketSectionProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [activeBuy, setActiveBuy] = useState<string | null>(null);
  const countdown = useCountdownToMidnight();

  function handleBuyNow(productName: string, affiliateLink: string) {
    setActiveBuy(productName);

    startTransition(async () => {
      const result = await handleAffiliateClick(affiliateLink);

      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }

      setActiveBuy(null);
    });
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-6 rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">
              Loot Market
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-white sm:text-5xl">
              Säkra årets loot
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-300">
              Handla tech-prylar via våra länkar och tjäna XP & Coins direkt till din profil.
            </p>
          </div>

          {!inDashboard && (
            <>
              {session ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-neon-cyan transition-all hover:opacity-90"
                >
                  Min Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    signIn("discord", {
                      callbackUrl: "/discord/invite?next=/dashboard",
                    })
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-[#5865F2]/50 bg-[#5865F2]/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all hover:opacity-90"
                >
                  Logga in med Discord
                </button>
              )}
            </>
          )}
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {marketProducts.map((product, index) => {
          const isDailyDeal = index === 0;

          return (
            <motion.article
              key={product.name}
              initial={{ opacity: 0, y: 18, boxShadow: "0 0 0px rgba(239,68,68,0)" }}
              animate={
                isDailyDeal
                  ? {
                      opacity: 1,
                      y: 0,
                      boxShadow: [
                        "0 0 0px rgba(239,68,68,0)",
                        "0 0 28px 4px rgba(239,68,68,0.45)",
                        "0 0 0px rgba(239,68,68,0)",
                      ],
                    }
                  : { opacity: 1, y: 0 }
              }
              transition={
                isDailyDeal
                  ? {
                      opacity: { duration: 0.35, delay: 0.05 * index },
                      y: { duration: 0.35, delay: 0.05 * index },
                      boxShadow: {
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.4,
                      },
                    }
                  : { duration: 0.35, delay: 0.05 * index }
              }
              className={`group overflow-hidden rounded-2xl border bg-slate-900/40 backdrop-blur-md transition-all duration-300 hover:shadow-neon-soft ${
                isDailyDeal
                  ? "border-red-500/25"
                  : "border-white/5"
              } ${index === 0 ? "sm:col-span-2 xl:col-span-2" : ""}`}
            >
              {/* Image + countdown overlay */}
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                    isDailyDeal ? "h-56" : "h-44"
                  }`}
                />

                {isDailyDeal && (
                  <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-black/70 px-3 py-1.5 backdrop-blur-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                    </span>
                    <p className="font-mono text-[11px] font-semibold text-white">
                      Erbjudandet går ut om:{" "}
                      <span className="text-red-400">{countdown}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-5">
                {isDailyDeal && (
                  <span className="inline-flex rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-neon-cyan">
                    Daily Deal
                  </span>
                )}

                <h3 className="font-display text-xl font-semibold text-white">{product.name}</h3>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-neon-cyan/25 bg-neon-cyan/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-cyan">
                    +{product.xpReward} XP
                  </span>
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                    +{product.coinReward} Coins
                  </span>
                </div>

                {/* Stock bar — only on Daily Deal */}
                {isDailyDeal && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-red-400">
                      Endast ett fåtal kvar i lager!
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                        style={{ width: "85%" }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-semibold text-neon-cyan">
                    {formatSEK(product.priceSek)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBuyNow(product.name, product.affiliateLink)}
                    disabled={isPending && activeBuy === product.name}
                    className="rounded-xl border border-neon-cyan/35 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-neon-cyan transition-colors hover:bg-neon-cyan/10"
                  >
                    {isPending && activeBuy === product.name ? "LADDAR..." : "Köp Nu"}
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>
    </>
  );
}
