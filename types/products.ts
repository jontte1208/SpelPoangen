export interface Product {
  id: string;
  name: string;
  description: string;
  priceSek: number;
  imageUrl: string | null;
  affiliateLink: string;
  xpReward: number;
  coinReward: number;
  category: ProductCategory;
  isActive: boolean;
  isOnSale: boolean;
  salePriceSek: number | null;
  expiresAt: Date | null;
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
}

export interface AffiliateClickPayload {
  productId: string;
  affiliateCode?: string;
}
