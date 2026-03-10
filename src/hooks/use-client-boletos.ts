import { useState, useEffect, useCallback } from "react";
import { getClientBoletos } from "@/services/sicredi";
import type { Boleto } from "@/types/sicredi";

export function useClientBoletos(clientId: string | null) {
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) {
      setBoletos([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await getClientBoletos(clientId);
      setBoletos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar boletos");
      setBoletos([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { boletos, loading, error, reload: load };
}
