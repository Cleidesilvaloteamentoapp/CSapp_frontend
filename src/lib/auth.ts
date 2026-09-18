import { api, setTokenCookies, clearTokenCookies } from "./api";
import type {
  LoginRequest,
  SignupRequest,
  TokenResponse,
  MeResponse,
  StaffPermissions,
  StaffResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  PasswordResetResponse,
  SuperadminCreateRequest,
} from "@/types";

const ALL_FALSE_PERMISSIONS: StaffPermissions = {
  view_clients: false,
  manage_clients: false,
  view_lots: false,
  manage_lots: false,
  view_financial: false,
  manage_financial: false,
  view_renegotiations: false,
  manage_renegotiations: false,
  view_rescissions: false,
  manage_rescissions: false,
  view_reports: false,
  view_service_requests: false,
  manage_service_requests: false,
  view_documents: false,
  manage_documents: false,
  view_sicredi: false,
  manage_sicredi: false,
  view_whatsapp: false,
  manage_whatsapp: false,
  view_financial_settings: false,
  manage_financial_settings: false,
};

export async function login(credentials: LoginRequest): Promise<MeResponse> {
  const tokens = await api.post<TokenResponse>("/auth/login", credentials);
  setTokenCookies(tokens.access_token, tokens.refresh_token);
  const me = await api.get<MeResponse>("/auth/me");
  return me;
}

export async function signup(data: SignupRequest): Promise<MeResponse> {
  const tokens = await api.post<TokenResponse>("/auth/signup", data);
  setTokenCookies(tokens.access_token, tokens.refresh_token);
  const me = await api.get<MeResponse>("/auth/me");
  return me;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // Logout is client-side, continue even if request fails
  } finally {
    clearTokenCookies();
    window.location.href = "/login";
  }
}

export async function getMe(): Promise<MeResponse | null> {
  try {
    return await api.get<MeResponse>("/auth/me");
  } catch {
    return null;
  }
}

// The API returns roles upper-cased ("STAFF", "COMPANY_ADMIN"). Every role
// comparison must go through these helpers -- comparing against a lowercase
// literal silently fails and locks the user out of their own area.
export function normalizeRole(role: string | null | undefined): string {
  return (role ?? "").toLowerCase();
}

export function isStaffRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "staff";
}

export function canAccessAdmin(role: string): boolean {
  return ["super_admin", "company_admin"].includes(normalizeRole(role));
}

export function canAccessSuperAdmin(role: string): boolean {
  return normalizeRole(role) === "super_admin";
}

export function getDefaultRedirect(role: string): string {
  if (isStaffRole(role)) return "/staff/dashboard";
  if (canAccessAdmin(role)) return "/admin/dashboard";
  return "/portal/dashboard";
}

export async function getStaffPermissions(staffId: string): Promise<StaffPermissions> {
  const staff = await api.get<StaffResponse>(`/admin/staff/${staffId}`);
  // A staff account with no permission row genuinely has nothing granted.
  // That is NOT the same as failing to load: a load failure propagates so the
  // caller can tell the user, instead of silently denying every screen.
  return staff.permissions ?? ALL_FALSE_PERMISSIONS;
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<PasswordResetResponse> {
  return api.post<PasswordResetResponse>("/auth/forgot-password", data);
}

export async function resetPassword(data: ResetPasswordRequest): Promise<PasswordResetResponse> {
  return api.post<PasswordResetResponse>("/auth/reset-password", data);
}

export async function changePassword(data: ChangePasswordRequest): Promise<PasswordResetResponse> {
  return api.post<PasswordResetResponse>("/auth/change-password", data);
}

export async function createSuperadmin(data: SuperadminCreateRequest): Promise<MeResponse> {
  return api.post<MeResponse>("/admin/superadmins", data);
}
