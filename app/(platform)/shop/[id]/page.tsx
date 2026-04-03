import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trackProductView } from "@/lib/quest-system";
import ProductDetailClient from "./ProductDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
  });

  if (!product) notFound();

  // Track product view for quest progress
  await trackProductView(session.user.id, product.id);

  return <ProductDetailClient product={product} />;
}
