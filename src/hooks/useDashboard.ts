import { useQuery } from '@tanstack/react-query';
import { adminApi, clientApi } from '@/lib/api';
import { AdminDashboardStats, AdminDashboardFinancial, ClientDashboard } from '@/types';
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
      return data as AdminDashboardStats;
    },
    placeholderData: () => {
      if (!isOnline) {
        return getCachedData('dashboard') as AdminDashboardStats | undefined;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminFinancialDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard-financial'],
    queryFn: async () => {
      const { data } = await adminApi.dashboard.getFinancial();
      return data as AdminDashboardFinancial;
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
