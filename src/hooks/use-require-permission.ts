"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { StaffPermissions } from "@/types";
import { useAuth } from "@/contexts/auth-context";

export function useRequirePermission(permission: keyof StaffPermissions) {
  const { can, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !can(permission)) {
      router.replace("/staff/sem-permissao");
    }
  }, [loading, permission, can, router]);
}
