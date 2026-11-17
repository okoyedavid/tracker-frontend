"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { trackerApi } from "@/api/composition";
import type { User } from "@/api/tracker";

const userKey = ["auth", "me"] as const;
type Auth = { user: User | null; loading: boolean; error: unknown; can: (permission: string) => boolean;
  login: (input: { email: string; password: string }) => Promise<void>; logout: () => Promise<void>;
  reload: () => Promise<unknown>; setUser: (user: User) => void; clear: () => void };
const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const current = useQuery({ queryKey: userKey, queryFn: async () => {
    try { return await trackerApi.me(); }
    catch (error) {
      if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) return null;
      throw error;
    }
  }, retry: false, staleTime: 30_000 });
  const clear = () => { cache.removeQueries({ predicate: query => query.queryKey[0] !== "auth" }); cache.setQueryData(userKey, null); };
  useEffect(() => {
    const expired = () => { cache.removeQueries({ predicate: query => query.queryKey[0] !== "auth" }); cache.setQueryData(userKey, null); };
    window.addEventListener("auth:expired", expired);
    return () => window.removeEventListener("auth:expired", expired);
  }, [cache]);
  const user = current.data ?? null;
  return <AuthContext.Provider value={{ user, loading: current.isPending, error: current.error,
    can: permission => !!user && user.role.permissions.includes(permission) && !user.role.deniedPermissions.includes(permission),
    login: async input => { const result = await trackerApi.login(input); cache.removeQueries({ predicate: query => query.queryKey[0] !== "auth" }); cache.setQueryData(userKey, result.user); },
    logout: async () => { await trackerApi.logout(); clear(); }, reload: current.refetch,
    setUser: value => cache.setQueryData(userKey, value), clear }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is required.");
  return auth;
}
