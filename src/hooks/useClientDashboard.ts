import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { ClientDashboard } from '@/types';

export function useClientDashboard() {
  return useQuery<ClientDashboard>({
    queryKey: ['client-dashboard'],
    queryFn: async () => {
      const response = await clientApi.dashboard.get();
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
