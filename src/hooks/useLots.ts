import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, clientApi } from '@/lib/api';
import { Lot, LotFilters, CreateLotData, UpdateLotData, Development, LotDocument } from '@/types/lot';
import { ClientLot } from '@/types/client';
import { toast } from 'sonner';

export function useAdminLots(filters?: LotFilters) {
  return useQuery({
    queryKey: ['admin-lots', filters],
    queryFn: async () => {
      const { data } = await adminApi.lots.list(filters as Record<string, unknown>);
      return data as Lot[];
    },
  });
}

export function useClientLots() {
  return useQuery({
    queryKey: ['client-lots'],
    queryFn: async () => {
      const { data } = await clientApi.lots.list();
      return data as ClientLot[];
    },
  });
}

export function useLot(id: string) {
  return useQuery({
    queryKey: ['lot', id],
    queryFn: async () => {
      const { data } = await adminApi.lots.get(id);
      return data as Lot;
    },
    enabled: !!id,
  });
}

export function useLotDocuments(lotId: string) {
  return useQuery({
    queryKey: ['lot-documents', lotId],
    queryFn: async () => {
      const { data } = await clientApi.lots.getDocuments(lotId);
      return data as { lot_id: string; documents: LotDocument[] };
    },
    enabled: !!lotId,
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

export function useDevelopments() {
  return useQuery({
    queryKey: ['developments'],
    queryFn: async () => {
      const { data } = await adminApi.developments.list();
      return data as Development[];
    },
  });
}

export const useAdminDevelopments = useDevelopments;

export function useCreateDevelopment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (devData: { name: string; description?: string; location: string }) => {
      const { data } = await adminApi.developments.create(devData);
      return data as Development;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developments'] });
      toast.success('Empreendimento criado com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao criar empreendimento');
    },
  });
}

export function useUpdateDevelopment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string; location?: string } }) => {
      const response = await adminApi.developments.update(id, data);
      return response.data as Development;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developments'] });
      toast.success('Empreendimento atualizado com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao atualizar empreendimento');
    },
  });
}
