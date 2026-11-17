"use client";
import { useQuery } from '@tanstack/react-query';
import { RiScanLine,RiShieldCheckLine,RiMailCheckLine } from '@remixicon/react';
import { useAuth } from '@/features/auth/auth-provider';
import { receiptStorageApi } from '@/api/composition';
import { apiErrorMessage } from '@/api/client';
import { Button,ButtonLink } from '@/components/base/buttons/button';
import { Table,TableBody,TableCell,TableColumn,TableHeader,TableRow } from '@/components/base/table/table';
import { Spinner } from '@/components/base/spinner/spinner';
import { ScanStatus } from '@/features/scans/scan-status';
import { formatNaira,formatReceiptDate } from '@/utils/format';
export function DashboardScreen(){
 const {user,can}=useAuth();
 const canViewScans=can('expenses:view')||can('expenses:view_own');
 const recent=useQuery({queryKey:['saved-scans',user?.id,1],queryFn:({signal})=>receiptStorageApi.list(1,signal),select:result=>result.data.slice(0,5),enabled:!!user&&canViewScans});
 if(!user)return null;
 const cards=[{label:'Role',value:user.role.name,detail:null,Icon:RiShieldCheckLine},{label:'Email',value:user.emailVerifiedAt?'Verified':'Unverified',detail:user.email,Icon:RiMailCheckLine}];
 return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 text-text-primary sm:px-6 sm:py-12"><header className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-title-1-semibold">Overview</h1>{can('receipts:scan')&&<ButtonLink href="/dashboard/scan" leadingIcon={RiScanLine}>Scan a receipt</ButtonLink>}</header>
 <div className="grid gap-4 sm:grid-cols-2">{cards.map(({label,value,detail,Icon})=><section key={label} className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6"><div className="flex items-center justify-between gap-2"><p className="text-body-medium text-text-secondary">{label}</p><Icon className="size-5 text-foreground-icon-tertiary" aria-hidden/></div><p className="text-title-2-medium">{value}</p>{detail&&<p className="break-words text-caption-1-regular text-text-tertiary"><bdi>{detail}</bdi></p>}</section>)}</div>
 {canViewScans&&<section className="flex min-w-0 flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-headline-medium">Recent scans</h2><ButtonLink href="/scans" variant="ghost">View all</ButtonLink></div>{recent.isPending?<div role="status" className="flex items-center gap-3 py-6"><Spinner/> Loading scans…</div>:recent.isError?<div role="alert" className="flex flex-col items-start gap-3"><p className="text-body-2-regular text-text-error-primary">{apiErrorMessage(recent.error,'Could not load recent scans.')}</p><Button variant="secondary" onClick={()=>void recent.refetch()}>Retry</Button></div>:<Table aria-label="Recent scans"><TableHeader><TableColumn isRowHeader>Receipt</TableColumn><TableColumn>Date</TableColumn><TableColumn>Category</TableColumn><TableColumn>Total</TableColumn><TableColumn>Status</TableColumn><TableColumn>Actions</TableColumn></TableHeader><TableBody items={recent.data??[]} renderEmptyState={()=><p className="p-6 text-text-secondary">No scans yet</p>}>{scan=><TableRow id={scan.id} textValue={scan.vendor}><TableCell><span className="text-body-medium">{scan.vendor}</span></TableCell><TableCell><span className="whitespace-nowrap">{formatReceiptDate(scan.date)}</span></TableCell><TableCell>{scan.categoryName}</TableCell><TableCell><span className="whitespace-nowrap tabular-nums">{formatNaira(scan.total)}</span></TableCell><TableCell><ScanStatus pending={scan.reviewStatus==='pending'}/></TableCell><TableCell><ButtonLink href={`/scans/${scan.id}`} variant="secondary" aria-label={`View scan from ${scan.vendor}`}>View</ButtonLink></TableCell></TableRow>}</TableBody></Table>}</section>}
 </main>;
}
