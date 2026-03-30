export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  affiliateUrl: string;
  category: ProductCategory;
  isActive: boolean;
  createdAt: Date;
}

export type ProductCategory =
  | "peripherals"
  | "hardware"
  | "games"
  | "chairs"
  | "headsets"
  | "monitors"
  | "streaming";

export interface ProductCardProps {
  product: Product;
  affiliateCode?: string;
  showXPBadge?: boolean;
}

export interface AffiliateClickPayload {
  productId: string;
  affiliateCode?: string;
}
