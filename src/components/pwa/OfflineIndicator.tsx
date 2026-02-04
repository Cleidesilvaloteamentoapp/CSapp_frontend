'use client';

import { useOnline } from '@/hooks/useOnline';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnline();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white py-2 px-4 text-center z-50 flex items-center justify-center gap-2 animate-slide-down">
      <WifiOff size={18} />
      <span className="text-sm font-medium">
        Você está offline. Algumas funcionalidades podem estar limitadas.
      </span>
    </div>
  );
}
