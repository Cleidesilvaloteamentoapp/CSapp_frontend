import { useQuery } from '@tanstack/react-query';
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
