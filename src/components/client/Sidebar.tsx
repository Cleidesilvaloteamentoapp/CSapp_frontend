'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import {
  LayoutDashboard,
  Receipt,
  Wrench,
  FileText,
  Users,
  User,
  ChevronLeft,
  Building2,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/financial', icon: Receipt, label: 'Financeiro' },
  { href: '/services', icon: Wrench, label: 'Serviços' },
  { href: '/documents', icon: FileText, label: 'Documentos' },
  { href: '/referrals', icon: Users, label: 'Indicações' },
  { href: '/profile', icon: User, label: 'Meu Perfil' },
];

export function ClientSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold text-lg">Meu Portal</span>
            )}
          </Link>
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft
              className={cn(
                'w-5 h-5 transition-transform',
                sidebarCollapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
