"use client";

import { motion } from "framer-motion";
import { ExternalLink, Zap } from "lucide-react";
import { formatSEK } from "@/lib/utils";
import type { ProductCardProps } from "@/types/products";

export default function ProductCard({
  product,
  affiliateCode,
  showXPBadge = false,
}: ProductCardProps) {
  const href = affiliateCode
    ? `${product.affiliateUrl}?ref=${affiliateCode}`
    : product.affiliateUrl;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-white/5 border border-border shadow-card overflow-hidden flex flex-col"
    >
      {product.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-display text-sm leading-snug">{product.title}</h3>
          {showXPBadge && (
            <span className="flex items-center gap-1 text-xs text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full whitespace-nowrap">
              <Zap size={10} />+5 XP
            </span>
          )}
        </div>
        <p className="text-slate-400 text-sm line-clamp-2 flex-1">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-neon-cyan font-semibold">
            {formatSEK(product.price)}
          </span>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
          >
            Buy <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
