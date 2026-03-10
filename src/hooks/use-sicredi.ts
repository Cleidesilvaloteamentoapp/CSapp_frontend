"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getCredentials,
  saveCredentials,
  createBoleto,
  getBoleto,
  getBoletoBySeuNumero,
  cancelBoleto,
  alterarVencimento,
  alterarDesconto,
  alterarJuros,
  concederAbatimento,
  cancelarAbatimento,
  alterarSeuNumero,
  incluirNegativacao,
  sustarNegativacaoBaixar,
  downloadBoletoPdf,
  triggerPdfDownload,
  listLocalBoletos,
  getBoletoStats,
  getBoletoByNossoNumero as fetchBoletoLocal,
  executeBatchOperation as execBatchOp,
  createBatchBoletos,
} from "@/services/sicredi";
import { ApiError } from "@/lib/api";
import type {
  SicrediCredentialsRequest,
  SicrediCredentialsResponse,
  CreateBoletoRequest,
  BoletoCreated,
  BoletoDetails,
  Boleto,
  BoletoStats,
  BoletoListFilters,
  AlterarVencimentoRequest,
  AlterarDescontoRequest,
  AlterarJurosRequest,
  AlterarSeuNumeroRequest,
  ConcederAbatimentoRequest,
  NegativacaoRequest,
  BatchOperationRequest,
  BatchOperationResponse,
  BatchCreateRequest,
  BatchCreateResponse,
} from "@/types/sicredi";
import type { PaginatedResponse } from "@/types";

// ===================== Credentials Hook =====================

export function useSicrediCredentials() {
  const [credentials, setCredentials] =
    useState<SicrediCredentialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCredentials();
      setCredentials(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCredentials(null);
      } else {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar credenciais"
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (
    data: SicrediCredentialsRequest
  ): Promise<SicrediCredentialsResponse | null> => {
    setSaving(true);
    setError(null);
    try {
      const result = await saveCredentials(data);
      setCredentials(result);
      return result;
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? typeof err.detail === "string"
            ? err.detail
            : "Erro de validação"
          : "Erro ao salvar credenciais";
      setError(msg);
      return null;
    } finally {
      setSaving(false);
    }
  };

  return { credentials, loading, saving, error, save, reload: load };
}

// ===================== Boleto CRUD Hook =====================

export function useSicrediBoletos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (
    data: CreateBoletoRequest
  ): Promise<BoletoCreated | null> => {
    setLoading(true);
    setError(null);
    try {
      return await createBoleto(data);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? typeof err.detail === "string"
            ? err.detail
            : "Erro de validação"
          : "Erro ao criar boleto";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchBoleto = async (
    nossoNumero: string
  ): Promise<BoletoDetails | null> => {
    setLoading(true);
    setError(null);
    try {
      return await getBoleto(nossoNumero);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Boleto não encontrado"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchBySeuNumero = async (
    seuNumero: string
  ): Promise<BoletoDetails[]> => {
    setLoading(true);
    setError(null);
    try {
      return await getBoletoBySeuNumero(seuNumero);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na busca");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (nossoNumero: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await cancelBoleto(nossoNumero);
      return true;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? typeof err.detail === "string"
            ? err.detail
            : "Erro ao cancelar"
          : "Erro ao cancelar boleto"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateVencimento = async (
    nossoNumero: string,
    data: AlterarVencimentoRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await alterarVencimento(nossoNumero, data);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao alterar vencimento"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateDesconto = async (
    nossoNumero: string,
    data: AlterarDescontoRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await alterarDesconto(nossoNumero, data);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao alterar desconto"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateJuros = async (
    nossoNumero: string,
    data: AlterarJurosRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await alterarJuros(nossoNumero, data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar juros");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const grantAbatimento = async (
    nossoNumero: string,
    data: ConcederAbatimentoRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await concederAbatimento(nossoNumero, data);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao conceder abatimento"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const revokeAbatimento = async (nossoNumero: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await cancelarAbatimento(nossoNumero);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao cancelar abatimento"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSeuNumero = async (
    nossoNumero: string,
    data: AlterarSeuNumeroRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await alterarSeuNumero(nossoNumero, data);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao alterar seu número"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const negativar = async (
    nossoNumero: string,
    data?: NegativacaoRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await incluirNegativacao(nossoNumero, data);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao incluir negativação"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sustarNegativacao = async (nossoNumero: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await sustarNegativacaoBaixar(nossoNumero);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao sustar negativação"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadLocalBoletos = async (
    filters?: BoletoListFilters
  ): Promise<PaginatedResponse<Boleto> | null> => {
    setLoading(true);
    setError(null);
    try {
      return await listLocalBoletos(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar boletos");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (): Promise<BoletoStats | null> => {
    try {
      return await getBoletoStats();
    } catch {
      return null;
    }
  };

  const fetchBoletoLocalByNN = async (
    nossoNumero: string
  ): Promise<Boleto | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fetchBoletoLocal(nossoNumero);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Boleto não encontrado"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (
    data: BatchCreateRequest
  ): Promise<BatchCreateResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      return await createBatchBoletos(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar lote de boletos"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const batchOperation = async (
    data: BatchOperationRequest
  ): Promise<BatchOperationResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      return await execBatchOp(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro na operação em lote"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (
    linhaDigitavel: string,
    filename?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const blob = await downloadBoletoPdf(linhaDigitavel);
      triggerPdfDownload(blob, filename || `boleto_${linhaDigitavel}.pdf`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar PDF");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    create,
    fetchBoleto,
    fetchBoletoLocalByNN,
    searchBySeuNumero,
    cancel,
    updateVencimento,
    updateDesconto,
    updateJuros,
    updateSeuNumero,
    grantAbatimento,
    revokeAbatimento,
    negativar,
    sustarNegativacao,
    loadLocalBoletos,
    loadStats,
    createBatch,
    batchOperation,
    downloadPdf,
  };
}
