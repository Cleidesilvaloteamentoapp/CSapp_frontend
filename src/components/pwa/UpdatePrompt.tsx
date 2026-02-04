'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-lg shadow-xl p-4 z-50 max-w-sm animate-slide-up">
      <div className="flex items-start gap-3">
        <RefreshCw size={24} className="flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Atualização Disponível</h3>
          <p className="text-sm mb-3 text-blue-100">
            Uma nova versão do aplicativo está disponível
          </p>
          <Button
            onClick={handleUpdate}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            Atualizar Agora
          </Button>
        </div>
      </div>
    </div>
  );
}
