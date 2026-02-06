"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { MeResponse } from "@/types";
import { getMe, logout as authLogout, canAccessAdmin, getDefaultRedirect } from "@/lib/auth";

interface AuthContextType {
  user: MeResponse | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      console.log("[AuthProvider] getMe result:", me ? { role: me.role, email: me.email } : null);
      setUser(me);
    } catch {
      console.log("[AuthProvider] getMe failed");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogout = useCallback(async () => {
    setUser(null);
    await authLogout();
  }, []);

  const isAdmin = user ? canAccessAdmin(user.role) : false;
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
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
