"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Settings, Loader2, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCardsSkeleton } from "@/components/shared/loading-skeleton";
import { ApiError } from "@/lib/api";
import { financialSettingsSchema, type FinancialSettingsFormData } from "@/lib/validators";
import { getFinancialSettings, updateFinancialSettings } from "@/services/admin";
import { PermissionGuard } from "@/components/shared/permission-guard";
import type { CompanyFinancialSettingsResponse } from "@/types";

const INDEX_LABELS: Record<string, string> = {
  IPCA: "IPCA",
  IGPM: "IGP-M",
  CUB: "CUB",
  INPC: "INPC",
};

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};

const HARDCODED_DEFAULTS = {
  penalty_rate: 0.02,
  daily_interest_rate: 0.00033,
  adjustment_index: "IPCA" as const,
  adjustment_frequency: "ANNUAL" as const,
  adjustment_custom_rate: 0.05,
};

export default function FinancialSettingsPage() {
  const [settings, setSettings] = useState<CompanyFinancialSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<FinancialSettingsFormData>({
    resolver: zodResolver(financialSettingsSchema) as never,
    defaultValues: HARDCODED_DEFAULTS,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await getFinancialSettings();
      setSettings(data);
      form.reset({
        penalty_rate: data.penalty_rate,
        daily_interest_rate: data.daily_interest_rate,
        adjustment_index: data.adjustment_index,
        adjustment_frequency: data.adjustment_frequency,
        adjustment_custom_rate: data.adjustment_custom_rate,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error("Erro ao carregar configurações financeiras");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: FinancialSettingsFormData) {
    try {
      const updated = await updateFinancialSettings(data);
      setSettings(updated);
      toast.success("Configurações financeiras atualizadas com sucesso!");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao salvar configurações");
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configurações Financeiras" description="Regras financeiras padrão da empresa" />
        <StatsCardsSkeleton count={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações Financeiras"
        description="Regras financeiras padrão da empresa"
      />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Como funciona a cadeia de fallback</p>
            <p>
              Estes valores são usados como <strong>padrão para todos os clientes</strong>.
              Você pode sobrescrever individualmente na ficha de cada cliente (aba &quot;Lotes&quot; → &quot;Regras Financeiras&quot;).
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Customizado no lote</Badge>
              <span>→</span>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Padrão da empresa</Badge>
              <span>→</span>
              <Badge variant="secondary">Constante do sistema</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Regras Padrão
            </CardTitle>
            <CardDescription>
              Altere os valores que serão aplicados a todos os novos contratos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="penalty_rate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Multa por Atraso (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          placeholder="0.02"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          = {((field.value || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Valor decimal. Ex: 0.02 = 2%</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="daily_interest_rate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juros Diários (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.00001"
                          min="0"
                          max="0.01"
                          placeholder="0.00033"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          = {((field.value || 0) * 100).toFixed(4)}%/dia
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Ex: 0.00033 = 0.033%/dia (~1%/mês)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="adjustment_index" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Índice de Reajuste</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o índice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IPCA">IPCA</SelectItem>
                        <SelectItem value="IGPM">IGP-M</SelectItem>
                        <SelectItem value="CUB">CUB</SelectItem>
                        <SelectItem value="INPC">INPC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="adjustment_frequency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência de Reajuste</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Mensal</SelectItem>
                        <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                        <SelectItem value="SEMIANNUAL">Semestral</SelectItem>
                        <SelectItem value="ANNUAL">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="adjustment_custom_rate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa Fixa Adicional (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          placeholder="0.05"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          = {((field.value || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Taxa fixa aplicada junto ao índice. Ex: 0.05 = 5%</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <PermissionGuard permission="manage_financial_settings">
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" />Salvar Configurações</>
                      )}
                    </Button>
                  </div>
                </PermissionGuard>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Current Values Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Valores Atuais</CardTitle>
            <CardDescription>Resumo das configurações vigentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryRow
              label="Multa por Atraso"
              value={`${((settings?.penalty_rate ?? HARDCODED_DEFAULTS.penalty_rate) * 100).toFixed(1)}%`}
              isDefault={!settings}
            />
            <SummaryRow
              label="Juros Diários"
              value={`${((settings?.daily_interest_rate ?? HARDCODED_DEFAULTS.daily_interest_rate) * 100).toFixed(4)}%/dia`}
              isDefault={!settings}
            />
            <SummaryRow
              label="Índice de Reajuste"
              value={INDEX_LABELS[settings?.adjustment_index ?? HARDCODED_DEFAULTS.adjustment_index]}
              isDefault={!settings}
            />
            <SummaryRow
              label="Frequência"
              value={FREQUENCY_LABELS[settings?.adjustment_frequency ?? HARDCODED_DEFAULTS.adjustment_frequency]}
              isDefault={!settings}
            />
            <SummaryRow
              label="Taxa Fixa Adicional"
              value={`${((settings?.adjustment_custom_rate ?? HARDCODED_DEFAULTS.adjustment_custom_rate) * 100).toFixed(1)}%`}
              isDefault={!settings}
            />

            {settings && (
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Última atualização: {new Date(settings.updated_at).toLocaleString("pt-BR")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hardcoded constants reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Constantes do Sistema (Último Recurso)</CardTitle>
          <CardDescription className="text-xs">
            Usadas apenas quando não há configuração da empresa nem do lote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Multa</p>
              <p className="font-mono font-medium">2.0%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Juros/dia</p>
              <p className="font-mono font-medium">0.033%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Índice</p>
              <p className="font-mono font-medium">IPCA</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Frequência</p>
              <p className="font-mono font-medium">Anual</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa fixa</p>
              <p className="font-mono font-medium">5.0%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value, isDefault }: { label: string; value: string; isDefault: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold font-mono">{value}</span>
        {isDefault && (
          <Badge variant="secondary" className="text-[10px]">sistema</Badge>
        )}
      </div>
    </div>
  );
}
