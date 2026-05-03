import { apiClient } from "./apiClient";
import type { AuthSession, MeResponse } from "../types/models";

export type CustomerRegisterPayload = {
  phone: string;
  password: string;
  full_name: string;
  email?: string;
};

export type CustomerLoginPayload = {
  phone: string;
  password: string;
};

export type EmployeeLoginPayload = {
  username: string;
  password: string;
};

export async function registerCustomer(payload: CustomerRegisterPayload) {
  const { data } = await apiClient.post<AuthSession>("/auth/customers/register", payload);
  return data;
}

export async function loginCustomer(payload: CustomerLoginPayload) {
  const { data } = await apiClient.post<AuthSession>("/auth/customers/login", payload);
  return data;
}

export async function loginEmployee(payload: EmployeeLoginPayload) {
  const { data } = await apiClient.post<AuthSession>("/auth/employees/login", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data;
}
