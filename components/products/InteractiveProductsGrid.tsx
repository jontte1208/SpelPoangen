"use client";

import { useState, useTransition } from "react";
import { handleAffiliateClick } from "@/app/(platform)/shop/actions";

type InteractiveProduct = {
  name: string;
  price: string;
  salePrice?: string;
  isOnSale?: boolean;
  isFlashDeal?: boolean;
  expiresAt?: string | null;
  image: string;
  affiliateLink: string;
};

type InteractiveProductsGridProps = {
  products: InteractiveProduct[];
};

function formatExpiry(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffH / 24);
  if (diffD > 0) return `Utgår om ${diffD} dag${diffD > 1 ? "ar" : ""}`;
  if (diffH > 0) return `Utgår om ${diffH} tim`;
  const diffM = Math.floor(diffMs / (1000 * 60));
  return `Utgår om ${diffM} min`;
}

export default function InteractiveProductsGrid({ products }: InteractiveProductsGridProps) {
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
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => {
        const expiryLabel = formatExpiry(product.expiresAt);
        return (
          <article
            key={product.name}
            className="group overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md transition-all duration-300 hover:shadow-neon-soft"
          >
            <div className="relative flex h-44 items-center justify-center bg-slate-950/60">
              <span className="absolute right-3 top-3 z-10 rounded-full border border-neon-cyan/35 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-cyan">
                +500 XP
              </span>
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
                {product.isOnSale && (
                  <span className="rounded-full border border-red-400/50 bg-red-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400 backdrop-blur-sm">
                    REA
                  </span>
                )}
                {product.isFlashDeal && (
                  <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400 backdrop-blur-sm">
                    ⚡ Flash
                  </span>
                )}
              </div>
              {expiryLabel && (
                <span className="absolute bottom-2 right-3 z-10 rounded-full border border-orange-400/40 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold text-orange-400 backdrop-blur-sm">
                  {expiryLabel}
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="space-y-4 p-5">
              <h3 className="font-display text-lg font-semibold text-white">{product.name}</h3>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {product.isOnSale && product.salePrice ? (
                    <>
                      <span className="font-display text-xl font-semibold text-red-400">{product.salePrice}</span>
                      <span className="text-sm text-slate-500 line-through">{product.price}</span>
                    </>
                  ) : (
                    <span className="font-display text-xl font-semibold text-neon-cyan">{product.price}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleBuyNow(product.name, product.affiliateLink)}
                  disabled={isPending && activeBuy === product.name}
                  className="rounded-xl border border-neon-cyan/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neon-cyan transition-colors hover:bg-neon-cyan hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending && activeBuy === product.name ? "LADDAR..." : "KÖP NU"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
