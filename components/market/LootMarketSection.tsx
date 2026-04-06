"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useState, useTransition, useEffect } from "react";
import { handleAffiliateClick } from "@/app/(platform)/shop/actions";

type LootMarketSectionProps = {
  inDashboard?: boolean;
};

type HomeProduct = {
  id: string;
  name: string;
  priceSek: number;
  salePriceSek: number | null;
  isOnSale: boolean;
  expiresAt: string | null;
  xpReward: number;
  coinReward: number;
  affiliateLink: string;
  imageUrl: string | null;
};

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
  const [products, setProducts] = useState<HomeProduct[]>([]);

  useEffect(() => {
    fetch("/api/products/home")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  }, []);

  function handleBuyNow(productId: string, affiliateLink: string) {
    setActiveBuy(productId);

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

      {products.length === 0 ? (
        <p className="rounded-2xl border border-white/5 bg-slate-900/40 py-12 text-center text-sm text-slate-500">
          Inga produkter just nu. Kolla tillbaka snart!
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * index }}
              className={`group overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md transition-all duration-300 hover:shadow-neon-soft ${
                index === 0 ? "sm:col-span-2 xl:col-span-2" : ""
              }`}
            >
              <div className={`relative flex items-center justify-center bg-slate-950/60 ${index === 0 ? "h-56" : "h-44"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl ?? "https://images.unsplash.com/photo-1593640408182-31c228c5d4b0?auto=format&fit=crop&w=1200&q=80"}
                  alt={product.name}
                  className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {product.isOnSale && (
                  <span className="absolute left-3 top-3 rounded-full border border-red-400/50 bg-red-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400 backdrop-blur-sm">
                    REA
                  </span>
                )}
              </div>

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
                  <div className="flex flex-col">
                    {product.isOnSale && product.salePriceSek ? (
                      <>
                        <span className="font-display text-2xl font-semibold text-red-400">{formatSEK(product.salePriceSek)}</span>
                        <span className="text-sm text-slate-500 line-through">{formatSEK(product.priceSek)}</span>
                      </>
                    ) : (
                      <span className="font-display text-2xl font-semibold text-neon-cyan">{formatSEK(product.priceSek)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyNow(product.id, product.affiliateLink)}
                    disabled={isPending && activeBuy === product.id}
                    className="rounded-xl border border-neon-cyan/35 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-neon-cyan transition-colors hover:bg-neon-cyan/10"
                  >
                    {isPending && activeBuy === product.id ? "LADDAR..." : "Köp Nu"}
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      )}
    </>
  );
}
