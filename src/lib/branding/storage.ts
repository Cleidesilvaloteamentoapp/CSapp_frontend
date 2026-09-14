/**
 * Local cache of the resolved branding.
 *
 * Two jobs:
 *  1. Paint the right colours before the API answers (no flash of the platform
 *     palette on every navigation).
 *  2. Let the login screen show the company's brand even though there is no
 *     session yet — the previous login left its branding here.
 */

import type { TokenMap } from "./tokens";

export const BRANDING_CACHE_KEY = "csapp:branding:v1";

export type CachedBranding = {
  companyId: string | null;
  companySlug: string | null;
  /** Already-derived tokens, so the pre-paint script stays a trivial loop. */
  tokens: TokenMap;
  logoUrl: string | null;
  faviconUrl: string | null;
  appIconUrl: string | null;
  displayName: string | null;
  tagline: string | null;
};

export function readCachedBranding(): CachedBranding | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BRANDING_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedBranding;
    if (!parsed || typeof parsed !== "object" || !parsed.tokens) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedBranding(value: CachedBranding): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(value));
  } catch {
    // Private mode or a full quota — branding is cosmetic, never block on it.
  }
}

export function clearCachedBranding(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BRANDING_CACHE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Runs before first paint, inlined in <head>. Kept tiny and self-contained:
 * it only replays a cached token map, so none of the colour maths ships here.
 */
export const PRE_PAINT_SCRIPT = `(function(){try{
var r=localStorage.getItem(${JSON.stringify(BRANDING_CACHE_KEY)});
if(!r)return;var t=JSON.parse(r).tokens;if(!t)return;
for(var k in t){if(k.charAt(0)==='-')document.documentElement.style.setProperty(k,t[k]);}
}catch(e){}})();`;
