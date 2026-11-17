"use client";
import Image from 'next/image';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { receiptStorageApi } from '@/api/composition';
import { apiErrorMessage } from '@/api/client';
import { useAuth } from '@/features/auth/auth-provider';
import { Button,ButtonLink } from '@/components/base/buttons/button';
import { Table,TableBody,TableCell,TableColumn,TableHeader,TableRow } from '@/components/base/table/table';
import { Spinner } from '@/components/base/spinner/spinner';
import { formatNaira,formatReceiptDate } from '@/utils/format';
import { ScanStatus } from './scan-status';
const pageStyle='mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-8 text-text-primary sm:px-6 sm:py-12';

export function ScansScreen(){
 const auth=useAuth();const [page,setPage]=useState(1);const canView=auth.can('expenses:view')||auth.can('expenses:view_own');
 const scans=useQuery({queryKey:['saved-scans',auth.user?.id,page],queryFn:({signal})=>receiptStorageApi.list(page,signal),enabled:!!auth.user&&canView});
 if(!canView)return <main className={pageStyle}><h1 className="text-title-2-medium">Access restricted</h1><p>Your role cannot view saved scans.</p></main>;
 return <main className={pageStyle}><header className="flex flex-wrap items-start justify-between gap-4"><div className="flex flex-col gap-2"><h1 className="text-title-1-semibold">Saved scans</h1></div>{auth.can('receipts:scan')&&<ButtonLink href="/dashboard/scan">Scan a receipt</ButtonLink>}</header>

 {scans.isPending?<div className="flex items-center gap-3"><Spinner/> Loading scans…</div>:scans.isError?<div role="alert" className="flex flex-col gap-4 rounded-3xl border border-border-button-default p-6"><p>{apiErrorMessage(scans.error,'Could not load saved scans.')}</p><Button variant="secondary" onClick={()=>void scans.refetch()}>Retry</Button></div>:<section className="flex min-w-0 flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-4 sm:p-6"><Table aria-label="Saved scans"><TableHeader><TableColumn isRowHeader>Receipt</TableColumn><TableColumn>Scan date</TableColumn><TableColumn>Category</TableColumn><TableColumn>Total</TableColumn><TableColumn>Status</TableColumn><TableColumn>Saved by</TableColumn><TableColumn>Actions</TableColumn></TableHeader><TableBody items={scans.data?.data??[]} renderEmptyState={()=><div className="flex flex-col gap-2 p-8 text-center"><p className="text-body-medium">No saved scans</p><p className="text-body-2-regular text-text-secondary">Confirm a receipt to save its image and expense rows.</p></div>}>{scan=><TableRow id={scan.id} textValue={scan.vendor}><TableCell><div className="flex min-w-40 items-center gap-3"><Image unoptimized src={scan.imageUrl} alt={`Receipt from ${scan.vendor}`} width={48} height={64} className="h-16 w-12 shrink-0 rounded-lg border border-border-button-default object-cover"/><div className="flex min-w-0 flex-col gap-1"><span className="text-body-medium">{scan.vendor}</span><span className="text-caption-1-regular text-text-secondary">{scan.expenses.length} {scan.expenses.length===1?'expense':'expenses'}</span></div></div></TableCell><TableCell><span className="whitespace-nowrap">{formatReceiptDate(scan.date)}</span></TableCell><TableCell>{scan.categoryName}</TableCell><TableCell><span className="whitespace-nowrap tabular-nums">{formatNaira(scan.total)}</span></TableCell><TableCell><ScanStatus pending={scan.reviewStatus==='pending'}/></TableCell><TableCell>{scan.createdByName}</TableCell><TableCell><ButtonLink href={`/scans/${scan.id}`} variant="secondary" aria-label={`View scan from ${scan.vendor}`}>View details</ButtonLink></TableCell></TableRow>}</TableBody></Table><div className="flex flex-wrap items-center justify-between gap-3"><Button variant="secondary" disabled={page===1||scans.isFetching} onClick={()=>setPage(value=>value-1)}>Previous</Button><p className="text-body-2-regular text-text-secondary">Page {page} · {scans.data?.total??0} scans</p><Button variant="secondary" disabled={page*25>=(scans.data?.total??0)||scans.isFetching} onClick={()=>setPage(value=>value+1)}>Next</Button></div></section>}
 </main>;
}
