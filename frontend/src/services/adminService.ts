import api from "./api";
import type { AdminDashboardResponse } from "../types/api";

export async function getAdminDashboard(authorization: string) {
  const response = await api.get<AdminDashboardResponse>("/admin/dashboard", {
    headers: { Authorization: authorization },
  });
  return response.data;
}
