import { api, setTokenCookies, clearTokenCookies } from "./api";
import type { LoginRequest, SignupRequest, TokenResponse, MeResponse } from "@/types";

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

export function canAccessAdmin(role: string): boolean {
  const normalized = role.toLowerCase();
  return ["super_admin", "company_admin"].includes(normalized);
}

export function canAccessSuperAdmin(role: string): boolean {
  return role.toLowerCase() === "super_admin";
}

export function getDefaultRedirect(role: string): string {
  if (canAccessAdmin(role)) return "/admin/dashboard";
  return "/portal/dashboard";
}
