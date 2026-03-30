import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/types/products";

export const metadata = { title: "Shop" };

export default async function ShopPage() {
  const session = await getServerSession(authOptions);

  const dbProducts = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const products: Product[] = dbProducts.map((p) => ({
    ...p,
    category: p.category as Product["category"],
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl mb-8 text-neon-cyan">
        Gaming Shop
      </h1>
      {products.length === 0 ? (
        <p className="text-slate-400">No products yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              affiliateCode={session?.user?.affiliateCode}
              showXPBadge
            />
          ))}
        </div>
      )}
    </main>
  );
}
