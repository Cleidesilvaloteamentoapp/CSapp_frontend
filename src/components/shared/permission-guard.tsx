"use client";

import type { ReactNode } from "react";
import type { StaffPermissions } from "@/types";
import { useAuth } from "@/contexts/auth-context";

interface PermissionGuardProps {
  permission: keyof StaffPermissions;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
