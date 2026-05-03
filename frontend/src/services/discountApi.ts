import { apiClient } from "./apiClient";
import type { Discount, DiscountValidation } from "../types/models";

export async function fetchAvailableDiscounts() {
  const { data } = await apiClient.get<Discount[]>("/discounts/me/available");
  return data;
}

export async function validateDiscount(code: string, subtotal_vnd: number) {
  const { data } = await apiClient.post<DiscountValidation>("/discounts/validate", {
    code,
    subtotal_vnd
  });
  return data;
}

export async function fetchAdminDiscounts() {
  const { data } = await apiClient.get<Discount[]>("/admin/discounts");
  return data;
}

export async function createDiscount(payload: {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  value: number;
  min_order_value_vnd?: number;
  start_at?: string;
  end_at?: string;
  is_active: boolean;
  eligible_rank_ids: number[];
}) {
  const { data } = await apiClient.post<Discount>("/admin/discounts", payload);
  return data;
}
