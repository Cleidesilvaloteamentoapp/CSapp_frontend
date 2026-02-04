import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, clientApi } from '@/lib/api';
import { ServiceOrder, ServiceOrderFilters, CreateServiceOrderData, UpdateServiceOrderData, ServiceType } from '@/types/service';
import { toast } from 'sonner';

export function useAdminServiceOrders(filters?: ServiceOrderFilters) {
  return useQuery({
    queryKey: ['admin-service-orders', filters],
    queryFn: async () => {
      const { data } = await adminApi.serviceOrders.list(filters);
      return data as ServiceOrder[];
    },
  });
}

export function useClientServiceOrders(filters?: ServiceOrderFilters) {
  return useQuery({
    queryKey: ['client-service-orders', filters],
    queryFn: async () => {
      const { data } = await clientApi.serviceOrders.list(filters);
      return data as ServiceOrder[];
    },
  });
}

export function useServiceOrder(id: string, isAdmin = false) {
  return useQuery({
    queryKey: ['service-order', id],
    queryFn: async () => {
      const api = isAdmin ? adminApi : clientApi;
      const { data } = await api.serviceOrders.get(id);
      return data as ServiceOrder;
    },
    enabled: !!id,
  });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateServiceOrderData) => {
      const { data } = await clientApi.serviceOrders.create(orderData);
      return data as ServiceOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-service-orders'] });
      toast.success('Solicitação de serviço criada com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao criar solicitação');
    },
  });
}

export function useUpdateServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateServiceOrderData }) => {
      const response = await adminApi.serviceOrders.update(id, data);
      return response.data as ServiceOrder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['service-order', variables.id] });
      toast.success('Ordem de serviço atualizada com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao atualizar ordem de serviço');
    },
  });
}

export function useServiceTypes(forClient = false) {
  return useQuery({
    queryKey: ['service-types', forClient],
    queryFn: async () => {
      const { data } = forClient
        ? await clientApi.serviceTypes.list()
        : await adminApi.serviceTypes.list();
      return data as ServiceType[];
    },
  });
}
