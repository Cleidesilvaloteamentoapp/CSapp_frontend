'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function useAuth(requiredRole?: 'admin' | 'client') {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (requiredRole && user?.role !== requiredRole) {
        router.replace(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, router, user?.role]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
  };
}

export function useRequireAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { user, isAuthenticated, isLoading };
}
