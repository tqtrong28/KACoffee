import type { IceLevel, Product, ProductSize, ServingOption, SugarLevel } from "../types/models";

export type ProductCustomization = {
  serving_option?: ServingOption;
  size_option: ProductSize;
  ice_level: IceLevel;
  sugar_level: SugarLevel;
  note: string;
};

export function getDefaultCustomization(
  product: Pick<Product, "product_type">,
  options: { includeServingOption?: boolean } = {},
): ProductCustomization {
  const { includeServingOption = false } = options;
  return {
    ...(includeServingOption ? { serving_option: "takeaway" as ServingOption } : {}),
    size_option: product.product_type === "bottled" ? "medium" : "medium",
    ice_level: product.product_type === "bottled" ? "no_ice" : "normal_ice",
    sugar_level: product.product_type === "bottled" ? "normal_sugar" : "normal_sugar",
    note: "",
  };
}

export function supportsDrinkAdjustments(product: Pick<Product, "product_type">) {
  return product.product_type !== "bottled";
}
