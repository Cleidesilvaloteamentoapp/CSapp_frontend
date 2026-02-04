import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, clientApi } from '@/lib/api';
import { Invoice, InvoiceFilters } from '@/types/invoice';
import { toast } from 'sonner';

export function useAdminInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ['admin-invoices', filters],
    queryFn: async () => {
      const { data } = await adminApi.invoices.list(filters);
      return data as Invoice[];
    },
  });
}

export function useClientInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ['client-invoices', filters],
    queryFn: async () => {
      const { data } = await clientApi.invoices.list(filters);
      return data as Invoice[];
    },
  });
}

export function useInvoice(id: string, isAdmin = false) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const api = isAdmin ? adminApi : clientApi;
      const { data } = await api.invoices.get(id);
      return data as Invoice;
    },
    enabled: !!id,
  });
}

export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paymentData }: { id: string; paymentData: unknown }) => {
      const { data } = await adminApi.invoices.markAsPaid(id, paymentData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao registrar pagamento');
    },
  });
}

export function useDownloadBoleto() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await clientApi.invoices.downloadBoleto(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `boleto-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao baixar boleto');
    },
  });
}
