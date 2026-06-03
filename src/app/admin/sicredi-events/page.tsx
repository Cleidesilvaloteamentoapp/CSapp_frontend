"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Landmark, Eye, ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { listSicrediEvents } from "@/services/admin";
import type { SicrediEventResponse } from "@/types";

export default function SicrediEventsPage() {
  const [events, setEvents] = useState<SicrediEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [nossoNumero, setNossoNumero] = useState("");
  const [detail, setDetail] = useState<SicrediEventResponse | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { direction?: string; nosso_numero?: string; limit: number } = { limit: 200 };
      if (direction !== "all") params.direction = direction;
      if (nossoNumero.trim()) params.nosso_numero = nossoNumero.trim();
      const data = await listSicrediEvents(params);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError) toast.error("Erro ao carregar eventos Sicredi");
    } finally {
      setLoading(false);
    }
  }, [direction, nossoNumero]);

  useEffect(() => { loadData(); }, [loadData]);

  function directionBadge(d: string) {
    return d === "INBOUND" ? (
      <Badge variant="secondary" className="gap-1"><ArrowDownLeft className="h-3 w-3" />Recebido</Badge>
    ) : (
      <Badge variant="outline" className="gap-1"><ArrowUpRight className="h-3 w-3" />Enviado</Badge>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria Sicredi" description="Registro permanente de tudo que enviamos e recebemos do banco" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={direction} onValueChange={setDirection}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Direção" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as direções</SelectItem>
            <SelectItem value="OUTBOUND">Enviados (requisições)</SelectItem>
            <SelectItem value="INBOUND">Recebidos (webhooks)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            placeholder="Filtrar por nosso número"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setNossoNumero(search); }}
            className="w-full sm:w-64"
          />
          <Button variant="outline" onClick={() => setNossoNumero(search)}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton />
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Landmark className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Nenhum evento registrado</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Direção</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Nosso Número</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(ev.created_at)}</TableCell>
                      <TableCell>{directionBadge(ev.direction)}</TableCell>
                      <TableCell className="font-medium">{ev.event_type}</TableCell>
                      <TableCell className="font-mono text-xs">{ev.nosso_numero || "—"}</TableCell>
                      <TableCell>
                        {ev.success === null ? (
                          <Badge variant="outline">—</Badge>
                        ) : ev.success ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">OK</Badge>
                        ) : (
                          <Badge variant="destructive">Falha</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDetail(ev)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evento Sicredi — {detail?.event_type}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Direção</p>{directionBadge(detail.direction)}</div>
                <div><p className="text-xs text-muted-foreground">Data/Hora</p><p>{formatDateTime(detail.created_at)}</p></div>
                <div><p className="text-xs text-muted-foreground">Nosso Número</p><p className="font-mono text-xs">{detail.nosso_numero || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">HTTP</p><p>{detail.http_status ?? "—"}</p></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payload</p>
                <pre className="rounded-lg bg-muted p-3 text-xs overflow-auto max-h-96">
                  {JSON.stringify(detail.payload ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
