import { apiClient } from "./apiClient";
import type { DeliveryAdmin, DeliveryShipper } from "../types/models";

export async function fetchAdminDeliveries(branchId?: number) {
  const { data } = await apiClient.get<DeliveryAdmin[]>("/admin/deliveries", {
    params: branchId ? { branch_id: branchId } : undefined
  });
  return data;
}

export async function assignDeliveryShipper(orderId: number, shipperEmployeeId: number, note?: string) {
  const { data } = await apiClient.post<DeliveryAdmin>(`/admin/deliveries/${orderId}/assign`, {
    shipper_employee_id: shipperEmployeeId,
    note
  });
  return data;
}

export async function reassignDeliveryShipper(deliveryId: number, shipperEmployeeId: number, note?: string) {
  const { data } = await apiClient.patch<DeliveryAdmin>(`/admin/deliveries/${deliveryId}/reassign`, {
    shipper_employee_id: shipperEmployeeId,
    note
  });
  return data;
}

export async function fetchShipperDeliveries() {
  const { data } = await apiClient.get<DeliveryShipper[]>("/shipper/deliveries/me");
  return data;
}

export async function pickupDelivery(deliveryId: number) {
  const { data } = await apiClient.post<DeliveryShipper>(`/shipper/deliveries/${deliveryId}/pickup`);
  return data;
}

export async function startDelivery(deliveryId: number) {
  const { data } = await apiClient.post<DeliveryShipper>(`/shipper/deliveries/${deliveryId}/start`);
  return data;
}

export async function completeDelivery(deliveryId: number) {
  const { data } = await apiClient.post<DeliveryShipper>(`/shipper/deliveries/${deliveryId}/complete`);
  return data;
}

export async function failDelivery(deliveryId: number, failureReason: string) {
  const { data } = await apiClient.post<DeliveryShipper>(`/shipper/deliveries/${deliveryId}/fail`, {
    failure_reason: failureReason
  });
  return data;
}
