"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-3xl font-bold text-white">
            CS
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Você está offline
        </h1>
        <p className="text-muted-foreground">
          Parece que você perdeu a conexão com a internet. Verifique sua conexão
          e tente novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
