"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { MeResponse, StaffPermissions } from "@/types";
import { getMe, logout as authLogout, canAccessAdmin, isStaffRole, getStaffPermissions } from "@/lib/auth";
import { clearCachedBranding } from "@/lib/branding/storage";

interface AuthContextType {
  user: MeResponse | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  staffPermissions: StaffPermissions | null;
  /** True when the permission fetch failed. Distinct from "no permissions". */
  permissionsError: boolean;
  can: (perm: keyof StaffPermissions) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions | null>(null);
  const [permissionsError, setPermissionsError] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      if (isStaffRole(me?.role) && me?.id) {
        // Permissions gate every staff screen, so a failed fetch must surface
        // as an error -- falling back to "all denied" looks identical to an
        // admin having revoked access and locks the user out silently.
        try {
          setStaffPermissions(await getStaffPermissions(me.id));
          setPermissionsError(false);
        } catch {
          setStaffPermissions(null);
          setPermissionsError(true);
        }
      } else {
        setStaffPermissions(null);
        setPermissionsError(false);
      }
    } catch {
      setUser(null);
      setStaffPermissions(null);
      setPermissionsError(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogout = useCallback(async () => {
    setUser(null);
    setStaffPermissions(null);
    setPermissionsError(false);
    // Drop the cached palette so the next login on this device does not
    // briefly paint the previous company's brand.
    clearCachedBranding();
    await authLogout();
  }, []);

  const isAdmin = user ? canAccessAdmin(user.role) : false;
  const isSuperAdmin = user?.role?.toLowerCase() === "super_admin";
  const isCompanyAdmin = user?.role?.toLowerCase() === "company_admin";

  const can = useCallback(
    (perm: keyof StaffPermissions): boolean => {
      if (!user) return false;
      if (canAccessAdmin(user.role)) return true;
      if (!isStaffRole(user.role)) return false;
      return staffPermissions?.[perm] === true;
    },
    [user, staffPermissions]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
        isCompanyAdmin,
        staffPermissions,
        permissionsError,
        can,
        refreshUser,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
