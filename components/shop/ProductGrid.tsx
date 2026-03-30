import ProductCard from "@/components/shop/ProductCard";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/products";

type DbProduct = Omit<Product, "category"> & {
  category: string;
};

export default async function ProductGrid() {
  let products: Product[] = [];

  try {
    const dbProducts = (await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })) as DbProduct[];

    products = dbProducts.map((product) => ({
      ...product,
      category: product.category as Product["category"],
    }));
  } catch {
    products = [];
  }

  if (products.length === 0) {
    return (
      <div className="glass-panel rounded-3xl bg-slate-900/40 p-8 text-slate-400 shadow-card">
        Inga produkter hittades just nu. Butiken ar fortfarande routad korrekt och kan fyllas med data senare.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
