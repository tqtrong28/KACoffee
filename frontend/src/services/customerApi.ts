import { apiClient } from "./apiClient";
import type { CustomerNotification, CustomerProfile, MembershipSummary } from "../types/models";

export async function fetchCustomerProfile() {
  const { data } = await apiClient.get<CustomerProfile>("/customers/me");
  return data;
}

export async function updateCustomerProfile(payload: Partial<CustomerProfile>) {
  const { data } = await apiClient.patch<CustomerProfile>("/customers/me", payload);
  return data;
}

export async function fetchMembership() {
  const { data } = await apiClient.get<MembershipSummary>("/membership/me");
  return data;
}

export async function fetchMembershipRanks() {
  const { data } = await apiClient.get<
    {
      id: number;
      code: string;
      name: string;
      min_points: number;
    }[]
  >("/membership/ranks");
  return data;
}

export async function fetchPointHistory() {
  const { data } = await apiClient.get("/membership/me/point-history");
  return data;
}

export async function fetchCustomerNotifications() {
  const { data } = await apiClient.get<CustomerNotification[]>("/notifications/me");
  return data;
}

export async function markAllCustomerNotificationsRead() {
  const { data } = await apiClient.patch<{ updated: number }>("/notifications/me/read-all");
  return data;
}
