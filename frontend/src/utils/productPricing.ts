import type { ProductSize } from "../types/models";

type SizePriced = {
  price_vnd: number;
  small_price_vnd?: number | null;
  large_price_vnd?: number | null;
};

export function getUnitPriceForSize(product: SizePriced, sizeOption: ProductSize) {
  if (sizeOption === "small" && product.small_price_vnd != null) return product.small_price_vnd;
  if (sizeOption === "large" && product.large_price_vnd != null) return product.large_price_vnd;
  return product.price_vnd;
}

export function getLowestDisplayedPrice(product: SizePriced) {
  return Math.min(
    product.price_vnd,
    product.small_price_vnd ?? product.price_vnd,
    product.large_price_vnd ?? product.price_vnd,
  );
}

export function hasFlexibleSizePricing(product: SizePriced) {
  return (
    (product.small_price_vnd != null && product.small_price_vnd !== product.price_vnd) ||
    (product.large_price_vnd != null && product.large_price_vnd !== product.price_vnd)
  );
}
