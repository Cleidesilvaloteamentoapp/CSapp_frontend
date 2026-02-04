'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <WifiOff size={40} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Você está offline
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Verifique sua conexão com a internet e tente novamente. Algumas
          funcionalidades podem estar disponíveis em cache.
        </p>
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw size={18} />
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
}
