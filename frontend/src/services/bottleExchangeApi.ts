import { apiClient } from "./apiClient";
import type { BottleExchangeRecord } from "../types/models";

export async function createBottleExchange(payload: {
  customer_phone?: string;
  returned_bottle_qty: number;
  reward_product_id: number;
  note?: string;
}) {
  const { data } = await apiClient.post<BottleExchangeRecord>("/staff/bottle-exchanges", payload);
  return data;
}

export async function fetchBottleExchanges() {
  const { data } = await apiClient.get<BottleExchangeRecord[]>("/admin/bottle-exchanges");
  return data;
}
