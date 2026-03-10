"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getBatchProgress } from "@/services/sicredi";
import type { BatchProgress } from "@/types/sicredi";

export function useBatchProgress(batchId: string | null) {
  const [data, setData] = useState<BatchProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!batchId) {
      setData(null);
      setLoading(false);
      stop();
      return;
    }

    setLoading(true);
    setError(null);

    async function poll() {
      try {
        const progress = await getBatchProgress(batchId!);
        setData(progress);
        setLoading(false);

        if (progress.status === "COMPLETED" || progress.status === "FAILED") {
          stop();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao consultar progresso");
        setLoading(false);
        stop();
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => stop();
  }, [batchId, stop]);

  return { data, loading, error, stop };
}
