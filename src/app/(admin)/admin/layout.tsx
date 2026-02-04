'use client';

import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/Header';
import { useUIStore } from '@/store/uiStore';
import { PageLoading } from '@/components/shared/Loading';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth('admin');
  const { sidebarCollapsed } = useUIStore();

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
      <AdminHeader />
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
