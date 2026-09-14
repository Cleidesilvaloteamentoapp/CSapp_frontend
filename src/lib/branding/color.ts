/**
 * Minimal colour maths for branding derivation.
 *
 * Deliberately dependency-free: the whole point of the branding system is that
 * it costs nothing to maintain, and a colour library would be a new dependency
 * to keep current for ~100 lines of arithmetic.
 *
 * Everything works on `#RRGGBB` strings, which is what the design tokens in
 * `globals.css` already use.
 */

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Parse `#RGB` or `#RRGGBB`. Returns black for anything unparseable. */
export function hexToRgb(hex: string): Rgb {
  const raw = (hex || "").trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const part = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/** True when `hex` is a valid `#RGB` / `#RRGGBB` string. */
export function isHex(hex: string | null | undefined): hex is string {
  return typeof hex === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/** Blend `amount` (0..1) of `b` into `a`. */
export function mix(a: string, b: string, amount: number): string {
  const t = clamp(amount, 0, 1);
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return {
    r: channel(hn + 1 / 3) * 255,
    g: channel(hn) * 255,
    b: channel(hn - 1 / 3) * 255,
  };
}

/** Shift lightness by `delta` (-1..1). */
export function adjustLightness(hex: string, delta: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, l: clamp(hsl.l + delta, 0, 1) }));
}

/** Rotate hue by `deg`, keeping saturation and lightness. */
export function rotateHue(hex: string, deg: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, h: hsl.h + deg }));
}

/** WCAG relative luminance. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colours (1..21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isLight(hex: string): boolean {
  return relativeLuminance(hex) > 0.45;
}

/**
 * Pick the foreground that reads best on `bg`.
 *
 * This is what keeps a company from making its own UI illegible: whatever
 * colour the admin picks for a surface, the text on it is chosen by contrast,
 * never configured by hand.
 */
export function readableOn(bg: string, dark = "#16202B", light = "#FFFFFF"): string {
  return contrastRatio(bg, dark) >= contrastRatio(bg, light) ? dark : light;
}

/**
 * Nudge `fg` lightness until it reaches `target` contrast against `bg`.
 * Falls back to the plain readable colour when the target is unreachable.
 */
export function ensureContrast(fg: string, bg: string, target: number): string {
  if (contrastRatio(fg, bg) >= target) return fg;
  const goDarker = isLight(bg);
  let current = fg;
  for (let i = 0; i < 50; i += 1) {
    current = adjustLightness(current, goDarker ? -0.02 : 0.02);
    if (contrastRatio(current, bg) >= target) return current;
  }
  return readableOn(bg);
}
