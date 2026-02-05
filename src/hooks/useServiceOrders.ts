import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, clientApi } from '@/lib/api';
import { 
  ServiceOrder, 
  ServiceOrderFilters, 
  CreateServiceOrderData, 
  UpdateServiceOrderData, 
  ServiceType,
  ServiceOrderAnalytics 
} from '@/types/service';
import { toast } from 'sonner';

export function useAdminServiceOrders(filters?: ServiceOrderFilters) {
  return useQuery({
    queryKey: ['admin-service-orders', filters],
    queryFn: async () => {
      const { data } = await adminApi.serviceOrders.list(filters as Record<string, unknown>);
      return data as ServiceOrder[];
    },
  });
}

export function useClientServiceOrders(filters?: ServiceOrderFilters) {
  return useQuery({
    queryKey: ['client-service-orders', filters],
    queryFn: async () => {
      const { data } = await clientApi.serviceOrders.list(filters as Record<string, unknown>);
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

export function useServiceOrderAnalytics(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['service-order-analytics', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await adminApi.serviceOrders.analytics({ date_from: dateFrom, date_to: dateTo });
      return data as ServiceOrderAnalytics;
    },
  });
}

export function useCreateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (typeData: { name: string; description?: string; base_price: number; is_active?: boolean }) => {
      const { data } = await adminApi.serviceTypes.create(typeData);
      return data as ServiceType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast.success('Tipo de serviço criado com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao criar tipo de serviço');
    },
  });
}

export function useUpdateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string; base_price?: number; is_active?: boolean } }) => {
      const response = await adminApi.serviceTypes.update(id, data);
      return response.data as ServiceType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast.success('Tipo de serviço atualizado com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao atualizar tipo de serviço');
    },
  });
}
