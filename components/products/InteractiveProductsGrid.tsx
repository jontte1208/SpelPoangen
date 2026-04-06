"use client";

import { useState, useTransition } from "react";
import { handleAffiliateClick } from "@/app/(platform)/shop/actions";

type InteractiveProduct = {
  name: string;
  price: string;
  salePrice?: string;
  isOnSale?: boolean;
  image: string;
  affiliateLink: string;
};

type InteractiveProductsGridProps = {
  products: InteractiveProduct[];
};

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
      {products.map((product) => (
        <article
          key={product.name}
          className="group overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md transition-all duration-300 hover:shadow-neon-soft"
        >
          <div className="relative flex h-44 items-center justify-center bg-slate-950/60">
            <span className="absolute right-3 top-3 z-10 rounded-full border border-neon-cyan/35 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-cyan">
              +500 XP
            </span>
            {product.isOnSale && (
              <span className="absolute left-3 top-3 z-10 rounded-full border border-red-400/50 bg-red-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400 backdrop-blur-sm">
                REA
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
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-white">{product.name}</h3>
              {product.isOnSale && (
                <span className="shrink-0 rounded-full border border-red-400/40 bg-red-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
                  REA
                </span>
              )}
            </div>

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
      ))}
    </section>
  );
}
