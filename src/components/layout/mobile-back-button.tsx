"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROOT_PATHS = ["/admin/dashboard", "/portal/dashboard", "/staff/dashboard"];

export function MobileBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show back button on root dashboard pages
  if (ROOT_PATHS.includes(pathname)) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 shrink-0"
      onClick={() => router.back()}
      aria-label="Voltar"
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
}
