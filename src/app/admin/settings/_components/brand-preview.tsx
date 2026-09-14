"use client";

/**
 * Live preview of a derived palette.
 *
 * The token map is applied to this wrapper only, so the surrounding admin UI
 * keeps its current colours while the admin experiments. Because derivation is
 * pure and synchronous, this updates on every keystroke with no request.
 */

import { Bell, CheckCircle2, Home, Users, Wallet } from "lucide-react";

import type { TokenMap } from "@/lib/branding/tokens";

interface BrandPreviewProps {
  tokens: TokenMap;
  displayName: string;
  tagline: string | null;
  logoUrl: string | null;
}

const NAV = [
  { label: "Dashboard", icon: Home, active: true },
  { label: "Clientes", icon: Users, active: false },
  { label: "Financeiro", icon: Wallet, active: false },
];

export function BrandPreview({ tokens, displayName, tagline, logoUrl }: BrandPreviewProps) {
  return (
    <div
      style={tokens as React.CSSProperties}
      className="overflow-hidden rounded-xl border border-border"
    >
      <div className="flex min-h-[320px] bg-background text-foreground">
        {/* Sidebar */}
        <aside className="flex w-40 shrink-0 flex-col gap-3 bg-sidebar p-3">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-md object-contain" />
            ) : (
              <div className="h-7 w-7 shrink-0 rounded-md bg-sidebar-primary" />
            )}
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-sidebar-foreground">
                {displayName}
              </p>
              {tagline && (
                <p className="truncate text-[9px] text-sidebar-foreground/60">{tagline}</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {NAV.map(({ label, icon: Icon }, i) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                  i === 0
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Painel</p>
              <p className="text-[11px] text-muted-foreground">Visão geral do mês</p>
            </div>
            <div className="relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[7px] font-bold text-white">
                3
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-3 text-card-foreground">
            <p className="text-[10px] text-muted-foreground">Recebido no mês</p>
            <p className="text-lg font-bold">R$ 128.400</p>
            <div className="mt-2 flex items-center gap-1 text-[10px]" style={{ color: tokens["--success"] }}>
              <CheckCircle2 className="h-3 w-3" />
              12% acima da meta
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground"
            >
              Ação principal
            </button>
            <button
              type="button"
              className="rounded-md bg-secondary px-3 py-1.5 text-[11px] font-medium text-secondary-foreground"
            >
              Secundária
            </button>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
              Destaque
            </span>
          </div>

          <div className="flex items-end gap-1.5 pt-1">
            {["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"].map((token, i) => (
              <div
                key={token}
                className="flex-1 rounded-sm"
                style={{ background: tokens[token], height: `${16 + i * 7}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
