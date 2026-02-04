import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { Referral, CreateReferralData } from '@/types/client';
import { toast } from 'sonner';

export function useReferrals() {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const { data } = await clientApi.referrals.list();
      return data as { referrals: Referral[]; total: number };
    },
  });
}

export function useCreateReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referralData: CreateReferralData) => {
      const { data } = await clientApi.referrals.create(referralData);
      return data as Referral;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast.success('Indicação criada com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao criar indicação');
    },
  });
}
