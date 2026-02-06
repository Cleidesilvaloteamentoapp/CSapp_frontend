"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { loginSchema, type LoginFormData } from "@/lib/validators";
import { login, canAccessAdmin } from "@/lib/auth";
import { getDefaultRedirect } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as never,
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const me = await login(data);
      await refreshUser();
      toast.success(`Bem-vindo, ${me.full_name}!`);
      const defaultRedirect = getDefaultRedirect(me.role);
      const requestedRedirect = searchParams.get("redirect");
      // Validate redirect matches user role to prevent cross-layout loops
      let redirect = defaultRedirect;
      if (requestedRedirect) {
        const isAdmin = canAccessAdmin(me.role);
        const isAdminRoute = requestedRedirect.startsWith("/admin");
        const isPortalRoute = requestedRedirect.startsWith("/portal");
        if ((isAdmin && isAdminRoute) || (!isAdmin && isPortalRoute)) {
          redirect = requestedRedirect;
        }
      }
      router.replace(redirect);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          toast.error("E-mail ou senha incorretos");
        } else {
          toast.error(typeof error.detail === "string" ? error.detail : "Erro ao fazer login");
        }
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
            <CardTitle className="text-xl">Entrar</CardTitle>
            <CardDescription>Insira suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Sua senha"
                            autoComplete="current-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Criar empresa
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
