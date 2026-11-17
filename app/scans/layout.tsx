import { Suspense,type ReactNode } from 'react';
import { DashboardShell } from '@/features/dashboard/dashboard-shell';
export const instant=false;
export default function ScansLayout({children}:{children:ReactNode}){return <Suspense fallback={<p className="p-8 text-text-secondary">Loading scans…</p>}><DashboardShell>{children}</DashboardShell></Suspense>;}
