"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth/auth-provider";
import { Toaster } from "@/components/base/toast/toast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false }, mutations: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><AuthProvider>{children}<Toaster /></AuthProvider></QueryClientProvider>;
}
