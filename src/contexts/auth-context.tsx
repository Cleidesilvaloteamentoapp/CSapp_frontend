"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { MeResponse, StaffPermissions } from "@/types";
import { getMe, logout as authLogout, canAccessAdmin, getStaffPermissions } from "@/lib/auth";

interface AuthContextType {
  user: MeResponse | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  staffPermissions: StaffPermissions | null;
  can: (perm: keyof StaffPermissions) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      if (me?.role?.toLowerCase() === "staff" && me.id) {
        const perms = await getStaffPermissions(me.id);
        setStaffPermissions(perms);
      } else {
        setStaffPermissions(null);
      }
    } catch {
      setUser(null);
      setStaffPermissions(null);
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
    await authLogout();
  }, []);

  const isAdmin = user ? canAccessAdmin(user.role) : false;
  const isSuperAdmin = user?.role?.toLowerCase() === "super_admin";
  const isCompanyAdmin = user?.role?.toLowerCase() === "company_admin";

  const can = useCallback(
    (perm: keyof StaffPermissions): boolean => {
      if (!user) return false;
      if (["super_admin", "company_admin"].includes(user.role?.toLowerCase())) return true;
      if (user.role?.toLowerCase() !== "staff") return false;
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
