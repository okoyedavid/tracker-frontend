import type { ReactNode } from "react";
import { DashboardShell } from "@/features/dashboard/dashboard-shell";

// Authentication is resolved in the browser before protected children render.
export const instant = false;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
