"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { forgotPassword } from "@/lib/auth";
import { ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: FormData) {
    try {
      await forgotPassword({ email: data.email });
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao enviar e-mail");
      } else {
        toast.error("Erro de conexão. Tente novamente.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CSApp</h1>
          <p className="text-sm text-muted-foreground">Gestão de Loteamentos</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Recuperar senha</CardTitle>
            <CardDescription>
              {sent
                ? "Verifique seu e-mail para redefinir a senha."
                : "Informe seu e-mail e enviaremos um link de redefinição."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <MailCheck className="h-12 w-12 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Se esse e-mail estiver cadastrado, você receberá as instruções em instantes. O
                  link expira em <strong>15 minutos</strong>.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para o login
                  </Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar link de redefinição"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {!sent && (
          <p className="text-center text-sm text-muted-foreground">
            Lembrou a senha?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
