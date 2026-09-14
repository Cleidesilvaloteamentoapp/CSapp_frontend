"use client";

/**
 * Applies a company's visual identity at runtime.
 *
 * The company is known from the session, so this provider fetches once the
 * user is authenticated and caches the result. On the next visit — including
 * the login screen, where there is no session — the cache paints the brand
 * before the first frame.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { assetUrl, getMyBranding, type Branding } from "@/services/branding";
import { useAuth } from "@/contexts/auth-context";
import { applyTokens, clearTokens, deriveTokens } from "@/lib/branding/tokens";
import {
  readCachedBranding,
  writeCachedBranding,
  type CachedBranding,
} from "@/lib/branding/storage";

/** Platform fallbacks — what the app is called when no company overrides it. */
export const PLATFORM_NAME = "CSApp";
export const PLATFORM_TAGLINE = "Gestão de Loteamentos";

interface BrandingContextType {
  branding: Branding | null;
  loading: boolean;
  displayName: string;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  appIconUrl: string | null;
  /** Re-apply after saving on the settings screen. */
  refreshBranding: () => Promise<void>;
  /** Preview arbitrary tokens without persisting them (settings screen). */
  previewTokens: (tokens: Record<string, string> | null) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

function toCache(branding: Branding): CachedBranding {
  return {
    companyId: branding.company_id,
    companySlug: branding.company_slug,
    tokens: deriveTokens({
      primary: branding.primary_color,
      accent: branding.accent_color,
      sidebar: branding.sidebar_color,
      background: branding.background_color,
      success: branding.success_color,
      radius: branding.radius,
    }),
    logoUrl: assetUrl(branding.logo_url),
    faviconUrl: assetUrl(branding.favicon_url),
    appIconUrl: assetUrl(branding.app_icon_url),
    displayName: branding.display_name,
    tagline: branding.tagline,
  };
}

/** True when the company left everything on the platform default. */
function isPristine(branding: Branding): boolean {
  return (
    !branding.primary_color &&
    !branding.accent_color &&
    !branding.sidebar_color &&
    !branding.background_color &&
    !branding.success_color &&
    !branding.radius
  );
}

function setLinkTag(rel: string, href: string, type?: string) {
  if (typeof document === "undefined") return;
  const selector = `link[rel="${rel}"][data-branding="1"]`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    // Drop the build-time tags for this rel so the browser cannot prefer them.
    document.head
      .querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)
      .forEach((el) => el.parentElement?.removeChild(el));
    link = document.createElement("link");
    link.rel = rel;
    link.dataset.branding = "1";
    document.head.appendChild(link);
  }
  if (type) link.type = type;
  link.href = href;
}

/** Platform assets, restored when a company has none of its own. */
const PLATFORM_FAVICON = "/icons/icon-192x192.png";
const PLATFORM_APPLE_ICON = "/icons/icon-192x192.png";
const PLATFORM_MANIFEST = "/manifest.json";

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const companyId = user?.company_id ?? null;

  // Read once at mount: this runs on every navigation and localStorage is sync.
  const [cached] = useState<CachedBranding | null>(() => readCachedBranding());

  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const cachedSlug = cached?.companySlug ?? null;
  const [assets, setAssets] = useState({
    logoUrl: cached?.logoUrl ?? null,
    faviconUrl: cached?.faviconUrl ?? null,
    appIconUrl: cached?.appIconUrl ?? null,
    displayName: cached?.displayName ?? null,
    tagline: cached?.tagline ?? null,
  });

  const applyBranding = useCallback((next: Branding) => {
    if (isPristine(next)) {
      // Nothing overridden — let globals.css own the palette entirely.
      clearTokens();
    } else {
      applyTokens(deriveTokens({
        primary: next.primary_color,
        accent: next.accent_color,
        sidebar: next.sidebar_color,
        background: next.background_color,
        success: next.success_color,
        radius: next.radius,
      }));
    }

    const cache = toCache(next);
    writeCachedBranding(cache);
    setAssets({
      logoUrl: cache.logoUrl,
      faviconUrl: cache.faviconUrl,
      appIconUrl: cache.appIconUrl,
      displayName: cache.displayName,
      tagline: cache.tagline,
    });
    setBranding(next);
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const next = await getMyBranding();
      applyBranding(next);
    } catch {
      // Backend down or session just expired: the cached tokens are already
      // painted and globals.css is a valid fallback. Never block the UI.
    } finally {
      setLoading(false);
    }
  }, [applyBranding]);

  // Fetch once the session exists, and again whenever the company changes.
  // Before login there is nothing to ask for: the cached tokens are already
  // painted, and requesting /branding/me would be a guaranteed 401.
  useEffect(() => {
    if (authLoading) return;
    if (!companyId) {
      setLoading(false);
      return;
    }
    refreshBranding();
  }, [authLoading, companyId, refreshBranding]);

  // Favicon, apple-touch-icon and the PWA manifest follow the company.
  // Each is always set — falling back to the platform asset — so switching to a
  // company without its own icons never leaves the previous brand behind.
  useEffect(() => {
    const slug = branding?.company_slug ?? cachedSlug;

    setLinkTag("icon", assets.faviconUrl ?? PLATFORM_FAVICON);
    setLinkTag("apple-touch-icon", assets.appIconUrl ?? PLATFORM_APPLE_ICON);
    setLinkTag(
      "manifest",
      slug ? `/api/manifest?c=${encodeURIComponent(slug)}` : PLATFORM_MANIFEST
    );
  }, [assets.faviconUrl, assets.appIconUrl, branding?.company_slug, cachedSlug]);

  const previewTokens = useCallback((tokens: Record<string, string> | null) => {
    if (tokens) {
      applyTokens(tokens);
      return;
    }
    if (branding && !isPristine(branding)) {
      applyTokens(deriveTokens({
        primary: branding.primary_color,
        accent: branding.accent_color,
        sidebar: branding.sidebar_color,
        background: branding.background_color,
        success: branding.success_color,
        radius: branding.radius,
      }));
    } else {
      clearTokens();
    }
  }, [branding]);

  const value = useMemo<BrandingContextType>(
    () => ({
      branding,
      loading,
      displayName: assets.displayName || PLATFORM_NAME,
      tagline: assets.tagline ?? null,
      logoUrl: assets.logoUrl,
      faviconUrl: assets.faviconUrl,
      appIconUrl: assets.appIconUrl,
      refreshBranding,
      previewTokens,
    }),
    [branding, loading, assets, refreshBranding, previewTokens]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
