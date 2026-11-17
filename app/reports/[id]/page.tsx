import { Suspense } from "react";
import { MonthScreen } from '@/features/reports/month-screen';
export const instant=false;
export default function Page(){return <Suspense fallback={<p className="p-8 text-text-secondary">Loading month…</p>}><MonthScreen/></Suspense>;}
