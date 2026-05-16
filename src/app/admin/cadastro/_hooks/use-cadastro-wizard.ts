"use client";

import { useCallback, useEffect, useReducer } from "react";
import { api } from "@/lib/api";
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

interface WizardDraft {
  step: number;
  clientId: string | null;
  clientSelectionMode: "EXISTING" | "NEW" | null;
  lotMode: LotMode;
  lotId: string | null;
  createdLotId: string | null;
  clientLotId: string | null;
  boletoMode: BoletoMode;
  invoiceCount: number;
}

function serializeState(state: WizardState): string {
  // Persist only IDs — full objects are rehydrated from API on mount.
  const draft: WizardDraft = {
    step: state.step,
    clientId: state.client?.id ?? null,
    clientSelectionMode: state.clientSelectionMode,
    lotMode: state.lotMode,
    lotId: state.lot?.id ?? null,
    createdLotId: state.createdLotId,
    clientLotId: state.clientLot?.id ?? null,
    boletoMode: state.boletoMode,
    invoiceCount: state.invoiceCount,
  };
  return JSON.stringify(draft);
}

function readDraft(): WizardDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardDraft;
  } catch {
    return null;
  }
}

export function useCadastroWizard(clientIdFromUrl?: string | null) {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  // Hydrate from sessionStorage draft on mount (recovers state if user
  // refreshed the page or navigated away mid-wizard).
  useEffect(() => {
    // URL param takes precedence — the page hydrates `state.client` itself.
    if (clientIdFromUrl) return;
    const draft = readDraft();
    if (!draft || !draft.clientId) return;

    let cancelled = false;
    (async () => {
      try {
        const client = await api.get<ClientResponse>(`/admin/clients/${draft.clientId}`);
        if (cancelled) return;

        let lot: LotResponse | null = null;
        if (draft.lotId) {
          try {
            lot = await api.get<LotResponse>(`/admin/lots/${draft.lotId}`);
          } catch {
            lot = null;
          }
        }

        let clientLot: ClientLotResponse | null = null;
        if (draft.clientLotId) {
          try {
            clientLot = await api.get<ClientLotResponse>(
              `/admin/lots/client-lots/${draft.clientLotId}`
            );
          } catch {
            clientLot = null;
          }
        }

        if (cancelled) return;
        dispatch({
          type: "HYDRATE",
          payload: {
            step: draft.step,
            client,
            clientSelectionMode: draft.clientSelectionMode,
            lotMode: draft.lotMode,
            lot,
            createdLotId: draft.createdLotId,
            clientLot,
            boletoMode: draft.boletoMode,
            boletoResult: null,
            documents: [],
            invoiceCount: draft.invoiceCount,
            savedDraft: true,
            isLoading: false,
          },
        });
      } catch {
        // Stale draft (client deleted, etc) — clear it and start fresh.
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      cancelled = true;
    };
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
