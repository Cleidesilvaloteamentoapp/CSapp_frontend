"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Download,
  Eye,
  Ban,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { useSicrediBoletos } from "@/hooks/use-sicredi";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BoletoDetails, BoletoSituacao } from "@/types/sicredi";

const SITUACAO_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  NORMAL: { label: "Em Aberto", variant: "outline" },
  EM_ABERTO: { label: "Em Aberto", variant: "outline" },
  LIQUIDADO: { label: "Liquidado", variant: "default" },
  VENCIDO: { label: "Vencido", variant: "destructive" },
  CANCELADO: { label: "Cancelado", variant: "secondary" },
};

export default function BoletosListPage() {
  const router = useRouter();
  const { searchBySeuNumero, cancel, downloadPdf, loading } =
    useSicrediBoletos();
  const [boletos, setBoletos] = useState<BoletoDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [situacaoFilter, setSituacaoFilter] = useState<string>("all");
  const [pageLoading, setPageLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setPageLoading(true);
    const results = await searchBySeuNumero(searchTerm.trim());
    setBoletos(results);
    setPageLoading(false);
  }, [searchTerm, searchBySeuNumero]);

  const filteredBoletos =
    situacaoFilter === "all"
      ? boletos
      : boletos.filter((b) => b.situacao === situacaoFilter);

  function handleCancelClick(nossoNumero: string) {
    setCancelTarget(nossoNumero);
    setCancelConfirmOpen(true);
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    const success = await cancel(cancelTarget);
    setCancelling(false);
    setCancelConfirmOpen(false);
    setCancelTarget(null);
    if (success) {
      toast.success("Boleto cancelado com sucesso");
      setBoletos((prev) =>
        prev.map((b) =>
          b.nosso_numero === cancelTarget
            ? { ...b, situacao: "CANCELADO" as BoletoSituacao }
            : b
        )
      );
    } else {
      toast.error("Erro ao cancelar boleto");
    }
  }

  async function handleDownloadPdf(boleto: BoletoDetails) {
    await downloadPdf(
      boleto.linha_digitavel,
      `boleto_${boleto.nosso_numero}.pdf`
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Boletos Sicredi"
          description="Gerencie boletos emitidos via Sicredi"
        />
        <Button onClick={() => router.push("/admin/sicredi/boletos/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Boleto
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Buscar Boletos</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={situacaoFilter}
                onValueChange={setSituacaoFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="NORMAL">Em Aberto</SelectItem>
                  <SelectItem value="LIQUIDADO">Liquidados</SelectItem>
                  <SelectItem value="VENCIDO">Vencidos</SelectItem>
                  <SelectItem value="CANCELADO">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Buscar por Seu Número (ex: INV-12345)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={pageLoading || !searchTerm.trim()}>
              {pageLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {pageLoading ? (
            <TableSkeleton />
          ) : filteredBoletos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                {boletos.length === 0
                  ? "Busque boletos pelo Seu Número para visualizar"
                  : "Nenhum boleto encontrado com o filtro selecionado"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nosso Número</TableHead>
                  <TableHead>Seu Número</TableHead>
                  <TableHead>Pagador</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBoletos.map((boleto) => {
                  const sit =
                    SITUACAO_BADGE[boleto.situacao] || SITUACAO_BADGE.NORMAL;
                  return (
                    <TableRow key={boleto.nosso_numero}>
                      <TableCell className="font-mono text-sm">
                        {boleto.nosso_numero}
                      </TableCell>
                      <TableCell className="text-sm">
                        {boleto.seu_numero}
                      </TableCell>
                      <TableCell className="text-sm">
                        {boleto.pagador.nome}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatCurrency(boleto.valor)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(boleto.data_vencimento)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sit.variant}>{sit.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/admin/sicredi/boletos/${boleto.nosso_numero}`
                              )
                            }
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPdf(boleto)}
                            disabled={loading}
                            title="Baixar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {boleto.situacao !== "CANCELADO" &&
                            boleto.situacao !== "LIQUIDADO" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleCancelClick(boleto.nosso_numero)
                                }
                                title="Cancelar boleto"
                                className="text-destructive hover:text-destructive"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancelar Boleto"
        description={`Tem certeza que deseja cancelar (dar baixa) no boleto ${cancelTarget}? Esta ação será enviada ao banco Sicredi e não pode ser desfeita.`}
        confirmLabel="Sim, Cancelar Boleto"
        destructive
        loading={cancelling}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
