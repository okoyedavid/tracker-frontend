import { Suspense,type ReactNode } from 'react';
import { DashboardShell } from '@/features/dashboard/dashboard-shell';
import { ReportsNav } from '@/features/reports/report-ui';
import { Toaster } from '@/components/base/toast/toast';
export const instant=false;
export default function ReportsLayout({children}:{children:ReactNode}){return <Suspense fallback={<p className="p-8 text-text-secondary">Loading reports…</p>}><DashboardShell><Toaster/><div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6"><ReportsNav/></div>{children}</DashboardShell></Suspense>;}
