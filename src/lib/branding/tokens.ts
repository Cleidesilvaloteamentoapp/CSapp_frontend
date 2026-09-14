/**
 * Derives the full design-token set from a handful of brand seeds.
 *
 * This is the contract that keeps branding cheap to maintain: a company
 * configures five colours, and every token consumed by Tailwind
 * (`bg-primary`, `text-sidebar-foreground`, `border-border`, ...) is computed
 * from them. A new component written against those utilities is branded with
 * no extra work and nothing new to configure.
 *
 * Token names match `globals.css` exactly, so the stylesheet stays the
 * platform default and the derived values are a runtime override on top.
 */

import {
  ensureContrast,
  isHex,
  isLight,
  mix,
  readableOn,
  rotateHue,
} from "./color";

export type BrandSeeds = {
  primary: string;
  accent: string;
  sidebar: string;
  background: string;
  success: string;
  radius: string;
};

/**
 * The platform's fixed identity, mirroring `:root` in `globals.css`.
 * Used whenever a company has not overridden a given seed.
 */
export const PLATFORM_SEEDS: BrandSeeds = {
  primary: "#2C3E50",
  accent: "#D5BDA7",
  sidebar: "#2C3E50",
  background: "#F8F9FA",
  success: "#27AE60",
  radius: "0.625rem",
};

/** Only these CSS variables are ever written at runtime. */
export const MANAGED_TOKENS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--success",
  "--success-foreground",
  "--border",
  "--input",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--radius",
] as const;

export type TokenMap = Record<string, string>;

const RADIUS_PATTERN = /^\d+(\.\d+)?(rem|px|em)?$/;

/** Merge partial seeds over the platform defaults, ignoring invalid values. */
export function resolveSeeds(partial?: Partial<Record<keyof BrandSeeds, string | null>>): BrandSeeds {
  const seeds = { ...PLATFORM_SEEDS };
  if (!partial) return seeds;

  (["primary", "accent", "sidebar", "background", "success"] as const).forEach((key) => {
    const value = partial[key];
    if (isHex(value)) seeds[key] = value.trim().toUpperCase();
  });

  const radius = partial.radius;
  if (typeof radius === "string" && RADIUS_PATTERN.test(radius.trim())) {
    seeds.radius = radius.trim();
  }

  return seeds;
}

/**
 * Compute every managed token from the seeds.
 *
 * Pure and synchronous, which is what lets the settings screen render a live
 * preview without a round-trip to the API.
 *
 * `--destructive` and `--warning` are intentionally absent: they signal state,
 * not brand, and stay fixed in `globals.css` so "error" always reads as error.
 */
export function deriveTokens(input?: Partial<Record<keyof BrandSeeds, string | null>>): TokenMap {
  const { primary, accent, sidebar, background, success, radius } = resolveSeeds(input);

  const lightSurface = isLight(background);

  // Text picks up a hint of the brand hue, but contrast wins: ensureContrast
  // pushes it back until it clears WCAG AAA against the chosen background.
  const foreground = ensureContrast(mix(readableOn(background), primary, 0.3), background, 7);

  const card = lightSurface ? "#FFFFFF" : mix(background, foreground, 0.06);
  const secondary = mix(background, foreground, 0.06);
  const mutedForeground = ensureContrast(mix(foreground, background, 0.45), background, 4.5);
  const border = mix(background, foreground, 0.12);

  const sidebarForeground = readableOn(sidebar);
  const sidebarAccent = mix(sidebar, sidebarForeground, 0.1);

  return {
    "--background": background,
    "--foreground": foreground,

    "--card": card,
    "--card-foreground": foreground,
    "--popover": card,
    "--popover-foreground": foreground,

    "--primary": primary,
    "--primary-foreground": readableOn(primary),

    "--secondary": secondary,
    "--secondary-foreground": foreground,

    "--muted": secondary,
    "--muted-foreground": mutedForeground,

    "--accent": accent,
    "--accent-foreground": readableOn(accent),

    "--success": success,
    "--success-foreground": readableOn(success),

    "--border": border,
    "--input": border,
    "--ring": accent,

    "--chart-1": primary,
    "--chart-2": accent,
    "--chart-3": success,
    "--chart-4": mutedForeground,
    "--chart-5": rotateHue(accent, -35),

    "--sidebar": sidebar,
    "--sidebar-foreground": sidebarForeground,
    "--sidebar-primary": accent,
    "--sidebar-primary-foreground": readableOn(accent),
    "--sidebar-accent": sidebarAccent,
    "--sidebar-accent-foreground": sidebarForeground,
    "--sidebar-border": sidebarAccent,
    "--sidebar-ring": accent,

    "--radius": radius,
  };
}

/** Write a token map onto an element (defaults to `<html>`). */
export function applyTokens(tokens: TokenMap, target?: HTMLElement): void {
  const el = target ?? (typeof document !== "undefined" ? document.documentElement : null);
  if (!el) return;
  Object.entries(tokens).forEach(([name, value]) => {
    el.style.setProperty(name, value);
  });
}

/** Remove every managed token, restoring the platform defaults from CSS. */
export function clearTokens(target?: HTMLElement): void {
  const el = target ?? (typeof document !== "undefined" ? document.documentElement : null);
  if (!el) return;
  MANAGED_TOKENS.forEach((name) => el.style.removeProperty(name));
}
