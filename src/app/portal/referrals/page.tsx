"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Users, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ReferralResponse } from "@/types";

const REFERRAL_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  contacted: { label: "Contatado", variant: "default" },
  converted: { label: "Convertido", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

export default function PortalReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    api.get<ReferralResponse[]>("/client/referrals")
      .then(setReferrals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    if (!name || !phone) return;
    setSaving(true);
    try {
      const ref = await api.post<ReferralResponse>("/client/referrals", {
        referred_name: name,
        referred_phone: phone,
        referred_email: email || undefined,
      });
      setReferrals((prev) => [ref, ...prev]);
      toast.success("Indicação enviada com sucesso!");
      setDialogOpen(false);
      setName("");
      setPhone("");
      setEmail("");
    } catch (error) {
      if (error instanceof ApiError) toast.error(typeof error.detail === "string" ? error.detail : "Erro ao enviar indicação");
    } finally {
      setSaving(false);
    }
  }

  const converted = referrals.filter((r) => r.status === "converted").length;
  const pending = referrals.filter((r) => r.status === "pending" || r.status === "contacted").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Indicações" description="Indique amigos e familiares" />
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Indicar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referrals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Convertidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{converted}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : referrals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma indicação ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Indique amigos e acompanhe aqui</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {referrals.map((ref) => {
            const st = REFERRAL_STATUS[ref.status] || REFERRAL_STATUS.pending;
            return (
              <Card key={ref.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-sm">{ref.referred_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ref.referred_phone}</p>
                    {ref.referred_email && (
                      <p className="text-xs text-muted-foreground">{ref.referred_email}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(ref.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Indicação</DialogTitle>
            <DialogDescription>Informe os dados do indicado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone *</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">E-mail (opcional)</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="mt-1" type="email" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={saving || !name || !phone}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : "Indicar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
