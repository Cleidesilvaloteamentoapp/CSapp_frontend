import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, clientApi } from '@/lib/api';
import { Lot, LotFilters, CreateLotData, UpdateLotData, Development } from '@/types/lot';
import { toast } from 'sonner';

export function useAdminLots(filters?: LotFilters) {
  return useQuery({
    queryKey: ['admin-lots', filters],
    queryFn: async () => {
      const { data } = await adminApi.lots.list(filters);
      return data as Lot[];
    },
  });
}

export function useClientLots() {
  return useQuery({
    queryKey: ['client-lots'],
    queryFn: async () => {
      const { data } = await clientApi.lots.list();
      return data as Lot[];
    },
  });
}

export function useLot(id: string, isAdmin = false) {
  return useQuery({
    queryKey: ['lot', id],
    queryFn: async () => {
      const api = isAdmin ? adminApi : clientApi;
      const { data } = await api.lots.get(id);
      return data as Lot;
    },
    enabled: !!id,
  });
}

export function useCreateLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lotData: CreateLotData) => {
      const { data } = await adminApi.lots.create(lotData);
      return data as Lot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lots'] });
      toast.success('Lote criado com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao criar lote');
    },
  });
}

export function useUpdateLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLotData }) => {
      const response = await adminApi.lots.update(id, data);
      return response.data as Lot;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lots'] });
      queryClient.invalidateQueries({ queryKey: ['lot', variables.id] });
      toast.success('Lote atualizado com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao atualizar lote');
    },
  });
}

export function useDeleteLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await adminApi.lots.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lots'] });
      toast.success('Lote removido com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao remover lote');
    },
  });
}

export function useDevelopments() {
  return useQuery({
    queryKey: ['developments'],
    queryFn: async () => {
      const { data } = await adminApi.developments.list();
      return data as Development[];
    },
  });
}
