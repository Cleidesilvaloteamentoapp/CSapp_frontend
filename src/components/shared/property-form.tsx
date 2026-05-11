"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PropertyType, PROPERTY_TYPE_LABELS, DevelopmentResponse } from "@/types";
import { developmentCreateSchema, type DevelopmentCreateFormData } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Home, Building, Store, Trees, MapPin } from "lucide-react";

interface PropertyFormProps {
  propertyType: PropertyType;
  onSubmit: (data: DevelopmentCreateFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<DevelopmentCreateFormData> | DevelopmentResponse;
}

const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ReactNode> = {
  LOT: <MapPin className="h-5 w-5" />,
  HOUSE: <Home className="h-5 w-5" />,
  APARTMENT: <Building className="h-5 w-5" />,
  COMMERCIAL: <Store className="h-5 w-5" />,
  RURAL: <Trees className="h-5 w-5" />,
};

export function PropertyForm({ 
  propertyType, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  initialData 
}: PropertyFormProps) {
  const form = useForm<DevelopmentCreateFormData>({
    resolver: zodResolver(developmentCreateSchema) as never,
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      location: initialData?.location || "",
      property_type: propertyType,
      // Campos de lote
      block: initialData?.block || "",
      lot_number: initialData?.lot_number || "",
      area_m2: initialData?.area_m2 ? (typeof initialData.area_m2 === 'string' ? parseFloat(initialData.area_m2) : initialData.area_m2) : undefined,
      // Campos de casa/apartamento
      bedrooms: initialData?.bedrooms || undefined,
      bathrooms: initialData?.bathrooms || undefined,
      suites: initialData?.suites || undefined,
      parking_spaces: initialData?.parking_spaces || undefined,
      construction_area_m2: initialData?.construction_area_m2 ? (typeof initialData.construction_area_m2 === 'string' ? parseFloat(initialData.construction_area_m2) : initialData.construction_area_m2) : undefined,
      total_area_m2: initialData?.total_area_m2 ? (typeof initialData.total_area_m2 === 'string' ? parseFloat(initialData.total_area_m2) : initialData.total_area_m2) : undefined,
      // Campos gerais
      price: initialData?.price ? (typeof initialData.price === 'string' ? parseFloat(initialData.price) : initialData.price) : undefined,
    },
  });

  const watchPropertyType = form.watch("property_type");

  const renderLotFields = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Informações do Lote
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="lot_number" render={({ field }) => (
          <FormItem>
            <FormLabel>Número/Identificação do Lote</FormLabel>
            <FormControl>
              <Input placeholder="Ex: 01, A, 01-A" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="block" render={({ field }) => (
          <FormItem>
            <FormLabel>Quadra</FormLabel>
            <FormControl>
              <Input placeholder="Ex: A, B, 01" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="area_m2" render={({ field }) => (
          <FormItem>
            <FormLabel>Área Total (m²)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 360.00" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="price" render={({ field }) => (
          <FormItem>
            <FormLabel>Valor (R$)</FormLabel>
            <FormControl>
              <CurrencyInput
                placeholder="150.000,00"
                value={field.value as number | undefined}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );

  const renderResidentialFields = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {propertyType === "HOUSE" ? <Home className="h-5 w-5" /> : <Building className="h-5 w-5" />}
        Informações do Imóvel
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField control={form.control} name="bedrooms" render={({ field }) => (
          <FormItem>
            <FormLabel>Dormitórios</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="3" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="bathrooms" render={({ field }) => (
          <FormItem>
            <FormLabel>Banheiros</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="2" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="suites" render={({ field }) => (
          <FormItem>
            <FormLabel>Suítes</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="1" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="parking_spaces" render={({ field }) => (
          <FormItem>
            <FormLabel>Vagas Garagem</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="2" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="construction_area_m2" render={({ field }) => (
          <FormItem>
            <FormLabel>Área Construída (m²)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 120.00" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="total_area_m2" render={({ field }) => (
          <FormItem>
            <FormLabel>Área Total (m²)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 200.00" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="price" render={({ field }) => (
        <FormItem>
          <FormLabel>Valor (R$)</FormLabel>
          <FormControl>
            <CurrencyInput
              placeholder="450.000,00"
              value={field.value as number | undefined}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );

  const renderCommercialFields = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Store className="h-5 w-5" />
        Informações Comerciais
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="construction_area_m2" render={({ field }) => (
          <FormItem>
            <FormLabel>Área Construída (m²)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 80.00" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="total_area_m2" render={({ field }) => (
          <FormItem>
            <FormLabel>Área Total (m²)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 100.00" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="parking_spaces" render={({ field }) => (
        <FormItem>
          <FormLabel>Vagas de Estacionamento</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              placeholder="4" 
              {...field}
              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="price" render={({ field }) => (
        <FormItem>
          <FormLabel>Valor (R$)</FormLabel>
          <FormControl>
            <CurrencyInput
              placeholder="280.000,00"
              value={field.value as number | undefined}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );

  const renderRuralFields = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Trees className="h-5 w-5" />
        Informações Rurais
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="area_m2" render={({ field }) => (
          <FormItem>
            <FormLabel>Área Total (m²)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 10000.00" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="construction_area_m2" render={({ field }) => (
          <FormItem>
            <FormLabel>Área Construída (m²)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 150.00" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="price" render={({ field }) => (
        <FormItem>
          <FormLabel>Valor (R$)</FormLabel>
          <FormControl>
            <CurrencyInput
              placeholder="320.000,00"
              value={field.value as number | undefined}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              {PROPERTY_TYPE_ICONS[propertyType]}
              <div>
                <CardTitle className="text-xl">{PROPERTY_TYPE_LABELS[propertyType]}</CardTitle>
                <CardDescription>
                  Preencha as informações do imóvel
                </CardDescription>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {PROPERTY_TYPE_LABELS[propertyType]}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Campos básicos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações Básicas</h3>
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Empreendimento/Imóvel</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Residencial Parque das Árvores" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Localização</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Rua das Flores, 123 - Centro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detalhes sobre o empreendimento/imóvel..." 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Campos específicos por tipo */}
        {watchPropertyType === "LOT" && renderLotFields()}
        {(watchPropertyType === "HOUSE" || watchPropertyType === "APARTMENT") && renderResidentialFields()}
        {watchPropertyType === "COMMERCIAL" && renderCommercialFields()}
        {watchPropertyType === "RURAL" && renderRuralFields()}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Cadastrar Imóvel"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
