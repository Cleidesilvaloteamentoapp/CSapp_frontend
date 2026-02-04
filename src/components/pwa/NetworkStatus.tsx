'use client';

import { useEffect } from 'react';
import { useOnline } from '@/hooks/useOnline';
import { useOfflineStore } from '@/store/offlineStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function NetworkStatus() {
  const isOnline = useOnline();
  const { pendingActions, syncPendingActions } = useOfflineStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOnline) {
      queryClient.refetchQueries();

      if (pendingActions.length > 0) {
        toast.promise(syncPendingActions(), {
          loading: 'Sincronizando dados...',
          success: 'Dados sincronizados com sucesso!',
          error: 'Erro ao sincronizar alguns dados',
        });
      }
    }
  }, [isOnline, pendingActions.length, queryClient, syncPendingActions]);

  return null;
}
