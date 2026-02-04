import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: unknown;
  timestamp: number;
}

interface CachedData {
  invoices?: unknown[];
  lots?: unknown[];
  serviceOrders?: unknown[];
  dashboard?: unknown;
}

interface OfflineState {
  pendingActions: PendingAction[];
  cachedData: CachedData;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp'>) => void;
  removePendingAction: (id: string) => void;
  clearPendingActions: () => void;
  setCachedData: <K extends keyof CachedData>(key: K, data: CachedData[K]) => void;
  getCachedData: <K extends keyof CachedData>(key: K) => CachedData[K] | undefined;
  syncPendingActions: () => Promise<void>;
  setLastSyncedAt: (timestamp: number) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      pendingActions: [],
      cachedData: {},
      lastSyncedAt: null,
      isSyncing: false,

      addPendingAction: (action) => {
        const newAction: PendingAction = {
          ...action,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set((state) => ({
          pendingActions: [...state.pendingActions, newAction],
        }));
      },

      removePendingAction: (id) => {
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== id),
        }));
      },

      clearPendingActions: () => {
        set({ pendingActions: [] });
      },

      setCachedData: (key, data) => {
        set((state) => ({
          cachedData: {
            ...state.cachedData,
            [key]: data,
          },
        }));
      },

      getCachedData: (key) => {
        return get().cachedData[key];
      },

      syncPendingActions: async () => {
        const { pendingActions, removePendingAction } = get();

        if (pendingActions.length === 0) return;

        set({ isSyncing: true });

        for (const action of pendingActions) {
          try {
            switch (action.type) {
              case 'create':
                await api.post(action.endpoint, action.data);
                break;
              case 'update':
                await api.put(action.endpoint, action.data);
                break;
              case 'delete':
                await api.delete(action.endpoint);
                break;
            }
            removePendingAction(action.id);
          } catch (error) {
            console.error('Erro ao sincronizar ação:', action, error);
          }
        }

        set({ isSyncing: false, lastSyncedAt: Date.now() });
      },

      setLastSyncedAt: (timestamp) => {
        set({ lastSyncedAt: timestamp });
      },
    }),
    {
      name: 'offline-storage',
      partialize: (state) => ({
        pendingActions: state.pendingActions,
        cachedData: state.cachedData,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
