"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface CaughtError {
  id: string;
  message: string;
  stack?: string;
  source?: string;
  type: "error" | "unhandledrejection" | "react";
  timestamp: Date;
}

interface ErrorOverlayContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  errors: CaughtError[];
  dismissError: (id: string) => void;
  dismissAll: () => void;
  pushError: (err: Omit<CaughtError, "id" | "timestamp">) => void;
}

const STORAGE_KEY = "__debug_errors_enabled__";

const ErrorOverlayContext = createContext<ErrorOverlayContextValue | null>(null);

export function useDebugErrors() {
  const ctx = useContext(ErrorOverlayContext);
  if (!ctx) throw new Error("useDebugErrors must be used within ErrorOverlayProvider");
  return ctx;
}

function useErrorOverlayState() {
  const [enabled, setEnabledState] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      // Build-time env override: ativa globalmente em produção via NEXT_PUBLIC_DEBUG_ERRORS=true
      const envFlag = process.env.NEXT_PUBLIC_DEBUG_ERRORS;
      if (envFlag === "true" || envFlag === "false") {
        return envFlag === "true";
      }
      // Runtime query override (fallback para testes pontuais)
      const params = new URLSearchParams(window.location.search);
      if (params.has("debug_errors")) {
        const val = params.get("debug_errors") === "true";
        localStorage.setItem(STORAGE_KEY, String(val));
        return val;
      }
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [errors, setErrors] = useState<CaughtError[]>([]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setErrors([]);
  }, []);

  const pushError = useCallback((err: Omit<CaughtError, "id" | "timestamp">) => {
    const next: CaughtError = {
      ...err,
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      timestamp: new Date(),
    };
    setErrors((prev) => [...prev, next]);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

    const handlerError = (event: ErrorEvent) => {
      event.preventDefault();
      const err: CaughtError = {
        id: makeId(),
        message: event.message || String(event.error),
        stack: event.error?.stack,
        source: `${event.filename}:${event.lineno}:${event.colno}`,
        type: "error",
        timestamp: new Date(),
      };
      setErrors((prev) => [...prev, err]);
    };

    const handlerRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const reason = event.reason;
      const err: CaughtError = {
        id: makeId(),
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        type: "unhandledrejection",
        timestamp: new Date(),
      };
      setErrors((prev) => [...prev, err]);
    };

    window.addEventListener("error", handlerError);
    window.addEventListener("unhandledrejection", handlerRejection);

    return () => {
      window.removeEventListener("error", handlerError);
      window.removeEventListener("unhandledrejection", handlerRejection);
    };
  }, [enabled]);

  // Expose global toggle for easy on/off in dev/support
  useEffect(() => {
    const toggle = () => {
      setEnabledState((prev: boolean) => {
        const next = !prev;
        try {
          localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
          // ignore
        }
        return next;
      });
    };
    (window as unknown as Record<string, unknown>).toggleDebugErrors = toggle;

    const keyHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", keyHandler);

    return () => {
      delete (window as unknown as Record<string, unknown>).toggleDebugErrors;
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);

  return { enabled, setEnabled, errors, dismissError, dismissAll, pushError };
}

export function ErrorOverlayProvider({ children }: { children: React.ReactNode }) {
  const state = useErrorOverlayState();

  return (
    <ErrorOverlayContext.Provider value={state}>
      <ReactErrorBoundary pushError={state.pushError} enabled={state.enabled}>
        {children}
      </ReactErrorBoundary>
      {state.enabled && <ErrorOverlayPanel />}
    </ErrorOverlayContext.Provider>
  );
}

class ReactErrorBoundary extends React.Component<
  { children: React.ReactNode; pushError: ErrorOverlayContextValue["pushError"]; enabled: boolean }
> {
  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.enabled) {
      this.props.pushError({
        message: error.message || String(error),
        stack: error.stack || errorInfo.componentStack || undefined,
        type: "react",
      });
    }
  }

  override render() {
    return this.props.children;
  }
}

function ErrorOverlayPanel() {
  const { errors, dismissError, dismissAll } = useDebugErrors();

  if (errors.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pointer-events-none">
      <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto bg-white dark:bg-slate-900 border-2 border-red-500 rounded-xl shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-red-600 text-white px-4 py-3 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">⚠️ ERRO DETECTADO</span>
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
              {errors.length} {errors.length === 1 ? "erro" : "erros"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={dismissAll}
              className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition"
            >
              Limpar tudo
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {errors.map((err) => (
            <div key={err.id} className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
                    {err.type === "error" && "Runtime Error"}
                    {err.type === "unhandledrejection" && "Promise Rejection"}
                    {err.type === "react" && "React Error"}
                    {err.source && ` · ${err.source}`}
                  </div>
                  <div className="text-sm font-medium text-foreground break-words">
                    {err.message}
                  </div>
                  {err.stack && (
                    <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {err.stack}
                    </pre>
                  )}
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {err.timestamp.toLocaleString("pt-BR")}
                  </div>
                </div>
                <button
                  onClick={() => dismissError(err.id)}
                  className="text-muted-foreground hover:text-foreground transition shrink-0"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-900 px-4 py-2 text-[10px] text-muted-foreground border-t border-red-100 dark:border-red-900 rounded-b-xl text-center">
          Modo de debug ativo — envie um print desta tela para o suporte
        </div>
      </div>
    </div>
  );
}
