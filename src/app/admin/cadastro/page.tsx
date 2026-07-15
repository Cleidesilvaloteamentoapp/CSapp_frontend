"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, CheckCircle2, FileText, Eye, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useCadastroWizard } from "./_hooks/use-cadastro-wizard";
import { Stepper } from "./_components/stepper";
import { SummarySidebar, getSummaryItems } from "./_components/summary-sidebar";
import { StepCliente } from "./_components/step-cliente";
import { StepImovel } from "./_components/step-imovel";
import { StepBoletos } from "./_components/step-boletos";
import { StepDocumentos } from "./_components/step-documentos";
import type { ClientResponse, ClientLotResponse } from "@/types";
import type { BoletoCreated, BatchCreateResponse } from "@/types/sicredi";

const STEPS = [
  { id: "cliente", label: "Cliente" },
  { id: "imovel", label: "Imóvel" },
  { id: "boletos", label: "Boletos" },
  { id: "documentos", label: "Documentos" },
];

export default function CadastroWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get("client_id");
  const { can, isAdmin } = useAuth();

  const wizard = useCadastroWizard(clientIdFromUrl);
  const { state, setStep, setClient, clearClient, setLotMode, setLot, setCreatedLotId, setClientLot, setBoletoMode, setBoletoResult, addDocument, setInvoiceCount, reset } = wizard;

  // Check permissions
  const canManageSicredi = isAdmin || can("manage_sicredi");
  const canViewDocuments = isAdmin || can("view_documents");

  // Hydrate existing client from URL param
  useEffect(() => {
    if (!clientIdFromUrl || state.client) return;
    api.get<ClientResponse>(`/admin/clients/${clientIdFromUrl}`)
      .then((client) => {
        setClient(client, "EXISTING");
      })
      .catch(() => {
        // silently ignore; user can select manually
      });
  }, [clientIdFromUrl, state.client, setClient]);

  const handleClientSelect = useCallback(
    (client: ClientResponse, mode: "EXISTING" | "NEW") => {
      setClient(client, mode);
      setStep(1);
    },
    [setClient, setStep]
  );

  const handleClientClear = useCallback(() => {
    clearClient();
    setLotMode(null);
    setLot(null);
    setCreatedLotId(null);
    setClientLot(null);
    setBoletoMode(null);
    setBoletoResult(null);
  }, [clearClient, setLotMode, setLot, setCreatedLotId, setClientLot, setBoletoMode, setBoletoResult]);

  const handleImovelComplete = useCallback(
    (clientLot: ClientLotResponse, invoiceCount: number, isLegacy: boolean) => {
      setClientLot(clientLot);
      setInvoiceCount(invoiceCount);
      if (isLegacy) {
        // Cliente antigo: nenhum boleto é gerado — pula direto para documentos.
        setBoletoMode("SKIP");
        setStep(3);
      } else {
        setStep(2);
      }
    },
    [setClientLot, setInvoiceCount, setBoletoMode, setStep]
  );

  const handleBoletoSkip = useCallback(() => {
    setBoletoMode("SKIP");
    setStep(3);
  }, [setBoletoMode, setStep]);

  const handleBoletoComplete = useCallback(
    (result: BoletoCreated | { batch_id: string; total_items: number }) => {
      if ("nosso_numero" in result) {
        setBoletoResult(result as BoletoCreated);
      } else {
        setBoletoResult(result as unknown as BatchCreateResponse);
      }
      setBoletoMode("nosso_numero" in result ? "INDIVIDUAL" : "BATCH");
      setStep(3);
    },
    [setBoletoResult, setBoletoMode, setStep]
  );

  const handleDocumentosComplete = useCallback(() => {
    setStep(4); // Success screen
  }, [setStep]);

  const summaryItems = getSummaryItems({
    client: state.client,
    clientSelectionMode: state.clientSelectionMode,
    lot: state.lot,
    createdLotId: state.createdLotId,
    clientLot: state.clientLot,
    boletoMode: state.boletoMode,
    boletoResult: state.boletoResult,
    documents: state.documents,
  });

  const completedSteps = [
    state.client ? 0 : -1,
    state.clientLot ? 1 : -1,
    state.boletoMode !== null ? 2 : -1,
    state.documents.length > 0 ? 3 : -1,
  ].filter((i) => i >= 0);

  // --- Step 4: Success / Summary ---
  if (state.step === 4) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Cadastro Concluído" description="Resumo do cadastro realizado">
          <Button variant="outline" onClick={() => router.push("/admin/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Button>
        </PageHeader>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Cadastro finalizado com sucesso!</h2>
            <p className="text-sm text-muted-foreground">
              Todas as etapas foram processadas. Acesse a ficha do cliente para mais detalhes.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{state.client?.full_name}</p>
              <p className="text-muted-foreground">{state.client?.cpf_cnpj}</p>
              <p className="text-muted-foreground">{state.client?.email}</p>
              <Button
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={() => router.push(`/admin/clients?detail=${state.client?.id}`)}
              >
                <Eye className="mr-1 h-3 w-3" /> Ver ficha
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Imóvel / Lote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">
                {state.lot
                  ? `Lote ${state.lot.lot_number}${state.lot.block ? ` - Quadra ${state.lot.block}` : ""}`
                  : state.createdLotId
                    ? "Lote criado no cadastro"
                    : "—"}
              </p>
              <p className="text-muted-foreground">
                {state.invoiceCount > 0 ? `${state.invoiceCount} parcela(s) geradas automaticamente` : "Sem parcelas geradas"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Boletos Sicredi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {state.boletoMode === "SKIP" && (
                <p className="text-muted-foreground">Etapa pulada. Nenhum boleto Sicredi gerado.</p>
              )}
              {state.boletoMode === "INDIVIDUAL" && state.boletoResult && "nosso_numero" in state.boletoResult && (
                <>
                  <p className="font-medium">Boleto individual gerado</p>
                  <p className="text-muted-foreground">Nosso Número: {state.boletoResult.nosso_numero}</p>
                </>
              )}
              {state.boletoMode === "BATCH" && state.boletoResult && "batch_id" in state.boletoResult && (
                <>
                  <p className="font-medium">Lote de boletos criado</p>
                  <p className="text-muted-foreground">{state.boletoResult.total_items} boletos</p>
                </>
              )}
              {state.boletoMode === null && (
                <p className="text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{state.documents.length} documento(s) enviado(s)</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Novo Cadastro
          </Button>
          <Button onClick={() => router.push(`/admin/clients?detail=${state.client?.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            Abrir Ficha do Cliente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastro Rápido"
        description="Cadastre o cliente, imóvel, boletos e documentos em um fluxo único."
      >
        <Button variant="outline" onClick={() => router.push("/admin/clients")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </PageHeader>

      <Stepper
        steps={STEPS}
        currentStep={state.step}
        completedSteps={completedSteps}
        onStepClick={(index) => {
          // Only allow clicking back or to completed steps
          if (index < state.step || completedSteps.includes(index)) {
            setStep(index);
          }
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {/* Step 0: Cliente */}
          {state.step === 0 && (
            <StepCliente
              selectedClient={state.client}
              onClientSelect={handleClientSelect}
              onClear={handleClientClear}
            />
          )}

          {/* Step 1: Imóvel */}
          {state.step === 1 && state.client && (
            <StepImovel
              client={state.client}
              onComplete={handleImovelComplete}
              onBack={() => setStep(0)}
            />
          )}

          {/* Step 2: Boletos */}
          {state.step === 2 && state.client && (
            <StepBoletos
              client={state.client}
              clientLot={state.clientLot}
              invoiceCount={state.invoiceCount}
              onSkip={handleBoletoSkip}
              onComplete={handleBoletoComplete}
              onBack={() => setStep(1)}
            />
          )}

          {/* Step 3: Documentos */}
          {state.step === 3 && state.client && (
            <StepDocumentos
              clientId={state.client.id}
              initialDocuments={state.documents}
              onAddDocument={addDocument}
              onComplete={handleDocumentosComplete}
              onBack={() => setStep(2)}
            />
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="hidden lg:block">
          <SummarySidebar items={summaryItems} currentStep={state.step} />
        </div>
      </div>
    </div>
  );
}
