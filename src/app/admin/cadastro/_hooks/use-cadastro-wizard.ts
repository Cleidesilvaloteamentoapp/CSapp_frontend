"use client";

import { useCallback, useEffect, useReducer } from "react";
import type {
  ClientResponse,
  LotResponse,
  ClientLotResponse,
  BoletoCreated,
} from "@/types";
import type { ClientDocument } from "@/types/portal";
import type { BatchCreateResponse } from "@/types/sicredi";

export type LotMode = "EXISTING" | "NEW" | null;
export type BoletoMode = "SKIP" | "INDIVIDUAL" | "BATCH" | null;

export interface WizardState {
  step: number;
  client: ClientResponse | null;
  clientSelectionMode: "EXISTING" | "NEW" | null;
  lotMode: LotMode;
  lot: LotResponse | null;
  createdLotId: string | null;
  clientLot: ClientLotResponse | null;
  boletoMode: BoletoMode;
  boletoResult: BoletoCreated | BatchCreateResponse | null;
  documents: ClientDocument[];
  invoiceCount: number;
  savedDraft: boolean;
  isLoading: boolean;
}

export type WizardAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_CLIENT"; payload: { client: ClientResponse; mode: "EXISTING" | "NEW" } }
  | { type: "CLEAR_CLIENT" }
  | { type: "SET_LOT_MODE"; payload: LotMode }
  | { type: "SET_LOT"; payload: LotResponse | null }
  | { type: "SET_CREATED_LOT_ID"; payload: string | null }
  | { type: "SET_CLIENT_LOT"; payload: ClientLotResponse | null }
  | { type: "SET_BOLETO_MODE"; payload: BoletoMode }
  | { type: "SET_BOLETO_RESULT"; payload: BoletoCreated | BatchCreateResponse | null }
  | { type: "ADD_DOCUMENT"; payload: ClientDocument }
  | { type: "SET_INVOICE_COUNT"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "RESET" }
  | { type: "HYDRATE"; payload: WizardState };

const STORAGE_KEY = "cadastro-wizard-draft";

function getInitialState(): WizardState {
  return {
    step: 0,
    client: null,
    clientSelectionMode: null,
    lotMode: null,
    lot: null,
    createdLotId: null,
    clientLot: null,
    boletoMode: null,
    boletoResult: null,
    documents: [],
    invoiceCount: 0,
    savedDraft: false,
    isLoading: false,
  };
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_CLIENT":
      return {
        ...state,
        client: action.payload.client,
        clientSelectionMode: action.payload.mode,
      };
    case "CLEAR_CLIENT":
      return {
        ...state,
        client: null,
        clientSelectionMode: null,
        lot: null,
        createdLotId: null,
        clientLot: null,
        boletoMode: null,
        boletoResult: null,
        documents: [],
        invoiceCount: 0,
      };
    case "SET_LOT_MODE":
      return { ...state, lotMode: action.payload };
    case "SET_LOT":
      return { ...state, lot: action.payload };
    case "SET_CREATED_LOT_ID":
      return { ...state, createdLotId: action.payload };
    case "SET_CLIENT_LOT":
      return { ...state, clientLot: action.payload };
    case "SET_BOLETO_MODE":
      return { ...state, boletoMode: action.payload };
    case "SET_BOLETO_RESULT":
      return { ...state, boletoResult: action.payload };
    case "ADD_DOCUMENT":
      return { ...state, documents: [...state.documents, action.payload] };
    case "SET_INVOICE_COUNT":
      return { ...state, invoiceCount: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "RESET":
      return getInitialState();
    case "HYDRATE":
      return { ...action.payload, isLoading: false };
    default:
      return state;
  }
}

function serializeState(state: WizardState): string {
  // Don't serialize full client/lot objects to avoid sessionStorage bloat
  const minimal = {
    step: state.step,
    clientId: state.client?.id ?? null,
    clientName: state.client?.full_name ?? null,
    clientSelectionMode: state.clientSelectionMode,
    lotMode: state.lotMode,
    lotId: state.lot?.id ?? null,
    lotLabel: state.lot ? `${state.lot.block ?? ""}-${state.lot.lot_number}` : null,
    createdLotId: state.createdLotId,
    clientLotId: state.clientLot?.id ?? null,
    boletoMode: state.boletoMode,
    boletoResultId:
      state.boletoResult && "batch_id" in state.boletoResult
        ? state.boletoResult.batch_id
        : state.boletoResult && "nosso_numero" in state.boletoResult
          ? state.boletoResult.nosso_numero
          : null,
    invoiceCount: state.invoiceCount,
    savedDraft: true,
  };
  return JSON.stringify(minimal);
}

export function useCadastroWizard(clientIdFromUrl?: string | null) {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  // Hydrate from URL param if provided (user selected existing client)
  useEffect(() => {
    if (!clientIdFromUrl) return;
    // We'll let the page fetch the client and then call SET_CLIENT
  }, [clientIdFromUrl]);

  // Persist minimal state
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const setStep = useCallback((step: number) => dispatch({ type: "SET_STEP", payload: step }), []);
  const setClient = useCallback(
    (client: ClientResponse, mode: "EXISTING" | "NEW") =>
      dispatch({ type: "SET_CLIENT", payload: { client, mode } }),
    []
  );
  const clearClient = useCallback(() => dispatch({ type: "CLEAR_CLIENT" }), []);
  const setLotMode = useCallback((mode: LotMode) => dispatch({ type: "SET_LOT_MODE", payload: mode }), []);
  const setLot = useCallback((lot: LotResponse | null) => dispatch({ type: "SET_LOT", payload: lot }), []);
  const setCreatedLotId = useCallback(
    (id: string | null) => dispatch({ type: "SET_CREATED_LOT_ID", payload: id }),
    []
  );
  const setClientLot = useCallback(
    (cl: ClientLotResponse | null) => dispatch({ type: "SET_CLIENT_LOT", payload: cl }),
    []
  );
  const setBoletoMode = useCallback(
    (mode: BoletoMode) => dispatch({ type: "SET_BOLETO_MODE", payload: mode }),
    []
  );
  const setBoletoResult = useCallback(
    (result: BoletoCreated | BatchCreateResponse | null) =>
      dispatch({ type: "SET_BOLETO_RESULT", payload: result }),
    []
  );
  const addDocument = useCallback(
    (doc: ClientDocument) => dispatch({ type: "ADD_DOCUMENT", payload: doc }),
    []
  );
  const setInvoiceCount = useCallback(
    (count: number) => dispatch({ type: "SET_INVOICE_COUNT", payload: count }),
    []
  );
  const setLoading = useCallback(
    (loading: boolean) => dispatch({ type: "SET_LOADING", payload: loading }),
    []
  );
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    state,
    dispatch,
    setStep,
    setClient,
    clearClient,
    setLotMode,
    setLot,
    setCreatedLotId,
    setClientLot,
    setBoletoMode,
    setBoletoResult,
    addDocument,
    setInvoiceCount,
    setLoading,
    reset,
  };
}
