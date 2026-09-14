"use client";

/**
 * Company visual identity.
 *
 * The admin configures five seed colours, a radius, three assets and two
 * wording overrides — everything else in the design system is derived from
 * those, so this screen never grows a field per component.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Palette, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useBranding } from "@/contexts/branding-context";
import { ApiError, api } from "@/lib/api";
import { deriveTokens, PLATFORM_SEEDS, resolveSeeds } from "@/lib/branding/tokens";
import { isHex } from "@/lib/branding/color";
import {
  assetUrl,
  deleteBrandingAsset,
  getCompanyBranding,
  getMyBranding,
  updateCompanyBranding,
  updateMyBranding,
  uploadBrandingAsset,
  type Branding,
  type BrandingAssetKind,
  type BrandingPayload,
} from "@/services/branding";
import { BrandPreview } from "./_components/brand-preview";

type ColorKey = "primary_color" | "accent_color" | "sidebar_color" | "background_color" | "success_color";

const COLOR_FIELDS: { key: ColorKey; label: string; help: string; seed: keyof typeof PLATFORM_SEEDS }[] = [
  { key: "primary_color", label: "Cor primária", help: "Botões, links e o primeiro tom dos gráficos", seed: "primary" },
  { key: "accent_color", label: "Cor de destaque", help: "Realces, foco de teclado e a marca na sidebar", seed: "accent" },
  { key: "sidebar_color", label: "Sidebar", help: "Fundo do menu lateral", seed: "sidebar" },
  { key: "background_color", label: "Fundo", help: "Fundo geral das telas", seed: "background" },
  { key: "success_color", label: "Sucesso", help: "Confirmações e valores positivos", seed: "success" },
];

const RADIUS_OPTIONS = [
  { value: "0", label: "Reto" },
  { value: "0.25rem", label: "Levemente arredondado" },
  { value: "0.625rem", label: "Padrão" },
  { value: "1rem", label: "Bem arredondado" },
];

const ASSETS: { kind: BrandingAssetKind; label: string; help: string; accept: string }[] = [
  { kind: "logo", label: "Logo", help: "Exibida na tela de login. PNG, JPG ou WebP, até 2 MB.", accept: "image/png,image/jpeg,image/webp" },
  { kind: "app_icon", label: "Ícone do aplicativo", help: "Marca quadrada usada no menu e no app instalado. PNG 512×512.", accept: "image/png" },
  { kind: "favicon", label: "Favicon", help: "Ícone da aba do navegador. PNG ou ICO.", accept: "image/png,image/x-icon,.ico" },
];

type FormState = {
  primary_color: string;
  accent_color: string;
  sidebar_color: string;
  background_color: string;
  success_color: string;
  radius: string;
  display_name: string;
  tagline: string;
};

function toForm(b: Branding | null): FormState {
  return {
    primary_color: b?.primary_color || PLATFORM_SEEDS.primary,
    accent_color: b?.accent_color || PLATFORM_SEEDS.accent,
    sidebar_color: b?.sidebar_color || PLATFORM_SEEDS.sidebar,
    background_color: b?.background_color || PLATFORM_SEEDS.background,
    success_color: b?.success_color || PLATFORM_SEEDS.success,
    radius: b?.radius || PLATFORM_SEEDS.radius,
    display_name: b?.display_name || "",
    tagline: b?.tagline || "",
  };
}

interface CompanyOption { id: string; name: string }

export default function BrandingSettingsPage() {
  const { isSuperAdmin, isCompanyAdmin, loading: authLoading } = useAuth();
  const { refreshBranding } = useBranding();

  const [branding, setBranding] = useState<Branding | null>(null);
  const [form, setForm] = useState<FormState>(() => toForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<BrandingAssetKind | null>(null);

  // Super admins can brand any company; everyone else edits their own.
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [targetCompany, setTargetCompany] = useState<string>("");

  const canEdit = isSuperAdmin || isCompanyAdmin;
  const editingOther = Boolean(targetCompany);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = targetCompany
        ? await getCompanyBranding(targetCompany)
        : await getMyBranding();
      setBranding(data);
      setForm(toForm(data));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível carregar a identidade visual");
    } finally {
      setLoading(false);
    }
  }, [targetCompany]);

  useEffect(() => {
    if (!authLoading && canEdit) load();
  }, [authLoading, canEdit, load]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    api
      .get<{ items: CompanyOption[] }>("/companies?per_page=50")
      .then((res) => setCompanies(res.items || []))
      .catch(() => setCompanies([]));
  }, [isSuperAdmin]);

  const tokens = useMemo(
    () =>
      deriveTokens({
        primary: form.primary_color,
        accent: form.accent_color,
        sidebar: form.sidebar_color,
        background: form.background_color,
        success: form.success_color,
        radius: form.radius,
      }),
    [form]
  );

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    const invalid = COLOR_FIELDS.find((f) => !isHex(form[f.key]));
    if (invalid) {
      toast.error(`${invalid.label}: informe uma cor no formato #RRGGBB`);
      return;
    }

    const payload: BrandingPayload = {
      primary_color: form.primary_color.toUpperCase(),
      accent_color: form.accent_color.toUpperCase(),
      sidebar_color: form.sidebar_color.toUpperCase(),
      background_color: form.background_color.toUpperCase(),
      success_color: form.success_color.toUpperCase(),
      radius: form.radius,
      display_name: form.display_name.trim() || null,
      tagline: form.tagline.trim() || null,
    };

    setSaving(true);
    try {
      const saved = editingOther
        ? await updateCompanyBranding(targetCompany, payload)
        : await updateMyBranding(payload);
      setBranding(saved);
      setForm(toForm(saved));
      if (!editingOther) await refreshBranding();
      toast.success("Identidade visual salva");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    const cleared: BrandingPayload = {
      primary_color: null, accent_color: null, sidebar_color: null,
      background_color: null, success_color: null, radius: null,
      display_name: null, tagline: null,
    };
    setSaving(true);
    try {
      const saved = editingOther
        ? await updateCompanyBranding(targetCompany, cleared)
        : await updateMyBranding(cleared);
      setBranding(saved);
      setForm(toForm(saved));
      if (!editingOther) await refreshBranding();
      toast.success("Restaurado para o padrão da plataforma");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível restaurar");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(kind: BrandingAssetKind, file: File) {
    setUploading(kind);
    try {
      const saved = await uploadBrandingAsset(kind, file);
      setBranding(saved);
      await refreshBranding();
      toast.success("Arquivo enviado");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível enviar o arquivo");
    } finally {
      setUploading(null);
    }
  }

  async function handleRemoveAsset(kind: BrandingAssetKind) {
    setUploading(kind);
    try {
      const saved = await deleteBrandingAsset(kind);
      setBranding(saved);
      await refreshBranding();
      toast.success("Arquivo removido");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível remover o arquivo");
    } finally {
      setUploading(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="Identidade visual" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Apenas administradores da empresa podem alterar a identidade visual.
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSeeds = resolveSeeds({
    primary: form.primary_color, accent: form.accent_color, sidebar: form.sidebar_color,
    background: form.background_color, success: form.success_color, radius: form.radius,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Identidade visual"
        description="Defina as cores e a marca da sua empresa. O restante do sistema se ajusta automaticamente."
      >
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar padrão
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </PageHeader>

      {isSuperAdmin && companies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Empresa</CardTitle>
            <CardDescription>
              Como super admin você pode configurar a identidade de qualquer empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={targetCompany || "__self__"}
              onValueChange={(v) => setTargetCompany(v === "__self__" ? "" : v)}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__self__">Minha empresa</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4" />
                Cores
              </CardTitle>
              <CardDescription>
                Cinco cores definem todo o sistema. Textos, bordas e tons secundários são
                calculados a partir delas, sempre com contraste legível.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {COLOR_FIELDS.map((field) => {
                const value = form[field.key];
                const valid = isHex(value);
                return (
                  <div key={field.key} className="flex items-center gap-3">
                    <input
                      type="color"
                      aria-label={field.label}
                      value={valid ? value : PLATFORM_SEEDS[field.seed]}
                      onChange={(e) => set(field.key, e.target.value.toUpperCase())}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
                    />
                    <div className="min-w-0 flex-1">
                      <Label className="text-sm">{field.label}</Label>
                      <p className="text-xs text-muted-foreground">{field.help}</p>
                    </div>
                    <Input
                      value={value}
                      onChange={(e) => set(field.key, e.target.value.toUpperCase())}
                      className={`w-32 font-mono text-xs ${valid ? "" : "border-destructive"}`}
                      placeholder="#000000"
                    />
                  </div>
                );
              })}

              <div className="flex items-center gap-3 border-t border-border pt-4">
                <div className="min-w-0 flex-1">
                  <Label className="text-sm">Arredondamento</Label>
                  <p className="text-xs text-muted-foreground">Cantos de botões, cards e campos</p>
                </div>
                <Select value={form.radius} onValueChange={(v) => set("radius", v)}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RADIUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nome</CardTitle>
              <CardDescription>Substitui &quot;CSApp&quot; em todo o sistema.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="display_name">Nome exibido</Label>
                <Input
                  id="display_name"
                  value={form.display_name}
                  maxLength={60}
                  placeholder="CSApp"
                  onChange={(e) => set("display_name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tagline">Descrição curta</Label>
                <Input
                  id="tagline"
                  value={form.tagline}
                  maxLength={80}
                  placeholder="Loteamentos"
                  onChange={(e) => set("tagline", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Arquivos</CardTitle>
              <CardDescription>
                {editingOther
                  ? "O envio de arquivos só está disponível para a própria empresa."
                  : "Enviados imediatamente ao selecionar."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ASSETS.map((asset) => {
                const url = assetUrl(
                  asset.kind === "logo" ? branding?.logo_url
                    : asset.kind === "favicon" ? branding?.favicon_url
                    : branding?.app_icon_url
                );
                const busy = uploading === asset.kind;
                return (
                  <div key={asset.kind} className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={asset.label} className="h-full w-full object-contain" />
                      ) : (
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-sm">{asset.label}</Label>
                      <p className="text-xs text-muted-foreground">{asset.help}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={busy || editingOther}
                          onClick={() => handleRemoveAsset(asset.kind)}
                          aria-label={`Remover ${asset.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" disabled={busy || editingOther} asChild={!busy && !editingOther}>
                        {busy || editingOther ? (
                          <span>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}</span>
                        ) : (
                          <label className="cursor-pointer">
                            Enviar
                            <input
                              type="file"
                              accept={asset.accept}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (file) handleUpload(asset.kind, file);
                              }}
                            />
                          </label>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pré-visualização</CardTitle>
              <CardDescription>Atualiza enquanto você escolhe as cores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <BrandPreview
                tokens={tokens}
                displayName={form.display_name || "CSApp"}
                tagline={form.tagline || null}
                logoUrl={assetUrl(branding?.app_icon_url || branding?.logo_url)}
              />
              <p className="text-xs text-muted-foreground">
                Cores de erro e alerta são fixas da plataforma para que avisos críticos
                sejam sempre reconhecíveis.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(currentSeeds)
                  .filter(([k]) => k !== "radius")
                  .map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: value }} />
                      {value}
                    </span>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
