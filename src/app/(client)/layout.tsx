'use client';

import { useAuth } from '@/hooks/useAuth';
import { ClientSidebar } from '@/components/client/Sidebar';
import { ClientHeader } from '@/components/client/Header';
import { useUIStore } from '@/store/uiStore';
import { PageLoading } from '@/components/shared/Loading';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth('client');
  const { sidebarCollapsed } = useUIStore();

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ClientSidebar />
      <ClientHeader />
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
