/**
 * Per-company PWA manifest.
 *
 * `public/manifest.json` stays the platform default; this route serves the
 * branded variant for `?c=<company-slug>`. The provider swaps the
 * `<link rel="manifest">` href once the company is known.
 */

import { NextRequest, NextResponse } from "next/server";

import { PLATFORM_SEEDS, resolveSeeds } from "@/lib/branding/tokens";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const PLATFORM_MANIFEST = {
  name: "CSApp — Gestão de Loteamentos",
  short_name: "CSApp",
  description:
    "Sistema completo de gestão imobiliária com foco em loteamentos, clientes, financeiro e serviços",
  theme_color: PLATFORM_SEEDS.primary,
  background_color: PLATFORM_SEEDS.background,
  icons: [
    { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "/icons/icon-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

type PublicBranding = {
  company_slug: string;
  primary_color: string | null;
  background_color: string | null;
  app_icon_url: string | null;
  display_name: string | null;
  tagline: string | null;
};

function buildManifest(branding: PublicBranding | null) {
  const base = {
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    scope: "/",
    categories: ["business", "productivity", "finance"],
    lang: "pt-BR",
    dir: "ltr",
  };

  if (!branding) {
    return { ...PLATFORM_MANIFEST, ...base };
  }

  const seeds = resolveSeeds({
    primary: branding.primary_color,
    background: branding.background_color,
  });
  const name = branding.display_name || PLATFORM_MANIFEST.short_name;

  // A single uploaded 512x512 PNG covers both sizes: browsers scale it down,
  // and that keeps image processing out of the backend entirely.
  const icons = branding.app_icon_url
    ? [
        { src: `/api/proxy${branding.app_icon_url}`, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: `/api/proxy${branding.app_icon_url}`, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: `/api/proxy${branding.app_icon_url}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ]
    : PLATFORM_MANIFEST.icons;

  return {
    ...base,
    name: branding.tagline ? `${name} — ${branding.tagline}` : name,
    short_name: name,
    description: PLATFORM_MANIFEST.description,
    theme_color: seeds.primary,
    background_color: seeds.background,
    icons,
  };
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("c");

  let branding: PublicBranding | null = null;
  if (slug) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/branding/public/${encodeURIComponent(slug)}`,
        { cache: "no-store" }
      );
      if (response.ok) branding = (await response.json()) as PublicBranding;
    } catch {
      // Fall through to the platform manifest — an install prompt must never
      // fail because branding is unreachable.
    }
  }

  return NextResponse.json(buildManifest(branding), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
