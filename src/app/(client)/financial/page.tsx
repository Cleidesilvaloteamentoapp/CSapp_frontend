'use client';

import { useState } from 'react';
import { useClientInvoices, useDownloadBoleto } from '@/hooks/useInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, cn } from '@/lib/utils';
import { Receipt, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientFinancialPage() {
  const { data: invoices, isLoading, error, refetch } = useClientInvoices();
  const downloadBoleto = useDownloadBoleto();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPixCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar boletos" onRetry={refetch} />;
  }

  const pendingInvoices = invoices?.filter((i) => i.status === 'pending' || i.status === 'overdue') || [];
  const paidInvoices = invoices?.filter((i) => i.status === 'paid') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">
          Gerencie seus boletos e pagamentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Boletos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingInvoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum boleto pendente
            </p>
          ) : (
            <div className="space-y-4">
              {pendingInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    invoice.status === 'overdue'
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-800'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">
                          Parcela {invoice.installment_number}
                        </p>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {formatDate(invoice.due_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(invoice.amount)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => downloadBoleto.mutate(invoice.id)}
                      disabled={downloadBoleto.isPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Boleto
                    </Button>
                    {invoice.pix_code && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyPixCode(invoice.pix_code!, invoice.id)}
                      >
                        {copiedId === invoice.id ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar PIX
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {paidInvoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum pagamento registrado
            </p>
          ) : (
            <div className="space-y-3">
              {paidInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">Parcela {invoice.installment_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Pago em {invoice.paid_date ? formatDate(invoice.paid_date) : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(invoice.paid_amount || invoice.amount)}
                    </p>
                    <Badge variant="success">Pago</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
