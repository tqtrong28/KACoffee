import { apiClient } from "./apiClient";
import type {
  AdminDashboardSummary,
  AuditLog,
  Branch,
  BranchTargetPolicy,
  BranchTargetProgressPoint,
  Category,
  DeliveryPerformancePoint,
  EmployeePerformancePoint,
  EmployeeProfile,
  Order,
  Product,
  RoleTargetPolicy,
  RevenueReportPoint
} from "../types/models";

type CategoryPayload = {
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  is_active: boolean;
};

export async function fetchAdminDashboard(branchId?: number) {
  const { data } = await apiClient.get<AdminDashboardSummary>("/admin/dashboard/summary", {
    params: branchId ? { branch_id: branchId } : undefined
  });
  return data;
}

export async function fetchAdminBranches() {
  const { data } = await apiClient.get<Branch[]>("/admin/branches");
  return data;
}

export async function createBranch(payload: {
  code: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  opening_hours?: string;
  map_url?: string;
  image_url?: string;
  amenities_text?: string;
  is_active: boolean;
}) {
  const { data } = await apiClient.post<Branch>("/admin/branches", payload);
  return data;
}

export async function updateBranch(
  id: number,
  payload: {
    code: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    opening_hours?: string;
    map_url?: string;
    image_url?: string;
    amenities_text?: string;
    is_active: boolean;
  }
) {
  const { data } = await apiClient.patch<Branch>(`/admin/branches/${id}`, payload);
  return data;
}

export async function createCategory(payload: CategoryPayload) {
  const { data } = await apiClient.post<Category>("/admin/categories", payload);
  return data;
}

export async function updateCategory(id: number, payload: CategoryPayload) {
  const { data } = await apiClient.patch<Category>(`/admin/categories/${id}`, payload);
  return data;
}

export async function createProduct(payload: {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  product_type: Product["product_type"];
  price_vnd: number;
  small_price_vnd?: number | null;
  large_price_vnd?: number | null;
  image_url?: string;
  badge_text?: string;
  flavor_note?: string;
  is_featured: boolean;
  is_active: boolean;
  track_inventory: boolean;
  inventory_qty: number;
  is_online_available: boolean;
  is_in_store_available: boolean;
}) {
  const { data } = await apiClient.post<Product>("/admin/products", payload);
  return data;
}

export async function updateProduct(id: number, payload: {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  product_type: Product["product_type"];
  price_vnd: number;
  small_price_vnd?: number | null;
  large_price_vnd?: number | null;
  image_url?: string;
  badge_text?: string;
  flavor_note?: string;
  is_featured: boolean;
  is_active: boolean;
  track_inventory: boolean;
  inventory_qty: number;
  is_online_available: boolean;
  is_in_store_available: boolean;
}) {
  const { data } = await apiClient.patch<Product>(`/admin/products/${id}`, payload);
  return data;
}

export async function fetchAdminOrders(branchId?: number) {
  const { data } = await apiClient.get<Order[]>("/admin/orders", {
    params: branchId ? { branch_id: branchId } : undefined
  });
  return data;
}

export async function fetchRevenueReport(branchId?: number) {
  const { data } = await apiClient.get<RevenueReportPoint[]>("/admin/reports/revenue", {
    params: branchId ? { branch_id: branchId } : undefined
  });
  return data;
}

export async function fetchDeliveryPerformanceReport(branchId?: number) {
  const { data } = await apiClient.get<DeliveryPerformancePoint[]>("/admin/reports/delivery-performance", {
    params: branchId ? { branch_id: branchId } : undefined
  });
  return data;
}

export async function fetchEmployeePerformanceReport(branchId?: number) {
  const { data } = await apiClient.get<EmployeePerformancePoint[]>("/admin/reports/employee-performance", {
    params: branchId ? { branch_id: branchId } : undefined
  });
  return data;
}

export async function fetchBranchTargetProgressReport(branchId?: number) {
  const { data } = await apiClient.get<BranchTargetProgressPoint[]>("/admin/reports/branch-target-progress", {
    params: branchId ? { branch_id: branchId } : undefined
  });
  return data;
}

export async function fetchEmployees(branchId?: number) {
  const { data } = await apiClient.get<EmployeeProfile[]>("/admin/employees", {
    params: branchId ? { branch_id: branchId } : undefined
  });
  return data;
}

export async function fetchAuditLogs(params?: { branch_id?: number; action?: string; query?: string }) {
  const { data } = await apiClient.get<AuditLog[]>("/admin/audit-logs", {
    params,
  });
  return data;
}

export async function createEmployee(payload: {
  username: string;
  password: string;
  full_name: string;
  phone?: string;
  role_code: string;
  branch_id: number;
}) {
  const { data } = await apiClient.post<EmployeeProfile>("/admin/employees", payload);
  return data;
}

export async function fetchRoleTargetPolicies() {
  const { data } = await apiClient.get<RoleTargetPolicy[]>("/admin/performance-targets/roles");
  return data;
}

export async function createRoleTargetPolicy(payload: {
  role_code: string;
  monthly_order_target: number;
  monthly_revenue_target_vnd: number;
  monthly_delivery_target: number;
  bonus_rate_percent: number;
  bonus_per_extra_order_vnd: number;
  bonus_per_extra_delivery_vnd: number;
  bonus_flat_vnd: number;
  is_active: boolean;
}) {
  const { data } = await apiClient.post<RoleTargetPolicy>("/admin/performance-targets/roles", payload);
  return data;
}

export async function updateRoleTargetPolicy(
  id: number,
  payload: {
    role_code: string;
    monthly_order_target: number;
    monthly_revenue_target_vnd: number;
    monthly_delivery_target: number;
    bonus_rate_percent: number;
    bonus_per_extra_order_vnd: number;
    bonus_per_extra_delivery_vnd: number;
    bonus_flat_vnd: number;
    is_active: boolean;
  }
) {
  const { data } = await apiClient.patch<RoleTargetPolicy>(`/admin/performance-targets/roles/${id}`, payload);
  return data;
}

export async function fetchBranchTargetPolicies() {
  const { data } = await apiClient.get<BranchTargetPolicy[]>("/admin/performance-targets/branches");
  return data;
}

export async function createBranchTargetPolicy(payload: {
  branch_id: number;
  monthly_order_target: number;
  monthly_revenue_target_vnd: number;
  bonus_rate_percent: number;
  bonus_flat_vnd: number;
  is_active: boolean;
}) {
  const { data } = await apiClient.post<BranchTargetPolicy>("/admin/performance-targets/branches", payload);
  return data;
}

export async function updateBranchTargetPolicy(
  id: number,
  payload: {
    branch_id: number;
    monthly_order_target: number;
    monthly_revenue_target_vnd: number;
    bonus_rate_percent: number;
    bonus_flat_vnd: number;
    is_active: boolean;
  }
) {
  const { data } = await apiClient.patch<BranchTargetPolicy>(`/admin/performance-targets/branches/${id}`, payload);
  return data;
}
