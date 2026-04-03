"use client";

import { ExternalLink, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { handleAffiliateClick } from "@/app/(platform)/shop/actions";
import { formatSEK } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description: string;
  priceSek: number;
  imageUrl: string | null;
  affiliateLink: string;
  xpReward: number;
  coinReward: number;
  category: string;
};

export default function ProductDetailClient({ product }: { product: Product }) {
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
    <main className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Tillbaka till butiken
      </Link>

      {product.imageUrl && (
        <div className="overflow-hidden rounded-2xl border border-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full object-cover max-h-80"
          />
        </div>
      )}

      <div className="glass-panel rounded-2xl bg-slate-900/40 p-6 space-y-4">
        <h1 className="font-display text-2xl font-bold text-white">{product.name}</h1>
        <p className="text-slate-400 leading-relaxed">{product.description}</p>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/30 bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-widest text-neon-cyan">
            <Zap size={10} /> +{product.xpReward} XP
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/30 bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-widest text-neon-cyan">
            +{product.coinReward} Coins
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="font-display text-2xl font-semibold text-neon-cyan">
            {formatSEK(product.priceSek)}
          </span>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl border border-neon-cyan/40 bg-transparent px-4 py-2.5 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "LADDAR..." : "KÖP NU"} <ExternalLink size={12} />
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </main>
  );
}
