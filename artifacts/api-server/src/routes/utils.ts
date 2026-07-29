import { type Product as DbProduct } from "@workspace/db";

export const activePresenceThresholdMs = 5 * 60 * 1000;

export function mapProductRow(product: DbProduct) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    image: product.image || undefined, // Base64 image
    maxQuantity: product.maxQuantity,
    price: Number(product.price),
    active: product.active,
  };
}

export function mapSiteContentRow(content: {
  brandName: string;
  heroTitle: string;
  heroText: string;
  heroImageUrl: string;
  navLinks: string[];
}) {
  return {
    brandName: content.brandName,
    heroTitle: content.heroTitle,
    heroText: content.heroText,
    heroImageUrl: content.heroImageUrl,
    navLinks: content.navLinks,
  };
}

export function isPresenceActive(lastSeenAt: Date) {
  return Date.now() - new Date(lastSeenAt).getTime() < activePresenceThresholdMs;
}
