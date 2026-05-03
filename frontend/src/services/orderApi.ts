import { apiClient } from "./apiClient";
import type { FulfillmentMethod, IceLevel, Order, OrderTracking, ProductSize, SugarLevel } from "../types/models";

type CreateOrderPayload = {
  branch_id: number;
  fulfillment_method: FulfillmentMethod;
  recipient_name: string;
  recipient_phone: string;
  address_line?: string;
  ward?: string;
  district?: string;
  city?: string;
  discount_code?: string;
  note?: string;
  items: {
    product_id: number;
    quantity: number;
    size_option: ProductSize;
    ice_level: IceLevel;
    sugar_level: SugarLevel;
    note?: string;
  }[];
};

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await apiClient.post<Order>("/orders", payload);
  return data;
}

export async function fetchMyOrders() {
  const { data } = await apiClient.get<Order[]>("/orders/me");
  return data;
}

export async function fetchMyOrder(orderId: number) {
  const { data } = await apiClient.get<Order>(`/orders/me/${orderId}`);
  return data;
}

export async function cancelMyOrder(orderId: number) {
  const { data } = await apiClient.post<Order>(`/orders/me/${orderId}/cancel`);
  return data;
}

export async function fetchOrderTracking(orderNo: string) {
  const { data } = await apiClient.get<OrderTracking>(`/orders/${orderNo}/tracking`);
  return data;
}
