"use client";

import { motion } from "framer-motion";
import { ExternalLink, Zap } from "lucide-react";
import { useState, useTransition } from "react";
import { handleAffiliateClick } from "@/app/(platform)/shop/actions";
import { formatSEK } from "@/lib/utils";
import type { ProductCardProps } from "@/types/products";

export default function ProductCard({ product }: ProductCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleBuyNow() {
    setError(null);

    startTransition(async () => {
      const result = await handleAffiliateClick(product.affiliateLink, product.id);

      if (!result.url) {
        setError(result.error ?? "Could not open affiliate link.");
        return;
      }

      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md transition-all duration-300 hover:shadow-neon-soft"
    >
      {product.imageUrl && (
        <div className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-display text-lg font-semibold leading-snug text-white">{product.name}</h3>
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center justify-center gap-1 whitespace-nowrap rounded-full border border-neon-cyan/30 bg-slate-950/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.15)]">
              <Zap size={10} />+{product.xpReward} XP
            </span>
            <span className="flex items-center justify-center whitespace-nowrap rounded-full border border-neon-cyan/30 bg-slate-950/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.12)]">
              +{product.coinReward} Coins
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-sm line-clamp-2 flex-1">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-display text-xl font-semibold text-neon-cyan">
            {formatSEK(product.priceSek)}
          </span>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl border border-neon-cyan/40 bg-transparent px-3 py-2 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "LADDAR..." : "KÖP NU"} <ExternalLink size={12} />
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </motion.div>
  );
}
