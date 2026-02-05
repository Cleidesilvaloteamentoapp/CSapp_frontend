import { create } from 'zustand';
import { User } from '@/types';
import { supabase, signInWithEmail, signOut as supabaseSignOut } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.user) {
        const user: User = {
          id: result.user.id,
          email: result.user.email || '',
          full_name: result.user.user_metadata?.full_name || result.user.email?.split('@')[0] || '',
          cpf_cnpj: result.user.user_metadata?.cpf_cnpj,
          phone: result.user.user_metadata?.phone,
          role: result.user.user_metadata?.role || 'client',
          created_at: result.user.created_at,
        };
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      set({
        error: message,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

      logout: async () => {
        set({ isLoading: true });
        try {
          await supabaseSignOut();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Erro ao fazer logout';
          set({ error: message, isLoading: false });
        }
      },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          cpf_cnpj: session.user.user_metadata?.cpf_cnpj,
          phone: session.user.user_metadata?.phone,
          role: session.user.user_metadata?.role || 'client',
          created_at: session.user.created_at,
        };
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('checkAuth error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
