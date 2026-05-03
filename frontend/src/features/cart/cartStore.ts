import { create } from "zustand";

import type { IceLevel, Product, ProductSize, SugarLevel } from "../../types/models";
import type { ProductCustomization } from "../../utils/productOptions";
import { getDefaultCustomization } from "../../utils/productOptions";
import { getUnitPriceForSize } from "../../utils/productPricing";

export type CartLine = {
  line_id: string;
  product_id: number;
  name: string;
  product_type: Product["product_type"];
  size_option: ProductSize;
  ice_level: IceLevel;
  sugar_level: SugarLevel;
  note: string;
  price_vnd: number;
  small_price_vnd: number | null;
  medium_price_vnd: number;
  large_price_vnd: number | null;
  quantity: number;
};

type CartState = {
  items: CartLine[];
  addItem: (product: Product, customization?: Partial<ProductCustomization>) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateLine: (
    lineId: string,
    patch: Partial<
      Omit<CartLine, "line_id" | "product_id" | "name" | "product_type" | "price_vnd" | "small_price_vnd" | "medium_price_vnd" | "large_price_vnd">
    >,
  ) => void;
  clear: () => void;
};

const storageKey = "kacoffee-cart";

function normalizeNote(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function createLineId(
  productId: number,
  sizeOption: ProductSize,
  iceLevel: IceLevel,
  sugarLevel: SugarLevel,
  note: string,
) {
  return `${productId}:${sizeOption}:${iceLevel}:${sugarLevel}:${encodeURIComponent(normalizeNote(note))}`;
}

function loadCart(): CartLine[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];

  return (JSON.parse(raw) as Partial<CartLine>[]).map((item) => {
    const sizeOption = item.size_option ?? "medium";
    const iceLevel = item.ice_level ?? "normal_ice";
    const sugarLevel = item.sugar_level ?? "normal_sugar";
    const note = item.note ?? "";
    const mediumPrice = Number(item.medium_price_vnd ?? item.price_vnd ?? 0);
    const smallPrice = item.small_price_vnd == null ? null : Number(item.small_price_vnd);
    const largePrice = item.large_price_vnd == null ? null : Number(item.large_price_vnd);
    const unitPrice = getUnitPriceForSize(
      {
        price_vnd: mediumPrice,
        small_price_vnd: smallPrice,
        large_price_vnd: largePrice,
      },
      sizeOption,
    );
    return {
      line_id: createLineId(Number(item.product_id), sizeOption, iceLevel, sugarLevel, note),
      product_id: Number(item.product_id),
      name: item.name ?? "",
      product_type: item.product_type ?? "takeaway",
      size_option: sizeOption,
      ice_level: iceLevel,
      sugar_level: sugarLevel,
      note,
      price_vnd: unitPrice,
      small_price_vnd: smallPrice,
      medium_price_vnd: mediumPrice,
      large_price_vnd: largePrice,
      quantity: Number(item.quantity ?? 1),
    };
  });
}

function persist(items: CartLine[]) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: typeof window === "undefined" ? [] : loadCart(),
  addItem: (product, customization) => {
    const defaults = getDefaultCustomization(product);
    const sizeOption = customization?.size_option ?? defaults.size_option;
    const iceLevel = customization?.ice_level ?? defaults.ice_level;
    const sugarLevel = customization?.sugar_level ?? defaults.sugar_level;
    const note = normalizeNote(customization?.note ?? defaults.note);
    const unitPrice = getUnitPriceForSize(product, sizeOption);
    const lineId = createLineId(product.id, sizeOption, iceLevel, sugarLevel, note);
    const existing = get().items.find((item) => item.line_id === lineId);
    const items = existing
      ? get().items.map((item) =>
          item.line_id === lineId ? { ...item, quantity: item.quantity + 1 } : item,
        )
      : [
          ...get().items,
          {
            line_id: lineId,
            product_id: product.id,
            name: product.name,
            product_type: product.product_type,
            size_option: sizeOption,
            ice_level: iceLevel,
            sugar_level: sugarLevel,
            note,
            price_vnd: unitPrice,
            small_price_vnd: product.small_price_vnd,
            medium_price_vnd: product.price_vnd,
            large_price_vnd: product.large_price_vnd,
            quantity: 1,
          },
        ];
    persist(items);
    set({ items });
  },
  removeItem: (lineId) => {
    const items = get().items.filter((item) => item.line_id !== lineId);
    persist(items);
    set({ items });
  },
  updateQuantity: (lineId, quantity) => {
    const items = get()
      .items.map((item) => (item.line_id === lineId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);
    persist(items);
    set({ items });
  },
  updateLine: (lineId, patch) => {
    const target = get().items.find((item) => item.line_id === lineId);
    if (!target) return;

    const nextLine = {
      ...target,
      ...patch,
      note: normalizeNote(patch.note ?? target.note),
    };
    nextLine.price_vnd = getUnitPriceForSize(
      {
        price_vnd: nextLine.medium_price_vnd,
        small_price_vnd: nextLine.small_price_vnd,
        large_price_vnd: nextLine.large_price_vnd,
      },
      nextLine.size_option,
    );
    const nextLineId = createLineId(
      target.product_id,
      nextLine.size_option,
      nextLine.ice_level,
      nextLine.sugar_level,
      nextLine.note,
    );
    const existing = get().items.find((item) => item.line_id === nextLineId && item.line_id !== lineId);
    const items = get()
      .items.filter((item) => item.line_id !== lineId)
      .map((item) =>
        item.line_id === nextLineId && existing
          ? { ...item, quantity: item.quantity + target.quantity }
          : item,
      );

    if (!existing) {
      items.push({
        ...nextLine,
        line_id: nextLineId,
      });
    }

    persist(items);
    set({ items });
  },
  clear: () => {
    persist([]);
    set({ items: [] });
  },
}));
