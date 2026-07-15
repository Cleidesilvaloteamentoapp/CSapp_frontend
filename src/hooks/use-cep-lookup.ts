"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAddressByCep,
  isValidCep,
  onlyDigits,
  CepError,
  type CepAddress,
} from "@/lib/cep";

interface UseCepLookupOptions {
  /** Chamado quando o endereço é encontrado, para preencher o formulário. */
  onFound: (address: CepAddress) => void;
  /** Chamado em caso de erro (CEP inexistente ou falha de rede). */
  onError?: (message: string) => void;
}

interface UseCepLookupResult {
  loading: boolean;
  /** Dispara a busca. Ignora CEPs incompletos e evita buscas duplicadas. */
  lookup: (cep: string) => void;
}

/**
 * Hook para preencher endereço a partir do CEP. Cuida de estado de carregamento,
 * cancelamento de requisições em andamento e deduplicação de buscas.
 */
export function useCepLookup({ onFound, onError }: UseCepLookupOptions): UseCepLookupResult {
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastCepRef = useRef<string>("");

  // Mantém os callbacks atualizados sem recriar `lookup` a cada render.
  const onFoundRef = useRef(onFound);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onFoundRef.current = onFound;
    onErrorRef.current = onError;
  });

  // Cancela qualquer requisição pendente ao desmontar.
  useEffect(() => () => abortRef.current?.abort(), []);

  const lookup = useCallback((cep: string) => {
    if (!isValidCep(cep)) return;

    const digits = onlyDigits(cep);
    // Evita refazer a mesma busca (ex.: onChange seguido de onBlur).
    if (digits === lastCepRef.current) return;
    lastCepRef.current = digits;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    fetchAddressByCep(digits, controller.signal)
      .then((address) => {
        if (controller.signal.aborted) return;
        onFoundRef.current(address);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        // Permite nova tentativa do mesmo CEP após uma falha.
        lastCepRef.current = "";
        const message =
          err instanceof CepError ? err.message : "Não foi possível buscar o CEP";
        onErrorRef.current?.(message);
      })
      .finally(() => {
        if (abortRef.current === controller) setLoading(false);
      });
  }, []);

  return { loading, lookup };
}
