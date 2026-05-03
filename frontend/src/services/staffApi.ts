import { apiClient } from "./apiClient";
import type {
  EmployeeProfile,
  IceLevel,
  Order,
  OrderStatus,
  ProductSize,
  ServingOption,
  StaffCustomerLookup,
  SugarLevel,
} from "../types/models";

export async function fetchEmployeeMe() {
  const { data } = await apiClient.get<EmployeeProfile>("/employees/me");
  return data;
}

export async function searchCustomerByPhone(phone: string) {
  const { data } = await apiClient.get<StaffCustomerLookup>("/staff/customers/search", {
    params: { phone }
  });
  return data;
}

export async function createStaffOrder(payload: {
  source: "in_store" | "phone";
  customer_phone?: string;
  fulfillment_method: "pickup" | "delivery";
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
    serving_option?: ServingOption;
    size_option?: ProductSize;
    ice_level?: IceLevel;
    sugar_level?: SugarLevel;
    note?: string;
  }[];
}) {
  const { data } = await apiClient.post<Order>("/staff/orders", payload);
  return data;
}

export async function fetchStaffOrders() {
  const { data } = await apiClient.get<Order[]>("/staff/orders");
  return data;
}

export async function updateStaffOrderStatus(orderId: number, status: OrderStatus, note?: string) {
  const { data } = await apiClient.patch<Order>(`/staff/orders/${orderId}/status`, { status, note });
  return data;
}

export async function cancelStaffOrder(orderId: number) {
  const { data } = await apiClient.post<Order>(`/staff/orders/${orderId}/cancel`);
  return data;
}
