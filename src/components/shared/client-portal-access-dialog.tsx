"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createClientPortalAccess,
  resetClientPortalPassword,
} from "@/services/portal";
import { ApiError } from "@/lib/api";

interface ClientPortalAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  /** When true, calls reset-password instead of create-access. */
  mode: "create" | "reset";
  onSuccess?: () => void;
}

/**
 * Dialog for creating or resetting a client's portal password.
 * Used in: cadastro wizard (StepCliente) and clients admin listing.
 */
export function ClientPortalAccessDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  mode,
  onSuccess,
}: ClientPortalAccessDialogProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setPassword("");
    setConfirm("");
    setSendEmail(true);
  }

  async function handleSubmit() {
    if (password.length < 8) {
      toast.error("Senha deve ter no mínimo 8 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "create") {
        await createClientPortalAccess(clientId, password, sendEmail);
        toast.success("Acesso ao portal criado com sucesso");
      } else {
        await resetClientPortalPassword(clientId, password);
        toast.success("Senha do portal redefinida com sucesso");
      }
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(
          typeof error.detail === "string" ? error.detail : "Erro ao salvar"
        );
      } else {
        toast.error("Erro de conexão");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    mode === "create" ? "Criar acesso ao portal" : "Redefinir senha do portal";
  const Icon = mode === "create" ? UserPlus : KeyRound;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `${clientName} poderá acessar o portal com email e a senha definida abaixo.`
              : `Definir uma nova senha para ${clientName}. A senha anterior será invalidada.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="portal-password">Senha</Label>
            <Input
              id="portal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="portal-password-confirm">Confirmar senha</Label>
            <Input
              id="portal-password-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </div>
          {mode === "create" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4"
              />
              Enviar e-mail com credenciais ao cliente
            </label>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : mode === "create" ? (
              "Criar acesso"
            ) : (
              "Redefinir senha"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
