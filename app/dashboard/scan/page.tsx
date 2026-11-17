import { ScanScreen } from "@/features/scan/scan-screen";
import { PermissionGate } from "@/features/dashboard/dashboard-shell";
export const instant = false;
export default function ScanPage() { return <PermissionGate permission="receipts:scan"><ScanScreen /></PermissionGate>; }
