"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { StaffPermissions } from "@/types";
import { useAuth } from "@/contexts/auth-context";

export function useRequirePermission(permission: keyof StaffPermissions) {
  const { can, loading, permissionsError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Never bounce to "sem permissao" when the permissions simply failed to
    // load -- the layout renders a retry for that case instead.
    if (!loading && !permissionsError && !can(permission)) {
      router.replace("/staff/sem-permissao");
    }
  }, [loading, permissionsError, permission, can, router]);
}
