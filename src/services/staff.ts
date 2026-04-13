import { api } from "@/lib/api";
import type {
  StaffResponse,
  StaffCreateRequest,
  StaffUpdateRequest,
  StaffToggleResponse,
  SuperadminResponse,
} from "@/types";

export async function listStaff(): Promise<StaffResponse[]> {
  return api.get<StaffResponse[]>("/admin/staff/");
}

export async function getStaff(staffId: string): Promise<StaffResponse> {
  return api.get<StaffResponse>(`/admin/staff/${staffId}`);
}

export async function createStaff(data: StaffCreateRequest): Promise<StaffResponse> {
  return api.post<StaffResponse>("/admin/staff/", data);
}

export async function updateStaff(
  staffId: string,
  data: StaffUpdateRequest
): Promise<StaffResponse> {
  return api.patch<StaffResponse>(`/admin/staff/${staffId}`, data);
}

export async function toggleStaffActive(staffId: string): Promise<StaffToggleResponse> {
  return api.patch<StaffToggleResponse>(`/admin/staff/${staffId}/toggle-active`);
}

export async function deleteStaff(staffId: string): Promise<void> {
  await api.delete(`/admin/staff/${staffId}`);
}

export async function listSuperadmins(): Promise<SuperadminResponse[]> {
  return api.get<SuperadminResponse[]>("/admin/superadmins");
}
