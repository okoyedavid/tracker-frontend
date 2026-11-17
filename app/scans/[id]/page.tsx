import { Suspense } from 'react';
import { ScanDetailsScreen } from '@/features/scans/scan-details-screen';
export const instant=false;
export default function Page(){return <Suspense fallback={<p className="p-8 text-text-secondary">Loading scan…</p>}><ScanDetailsScreen/></Suspense>;}
