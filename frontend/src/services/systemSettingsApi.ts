import { apiClient } from "./apiClient";
import type { PublicSystemSettings, SystemSettings } from "../types/models";

export async function fetchPublicSystemSettings() {
  const { data } = await apiClient.get<PublicSystemSettings>("/system-settings/public");
  return data;
}

export async function fetchAdminSystemSettings() {
  const { data } = await apiClient.get<SystemSettings>("/admin/system-settings");
  return data;
}

export async function updateAdminSystemSettings(payload: {
  site_title: string;
  brand_headline: string;
  brand_subheadline: string;
  support_phone?: string;
  support_email?: string;
  delivery_fee_vnd: number;
  public_notice?: string;
}) {
  const { data } = await apiClient.patch<SystemSettings>("/admin/system-settings", payload);
  return data;
}
