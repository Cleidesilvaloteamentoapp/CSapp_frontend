"use client";

import { Building2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CSApp</h1>
          <p className="text-sm text-muted-foreground">Gestão de Loteamentos</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="rounded-full bg-muted p-4">
              <WifiOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Você está offline
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Parece que você perdeu a conexão com a internet. Verifique sua conexão
                e tente novamente.
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Esta página ficará disponível automaticamente quando a conexão for restaurada.
        </p>
      </div>
    </div>
  );
}
