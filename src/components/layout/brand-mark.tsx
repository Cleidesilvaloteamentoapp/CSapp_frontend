"use client";

/**
 * The single place the product's identity is drawn.
 *
 * Before this component the "CSApp" lockup was copy-pasted across the three
 * sidebars, the login screen, the offline page and three mobile headers. Now a
 * company's logo and wording land everywhere by changing one file.
 */

import { Building2 } from "lucide-react";

import { useBranding } from "@/contexts/branding-context";
import { cn } from "@/lib/utils";

type Variant = "sidebar" | "login" | "mobile";

interface BrandMarkProps {
  variant?: Variant;
  /**
   * Tagline for this surface ("Loteamentos", "Portal do Cliente", ...).
   * A company-configured tagline takes precedence over it.
   */
  fallbackTagline?: string;
  /** Hide the text stack (collapsed sidebar handles this with CSS instead). */
  markOnly?: boolean;
  className?: string;
}

const MARK_SIZE: Record<Variant, string> = {
  sidebar: "h-9 w-9 rounded-lg",
  login: "h-14 w-14 rounded-xl",
  mobile: "h-7 w-7 rounded-md",
};

const ICON_SIZE: Record<Variant, string> = {
  sidebar: "h-5 w-5",
  login: "h-7 w-7",
  mobile: "h-4 w-4",
};

export function BrandMark({
  variant = "sidebar",
  fallbackTagline,
  markOnly = false,
  className,
}: BrandMarkProps) {
  const { logoUrl, appIconUrl, displayName, tagline } = useBranding();

  const onSidebar = variant === "sidebar";
  const shownTagline = tagline || fallbackTagline || null;
  // The square mark uses the app icon; the wide logo is reserved for the login
  // screen, where there is room for it.
  const markSrc = variant === "login" ? logoUrl || appIconUrl : appIconUrl || logoUrl;

  const mark = markSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={markSrc}
      alt={displayName}
      className={cn(MARK_SIZE[variant], "shrink-0 object-contain", className)}
    />
  ) : (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        MARK_SIZE[variant],
        onSidebar ? "bg-sidebar-primary" : "bg-primary",
        className
      )}
    >
      <Building2
        className={cn(
          ICON_SIZE[variant],
          onSidebar ? "text-sidebar-primary-foreground" : "text-primary-foreground"
        )}
      />
    </div>
  );

  if (markOnly) return mark;

  if (variant === "login") {
    return (
      <div className="flex flex-col items-center space-y-2">
        {mark}
        <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
        {shownTagline && <p className="text-sm text-muted-foreground">{shownTagline}</p>}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <span className="flex items-center gap-2">
        {mark}
        <span className="text-sm font-semibold">
          {shownTagline ? `${displayName} — ${shownTagline}` : displayName}
        </span>
      </span>
    );
  }

  return (
    <>
      {mark}
      <div className="flex flex-col group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
          {displayName}
        </span>
        {shownTagline && (
          <span className="text-[11px] text-sidebar-foreground/60">{shownTagline}</span>
        )}
      </div>
    </>
  );
}
