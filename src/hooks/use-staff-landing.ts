"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { StaffPermissions } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { getFirstAllowedStaffRoute } from "@/lib/staff-nav";

/**
 * Guard for the staff landing route. Unlike useRequirePermission, a staff
 * member who lacks this page's permission is forwarded to the first route they
 * CAN open rather than to "sem permissao" -- landing on a hard-coded page they
 * were never granted is not the same as having no access at all.
 *
 * Returns true once the page is cleared to render.
 */
export function useStaffLanding(permission: keyof StaffPermissions): boolean {
  const { can, loading, permissionsError } = useAuth();
  const router = useRouter();
  const allowed = can(permission);

  useEffect(() => {
    if (loading || permissionsError || allowed) return;
    const fallback = getFirstAllowedStaffRoute(can);
    router.replace(fallback ?? "/staff/sem-permissao");
  }, [loading, permissionsError, allowed, can, router]);

  return allowed;
}
