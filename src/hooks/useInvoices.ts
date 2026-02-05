import { useQuery, useMutation } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { Invoice, InvoiceFilters, InvoiceListResponse } from '@/types/invoice';

export function useClientInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ['client-invoices', filters],
    queryFn: async () => {
      const { data } = await clientApi.invoices.list(filters as Record<string, unknown>);
      return data as InvoiceListResponse;
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data } = await clientApi.invoices.get(id);
      return data as Invoice;
    },
    enabled: !!id,
  });
}

export function useDownloadBoleto() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await clientApi.invoices.get(invoiceId);
      const invoice = data as Invoice;
      if (invoice.payment_url) {
        window.open(invoice.payment_url, '_blank');
      }
      return invoice;
    },
  });
}
