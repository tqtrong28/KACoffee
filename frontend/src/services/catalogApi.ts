import { apiClient } from "./apiClient";
import type { Branch, Category, Product } from "../types/models";

export async function fetchCategories() {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}

export async function fetchBranches() {
  const { data } = await apiClient.get<Branch[]>("/branches");
  return data;
}

export async function fetchProducts(params?: { category_id?: number; online_only?: boolean }) {
  const { data } = await apiClient.get<Product[]>("/products", { params });
  return data;
}
