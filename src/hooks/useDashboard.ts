import { useQuery } from '@tanstack/react-query';
import { adminApi, clientApi } from '@/lib/api';
import { DashboardStats, ClientDashboard } from '@/types';
import { useOfflineStore } from '@/store/offlineStore';
import { useOnline } from './useOnline';

export function useAdminDashboard() {
  const isOnline = useOnline();
  const { getCachedData, setCachedData } = useOfflineStore();

  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await adminApi.dashboard.getStats();
      setCachedData('dashboard', data);
      return data as DashboardStats;
    },
    placeholderData: () => {
      if (!isOnline) {
        return getCachedData('dashboard') as DashboardStats | undefined;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useClientDashboard() {
  const isOnline = useOnline();
  const { getCachedData, setCachedData } = useOfflineStore();

  return useQuery({
    queryKey: ['client-dashboard'],
    queryFn: async () => {
      const { data } = await clientApi.dashboard.get();
      setCachedData('dashboard', data);
      return data as ClientDashboard;
    },
    placeholderData: () => {
      if (!isOnline) {
        return getCachedData('dashboard') as ClientDashboard | undefined;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}
