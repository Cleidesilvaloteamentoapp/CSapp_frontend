"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, MapPin, Pencil, Loader2, Home, Building, Store, Trees, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatsCardsSkeleton } from "@/components/shared/loading-skeleton";
import { PropertyTypeQuiz } from "@/components/shared/property-type-quiz";
import { PropertyForm } from "@/components/shared/property-form";
import { api, ApiError } from "@/lib/api";
import { developmentCreateSchema, type DevelopmentCreateFormData } from "@/lib/validators";
import { formatDate, formatCurrency, formatArea } from "@/lib/format";
import type { DevelopmentResponse, PropertyType, PaginatedResponse, LotResponse } from "@/types";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS } from "@/types";

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
        api.get<PaginatedResponse<LotResponse>>("/admin/lots?per_page=100").catch(() => null)
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
    form.reset({ 
      name: "", 
      description: "", 
      location: "",
      property_type: type,
    });
  }

  async function onSubmit(data: DevelopmentCreateFormData) {
    try {
      if (editing) {
        await api.put(`/admin/developments/${editing.id}`, data);
        toast.success("Imóvel atualizado");
      } else {
        await api.post("/admin/developments", data);
        toast.success("Imóvel criado");
      }
      setFormOpen(false);
      setEditing(null);
      setSelectedType(null);
      loadData();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao salvar");
      }
    }
  }

  function filteredDevelopments() {
    if (propertyFilter === "all") return developments;
    return developments.filter(dev => dev.property_type === propertyFilter);
  }

  function getLegacyLots() {
    if (!lots) return [];
    return lots.items.filter(lot => 
      !developments.some(dev => 
        dev.property_type === "LOT" && 
        dev.lot_number === lot.lot_number && 
        dev.block === lot.block
      )
    );
  }

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
                  {propertyFilter === "all" ? "Nenhum imóvel cadastrado" : `Nenhum imóvel do tipo ${PROPERTY_TYPE_LABELS[propertyFilter as PropertyType]}`}
                </p>
                <Button onClick={() => openForm()}>
                  <Plus className="mr-2 h-4 w-4" /> Cadastrar primeiro imóvel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDevelopments().map((dev) => (
                <Card key={dev.id} className="group hover:shadow-md transition-shadow">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openForm(dev)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dev.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{dev.description}</p>
                    )}
                    
                    {/* Informações específicas por tipo */}
                    <div className="space-y-2 text-sm">
                      {dev.property_type === "LOT" && (
                        <>
                          {dev.lot_number && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Lote:</span>
                              <span className="font-medium">{dev.lot_number}</span>
                            </div>
                          )}
                          {dev.block && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Quadra:</span>
                              <span className="font-medium">{dev.block}</span>
                            </div>
                          )}
                          {dev.area_m2 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Área:</span>
                              <span className="font-medium">{formatArea(parseFloat(dev.area_m2))}</span>
                            </div>
                          )}
                        </>
                      )}
                      {(dev.property_type === "HOUSE" || dev.property_type === "APARTMENT") && (
                        <>
                          {dev.bedrooms && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Dormitórios:</span>
                              <span className="font-medium">{dev.bedrooms}</span>
                            </div>
                          )}
                          {dev.bathrooms && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Banheiros:</span>
                              <span className="font-medium">{dev.bathrooms}</span>
                            </div>
                          )}
                          {dev.construction_area_m2 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Área Construída:</span>
                              <span className="font-medium">{formatArea(parseFloat(dev.construction_area_m2))}</span>
                            </div>
                          )}
                        </>
                      )}
                      {dev.price && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium text-green-600">{formatCurrency(parseFloat(dev.price))}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                      Criado em {formatDate(dev.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
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
                  <Card key={lot.id} className="border-orange-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{PROPERTY_TYPE_ICONS.LOT}</span>
                        <div>
                          <CardTitle className="text-lg">Lote {lot.lot_number}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            Legado
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quadra:</span>
                          <span className="font-medium">{lot.block || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Área:</span>
                          <span className="font-medium">{formatArea(parseFloat(lot.area_m2))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium text-green-600">{formatCurrency(parseFloat(lot.price))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={lot.status === "AVAILABLE" ? "default" : lot.status === "SOLD" ? "secondary" : "outline"}>
                            {lot.status === "AVAILABLE" ? "Disponível" : lot.status === "SOLD" ? "Vendido" : "Reservado"}
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

      {/* Property Type Quiz Modal */}
      <PropertyTypeQuiz
        isOpen={quizOpen}
        onComplete={handleTypeSelect}
        onCancel={() => setQuizOpen(false)}
      />

      {/* Property Form Modal */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open);
        if (!open) {
          setEditing(null);
          setSelectedType(null);
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
