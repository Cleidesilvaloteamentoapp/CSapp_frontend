"use client";

import { FileSpreadsheet, Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export default function BankStatementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Extratos Bancários" description="Upload e conciliação de extratos bancários">
        <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Em Breve</Badge>
      </PageHeader>

      <Card>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-lg">Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Em breve você poderá fazer upload de extratos bancários (francesinha) para conciliação automática de pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
              <div className="rounded-lg border border-dashed p-4 text-center">
                <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Upload de Extratos</p>
              </div>
              <div className="rounded-lg border border-dashed p-4 text-center">
                <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Conciliação Automática</p>
              </div>
              <div className="rounded-lg border border-dashed p-4 text-center">
                <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Múltiplos Bancos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
