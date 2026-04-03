"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useState, useTransition } from "react";
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

export default function LootMarketSection({ inDashboard = false }: LootMarketSectionProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [activeBuy, setActiveBuy] = useState<string | null>(null);

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
            <p className="mt-2 max-w-3xl text-xs text-slate-400">
              Reklamlänk: När du handlar via våra länkar får vi en liten provision som hjälper till att hålla SpelPoängen rullande. Tack för supporten!
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
        {marketProducts.map((product, index) => (
          <motion.article
            key={product.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * index }}
            className={`group overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md transition-all duration-300 hover:shadow-neon-soft ${
              index === 0 ? "sm:col-span-2 xl:col-span-2" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                index === 0 ? "h-56" : "h-44"
              }`}
            />

            <div className="space-y-4 p-5">
              {index === 0 && (
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
        ))}
      </section>
    </>
  );
}
