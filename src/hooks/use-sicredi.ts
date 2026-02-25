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
  downloadBoletoPdf,
  triggerPdfDownload,
} from "@/services/sicredi";
import { ApiError } from "@/lib/api";
import type {
  SicrediCredentialsRequest,
  SicrediCredentialsResponse,
  CreateBoletoRequest,
  BoletoCreated,
  BoletoDetails,
  AlterarVencimentoRequest,
  AlterarDescontoRequest,
  AlterarJurosRequest,
  ConcederAbatimentoRequest,
} from "@/types/sicredi";

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
    searchBySeuNumero,
    cancel,
    updateVencimento,
    updateDesconto,
    updateJuros,
    grantAbatimento,
    revokeAbatimento,
    downloadPdf,
  };
}
