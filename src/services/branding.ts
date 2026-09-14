/**
 * Branding API client.
 *
 * Read is open to every authenticated role (the client portal is branded too);
 * writes require a company admin.
 */

import { api } from "@/lib/api";

export type BrandingAssetKind = "logo" | "favicon" | "app_icon";

export interface Branding {
  company_id: string;
  company_slug: string;

  primary_color: string | null;
  accent_color: string | null;
  sidebar_color: string | null;
  background_color: string | null;
  success_color: string | null;

  radius: string | null;

  /** API-relative paths, e.g. `/branding/public/acme/logo`. Resolve with `assetUrl`. */
  logo_url: string | null;
  favicon_url: string | null;
  app_icon_url: string | null;

  display_name: string | null;
  tagline: string | null;

  updated_at: string | null;
}

export type BrandingPayload = Partial<{
  primary_color: string | null;
  accent_color: string | null;
  sidebar_color: string | null;
  background_color: string | null;
  success_color: string | null;
  radius: string | null;
  display_name: string | null;
  tagline: string | null;
}>;

/**
 * Turn an API-relative asset path into a URL the browser can load.
 *
 * Assets go through the Next proxy so they stay same-origin: no CORS, no CSP
 * exception, and the same URL shape works in dev and in production.
 */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `/api/proxy${path}`;
}

export function getMyBranding(): Promise<Branding> {
  return api.get<Branding>("/branding/me");
}

export function getPublicBranding(slug: string): Promise<Branding> {
  return api.get<Branding>(`/branding/public/${encodeURIComponent(slug)}`);
}

export function updateMyBranding(payload: BrandingPayload): Promise<Branding> {
  return api.put<Branding>("/branding/me", payload);
}

export function uploadBrandingAsset(kind: BrandingAssetKind, file: File): Promise<Branding> {
  return api.upload<Branding>(`/branding/me/asset/${kind}`, file);
}

export function deleteBrandingAsset(kind: BrandingAssetKind): Promise<Branding> {
  return api.delete<Branding>(`/branding/me/asset/${kind}`);
}

// ---- Super admin: any company ----

export function getCompanyBranding(companyId: string): Promise<Branding> {
  return api.get<Branding>(`/branding/companies/${companyId}`);
}

export function updateCompanyBranding(
  companyId: string,
  payload: BrandingPayload
): Promise<Branding> {
  return api.put<Branding>(`/branding/companies/${companyId}`, payload);
}
