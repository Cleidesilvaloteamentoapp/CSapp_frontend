"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus, MapPin, Pencil, Loader2, Home, Building, Filter,
  ChevronDown, ChevronRight, ImageIcon, Trash2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatsCardsSkeleton } from "@/components/shared/loading-skeleton";
import { PropertyTypeQuiz } from "@/components/shared/property-type-quiz";
import { PropertyForm } from "@/components/shared/property-form";
import { PhotoManager } from "@/components/shared/photo-manager";
import { CurrencyInput } from "@/components/ui/currency-input";
import { api, ApiError } from "@/lib/api";
import { developmentCreateSchema, lotUpdateSchema, type DevelopmentCreateFormData, type LotUpdateFormData } from "@/lib/validators";
import { formatDate, formatCurrency, formatArea } from "@/lib/format";
import type { DevelopmentResponse, PropertyType, PaginatedResponse, LotResponse, Photo } from "@/types";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS } from "@/types";

// ---------------------------------------------------------------------------
// Lot edit dialog — full isolated edit (data + photos)
// ---------------------------------------------------------------------------
function LotEditDialog({
  lot,
  onClose,
  onSaved,
  onDeleted,
}: {
  lot: LotResponse;
  onClose: () => void;
  onSaved: (updated: LotResponse) => void;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>(lot.photos ?? []);

  const form = useForm<LotUpdateFormData>({
    resolver: zodResolver(lotUpdateSchema) as never,
    defaultValues: {
      lot_number: lot.lot_number,
      block: lot.block ?? "",
      area_m2: parseFloat(lot.area_m2),
      price: parseFloat(lot.price),
      status: lot.status,
    },
  });

  async function onSubmit(data: LotUpdateFormData) {
    try {
      const updated = await api.put<LotResponse>(`/admin/lots/${lot.id}`, data);
      toast.success("Lote atualizado");
      onSaved({ ...updated, photos });
    } catch (error) {
      toast.error(error instanceof ApiError && typeof error.detail === "string" ? error.detail : "Erro ao atualizar lote");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/admin/lots/${lot.id}`);
      toast.success("Lote excluído");
      onDeleted();
    } catch (error) {
      toast.error(error instanceof ApiError && typeof error.detail === "string" ? error.detail : "Erro ao excluir lote");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lote {lot.lot_number}{lot.block ? ` · Quadra ${lot.block}` : ""}
            </DialogTitle>
            <DialogDescription>Edite os dados e as fotos deste lote individualmente.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="dados">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="fotos">Fotos</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 pt-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="lot_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do Lote</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="block"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quadra</FormLabel>
                          <FormControl><Input placeholder="—" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="area_m2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área (m²)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput value={field.value as number | undefined} onChange={(v) => field.onChange(v ?? 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="AVAILABLE">Disponível</SelectItem>
                            <SelectItem value="RESERVED">Reservado</SelectItem>
                            <SelectItem value="SOLD">Vendido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                      disabled={lot.status === "SOLD"}
                      title={lot.status === "SOLD" ? "Lotes vendidos não podem ser excluídos" : "Excluir lote"}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir lote
                    </Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Salvar"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="fotos" className="pt-2">
              <p className="mb-3 text-xs text-muted-foreground">
                Fotos individuais do lote. A foto principal aparece no card e no portal do cliente quando marcada como visível.
              </p>
              <PhotoManager
                basePath={`/admin/lots/${lot.id}`}
                photos={photos}
                onChange={setPhotos}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lote?</AlertDialogTitle>
            <AlertDialogDescription>
              O lote <strong>{lot.lot_number}{lot.block ? ` · Quadra ${lot.block}` : ""}</strong> será excluído permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DevelopmentsPage() {
  const [developments, setDevelopments] = useState<DevelopmentResponse[]>([]);
  const [lots, setLots] = useState<PaginatedResponse<LotResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [editing, setEditing] = useState<DevelopmentResponse | null>(null);
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"properties" | "lots">("properties");

  // Child lots state
  const [expandedDevs, setExpandedDevs] = useState<Set<string>>(new Set());
  const [childLotsMap, setChildLotsMap] = useState<Record<string, LotResponse[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());

  // Lot edit dialog
  const [editingLot, setEditingLot] = useState<LotResponse | null>(null);

  // Delete development confirmation
  const [deletingDev, setDeletingDev] = useState<DevelopmentResponse | null>(null);
  const [deletingDevLoading, setDeletingDevLoading] = useState(false);

  const form = useForm<DevelopmentCreateFormData>({
    resolver: zodResolver(developmentCreateSchema) as never,
    defaultValues: {
      name: "",
      description: "",
      location: "",
      property_type: "LOT" as PropertyType,
    },
  });

  async function loadData() {
    try {
      const [devsData, lotsData] = await Promise.all([
        api.get<DevelopmentResponse[]>("/admin/developments/"),
        api.get<PaginatedResponse<LotResponse>>("/admin/lots?per_page=50").catch(() => null),
      ]);
      setDevelopments(devsData);
      setLots(lotsData);
    } catch (error) {
      if (error instanceof ApiError) toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function loadChildLots(devId: string, force = false) {
    if (!force && childLotsMap[devId]) return;
    setLoadingChildren((prev) => new Set(prev).add(devId));
    try {
      const res = await api.get<PaginatedResponse<LotResponse>>(
        `/admin/lots?development_id=${devId}&per_page=50`
      );
      setChildLotsMap((prev) => ({ ...prev, [devId]: res.items }));
    } catch {
      setChildLotsMap((prev) => ({ ...prev, [devId]: [] }));
    } finally {
      setLoadingChildren((prev) => {
        const next = new Set(prev);
        next.delete(devId);
        return next;
      });
    }
  }

  function toggleExpanded(devId: string) {
    setExpandedDevs((prev) => {
      const next = new Set(prev);
      if (next.has(devId)) {
        next.delete(devId);
      } else {
        next.add(devId);
        loadChildLots(devId);
      }
      return next;
    });
  }

  function openForm(dev?: DevelopmentResponse) {
    if (dev) {
      setEditing(dev);
      setSelectedType(dev.property_type);
      form.reset({
        name: dev.name,
        description: dev.description || "",
        location: dev.location || "",
        property_type: dev.property_type,
        block: dev.block || "",
        lot_number: dev.lot_number || "",
        area_m2: dev.area_m2 ? parseFloat(dev.area_m2) : undefined,
        bedrooms: dev.bedrooms || undefined,
        bathrooms: dev.bathrooms || undefined,
        suites: dev.suites || undefined,
        parking_spaces: dev.parking_spaces || undefined,
        construction_area_m2: dev.construction_area_m2 ? parseFloat(dev.construction_area_m2) : undefined,
        total_area_m2: dev.total_area_m2 ? parseFloat(dev.total_area_m2) : undefined,
        price: dev.price ? parseFloat(dev.price) : undefined,
      });
      setFormOpen(true);
    } else {
      setQuizOpen(true);
    }
  }

  function handleTypeSelect(type: PropertyType) {
    setSelectedType(type);
    setQuizOpen(false);
    setFormOpen(true);
    form.reset({ name: "", description: "", location: "", property_type: type });
  }

  async function onSubmit(data: DevelopmentCreateFormData) {
    try {
      if (editing) {
        await api.put(`/admin/developments/${editing.id}`, data);
        toast.success("Imóvel atualizado");
        setFormOpen(false);
        setEditing(null);
        setSelectedType(null);
      } else {
        const created = await api.post<DevelopmentResponse>("/admin/developments", data);
        toast.success("Imóvel criado — adicione as fotos abaixo");
        setEditing(created);
      }
      loadData();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao salvar");
      }
    }
  }

  async function handleDeleteDev() {
    if (!deletingDev) return;
    setDeletingDevLoading(true);
    try {
      await api.delete(`/admin/developments/${deletingDev.id}`);
      toast.success("Empreendimento excluído");
      setDevelopments((prev) => prev.filter((d) => d.id !== deletingDev.id));
    } catch (error) {
      toast.error(
        error instanceof ApiError && typeof error.detail === "string"
          ? error.detail
          : "Erro ao excluir empreendimento"
      );
    } finally {
      setDeletingDevLoading(false);
      setDeletingDev(null);
    }
  }

  function filteredDevelopments() {
    if (propertyFilter === "all") return developments;
    return developments.filter((dev) => dev.property_type === propertyFilter);
  }

  function getLegacyLots() {
    if (!lots) return [];
    return lots.items.filter(
      (lot) =>
        !developments.some(
          (dev) =>
            dev.property_type === "LOT" &&
            dev.lot_number === lot.lot_number &&
            dev.block === lot.block
        )
    );
  }

  const LOT_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
    AVAILABLE: "default",
    SOLD: "secondary",
    RESERVED: "outline",
  };
  const LOT_STATUS_LABEL: Record<string, string> = {
    AVAILABLE: "Disponível",
    SOLD: "Vendido",
    RESERVED: "Reservado",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Imóveis e Empreendimentos" description="Gerencie seus imóveis, lotes e empreendimentos">
        <PermissionGuard permission="manage_lots">
          <Button onClick={() => openForm()}>
            <Plus className="mr-2 h-4 w-4" /> Novo Imóvel
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <Button
          variant={activeTab === "properties" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("properties")}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Imóveis ({developments.length})
        </Button>
        <Button
          variant={activeTab === "lots" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("lots")}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          Lotes Legados ({getLegacyLots().length})
        </Button>
      </div>

      {activeTab === "properties" && (
        <>
          {/* Filter */}
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="LOT">Lotes</SelectItem>
                <SelectItem value="HOUSE">Casas</SelectItem>
                <SelectItem value="APARTMENT">Apartamentos</SelectItem>
                <SelectItem value="COMMERCIAL">Comerciais</SelectItem>
                <SelectItem value="RURAL">Rurais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <StatsCardsSkeleton count={3} />
          ) : filteredDevelopments().length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {propertyFilter === "all"
                    ? "Nenhum imóvel cadastrado"
                    : `Nenhum imóvel do tipo ${PROPERTY_TYPE_LABELS[propertyFilter as PropertyType]}`}
                </p>
                <Button onClick={() => openForm()}>
                  <Plus className="mr-2 h-4 w-4" /> Cadastrar primeiro imóvel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDevelopments().map((dev) => {
                const primaryPhoto = dev.photos?.find((p) => p.is_primary) ?? dev.photos?.[0];
                const expanded = expandedDevs.has(dev.id);
                const children = childLotsMap[dev.id];
                const isLoadingChildren = loadingChildren.has(dev.id);

                return (
                  <Card key={dev.id} className="group hover:shadow-md transition-shadow flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{PROPERTY_TYPE_ICONS[dev.property_type]}</span>
                          <div>
                            <CardTitle className="text-lg">{dev.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {PROPERTY_TYPE_LABELS[dev.property_type]}
                              </Badge>
                              {dev.location && (
                                <CardDescription className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {dev.location}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </div>
                        <PermissionGuard permission="manage_lots">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openForm(dev)}
                              title="Editar empreendimento"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeletingDev(dev)}
                              title="Excluir empreendimento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </PermissionGuard>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                      {/* Foto principal */}
                      {primaryPhoto?.url && (
                        <div className="mb-3 overflow-hidden rounded-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={primaryPhoto.url} alt={dev.name} className="h-32 w-full object-cover" />
                        </div>
                      )}

                      {dev.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{dev.description}</p>
                      )}

                      {/* Specs por tipo */}
                      <div className="space-y-1.5 text-sm mb-3">
                        {dev.property_type === "LOT" && (
                          <>
                            {dev.lot_number && <div className="flex justify-between"><span className="text-muted-foreground">Lote:</span><span className="font-medium">{dev.lot_number}</span></div>}
                            {dev.block && <div className="flex justify-between"><span className="text-muted-foreground">Quadra:</span><span className="font-medium">{dev.block}</span></div>}
                            {dev.area_m2 && <div className="flex justify-between"><span className="text-muted-foreground">Área:</span><span className="font-medium">{formatArea(parseFloat(dev.area_m2))}</span></div>}
                          </>
                        )}
                        {(dev.property_type === "HOUSE" || dev.property_type === "APARTMENT") && (
                          <>
                            {dev.bedrooms && <div className="flex justify-between"><span className="text-muted-foreground">Dormitórios:</span><span className="font-medium">{dev.bedrooms}</span></div>}
                            {dev.bathrooms && <div className="flex justify-between"><span className="text-muted-foreground">Banheiros:</span><span className="font-medium">{dev.bathrooms}</span></div>}
                            {dev.construction_area_m2 && <div className="flex justify-between"><span className="text-muted-foreground">Área Construída:</span><span className="font-medium">{formatArea(parseFloat(dev.construction_area_m2))}</span></div>}
                          </>
                        )}
                        {dev.price && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-medium text-green-600">{formatCurrency(parseFloat(dev.price))}</span>
                          </div>
                        )}
                      </div>

                      {/* Lotes filhos */}
                      <div className="mt-auto pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(dev.id)}
                          className="flex w-full items-center justify-between text-sm font-medium hover:text-primary transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5" />
                            Lotes vinculados
                            {children !== undefined && (
                              <Badge variant="secondary" className="text-xs">{children.length}</Badge>
                            )}
                          </span>
                          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>

                        {expanded && (
                          <div className="mt-2 space-y-1.5">
                            {isLoadingChildren ? (
                              <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando lotes...
                              </div>
                            ) : children && children.length > 0 ? (
                              children.map((lot) => {
                                const lprimary = lot.photos?.find((p) => p.is_primary) ?? lot.photos?.[0];
                                return (
                                  <div
                                    key={lot.id}
                                    className="group/lot flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => setEditingLot(lot)}
                                  >
                                    {lprimary?.url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={lprimary.url} alt={`Lote ${lot.lot_number}`} className="h-9 w-9 shrink-0 rounded object-cover" />
                                    ) : (
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted">
                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium truncate">
                                        Lote {lot.lot_number}{lot.block ? ` · Q ${lot.block}` : ""}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {formatArea(parseFloat(lot.area_m2))} · {formatCurrency(parseFloat(lot.price))}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Badge variant={LOT_STATUS_VARIANT[lot.status] ?? "outline"}>
                                        {LOT_STATUS_LABEL[lot.status] ?? lot.status}
                                      </Badge>
                                      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/lot:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="py-2 text-xs text-muted-foreground">
                                Nenhum lote vinculado a este empreendimento ainda.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        Criado em {formatDate(dev.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "lots" && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Lotes Legados (Sistema Anterior)</h3>
              <p className="text-sm text-muted-foreground">
                Lotes cadastrados no sistema anterior que ainda não foram migrados para o novo formato.
              </p>
            </div>

            {loading ? (
              <StatsCardsSkeleton count={3} />
            ) : getLegacyLots().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">Nenhum lote legado encontrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Todos os lotes já foram migrados para o novo sistema.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {getLegacyLots().map((lot) => (
                  <Card
                    key={lot.id}
                    className="border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setEditingLot(lot)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{PROPERTY_TYPE_ICONS.LOT}</span>
                        <div>
                          <CardTitle className="text-lg">Lote {lot.lot_number}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">Legado</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Quadra:</span><span className="font-medium">{lot.block || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Área:</span><span className="font-medium">{formatArea(parseFloat(lot.area_m2))}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Valor:</span><span className="font-medium text-green-600">{formatCurrency(parseFloat(lot.price))}</span></div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={LOT_STATUS_VARIANT[lot.status] ?? "outline"}>
                            {LOT_STATUS_LABEL[lot.status] ?? lot.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Property Type Quiz */}
      <PropertyTypeQuiz
        isOpen={quizOpen}
        onComplete={handleTypeSelect}
        onCancel={() => setQuizOpen(false)}
      />

      {/* Development create/edit dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open);
        if (!open) {
          setEditing(null);
          setSelectedType(null);
          loadData();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Imóvel" : selectedType ? `Novo ${PROPERTY_TYPE_LABELS[selectedType]}` : "Novo Imóvel"}
            </DialogTitle>
            <DialogDescription>
              {editing ? "Atualize os dados do imóvel" : "Preencha as informações do novo imóvel"}
            </DialogDescription>
          </DialogHeader>

          {selectedType && (
            <PropertyForm
              propertyType={selectedType}
              onSubmit={onSubmit}
              onCancel={() => {
                setFormOpen(false);
                setEditing(null);
                setSelectedType(null);
              }}
              isSubmitting={form.formState.isSubmitting}
              initialData={editing ? {
                name: editing.name,
                description: editing.description || undefined,
                location: editing.location || undefined,
                property_type: editing.property_type,
                block: editing.block || undefined,
                lot_number: editing.lot_number || undefined,
                area_m2: editing.area_m2 ? parseFloat(editing.area_m2) : undefined,
                bedrooms: editing.bedrooms || undefined,
                bathrooms: editing.bathrooms || undefined,
                suites: editing.suites || undefined,
                parking_spaces: editing.parking_spaces || undefined,
                construction_area_m2: editing.construction_area_m2 ? parseFloat(editing.construction_area_m2) : undefined,
                total_area_m2: editing.total_area_m2 ? parseFloat(editing.total_area_m2) : undefined,
                price: editing.price ? parseFloat(editing.price) : undefined,
              } : undefined}
            />
          )}

          {/* Fotos do empreendimento */}
          <div className="mt-2 border-t pt-4">
            <h4 className="mb-1 text-sm font-medium">Fotos do imóvel</h4>
            {editing ? (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  Defina a foto principal e escolha quais aparecem para o cliente no portal.
                </p>
                <PhotoManager
                  basePath={`/admin/developments/${editing.id}`}
                  photos={editing.photos ?? []}
                  onChange={(photos) => setEditing((prev) => (prev ? { ...prev, photos } : prev))}
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Salve o imóvel primeiro para adicionar fotos.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lot edit dialog */}
      {editingLot && (
        <LotEditDialog
          lot={editingLot}
          onClose={() => setEditingLot(null)}
          onSaved={(updated) => {
            setChildLotsMap((prev) => ({
              ...prev,
              [updated.development_id]: (prev[updated.development_id] ?? []).map((l) =>
                l.id === updated.id ? updated : l
              ),
            }));
            setEditingLot(null);
          }}
          onDeleted={() => {
            const devId = editingLot.development_id;
            setChildLotsMap((prev) => ({
              ...prev,
              [devId]: (prev[devId] ?? []).filter((l) => l.id !== editingLot.id),
            }));
            setEditingLot(null);
          }}
        />
      )}

      {/* Delete development confirmation */}
      <AlertDialog open={!!deletingDev} onOpenChange={(open) => { if (!open) setDeletingDev(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir empreendimento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingDev?.name}</strong> e todos os seus lotes (sem contrato ativo) serão excluídos permanentemente.
              Lotes com contratos ativos bloqueiam a exclusão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingDevLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteDev}
              disabled={deletingDevLoading}
            >
              {deletingDevLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
