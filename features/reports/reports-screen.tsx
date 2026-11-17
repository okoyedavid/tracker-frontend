"use client";
import { useState } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { RiAddLine,RiCalendarLine } from '@remixicon/react';
import { reportsApi } from '@/api/composition';
import { apiErrorMessage } from '@/api/client';
import { useAuth } from '@/features/auth/auth-provider';
import { Button,ButtonLink } from '@/components/base/buttons/button';
import { Table,TableBody,TableCell,TableColumn,TableHeader,TableRow } from '@/components/base/table/table';
import { Modal,ModalHeader,ModalBody } from '@/components/base/modal/modal';
import { Spinner } from '@/components/base/spinner/spinner';
import { MonthForm } from './month-form';
import { monthLabel,moneyLabel,reportPage,reportPanel } from './report-ui';
export function ReportsScreen({categories=false}:{categories?:boolean}){
 const auth=useAuth(),cache=useQueryClient();const [page,setPage]=useState(1),[adding,setAdding]=useState<'single'|'bulk'|null>(null);
 const canView=auth.can('reports:view'),canManage=auth.user?.role.key==='supervisor'&&auth.user.role.type==='system'&&auth.can('budgets:manage');
 const months=useQuery({queryKey:['report-months',auth.user?.id,page],queryFn:({signal})=>reportsApi.months(page,signal),enabled:!!auth.user&&canView});
 const added=async()=>{setAdding(null);setPage(1);await cache.invalidateQueries({queryKey:['report-months']});};
 if(!canView)return <main className={reportPage}><h1 className="text-title-2-medium">Access restricted</h1><p>You don’t have access to reports.</p></main>;
 return <main className={reportPage}><header className="flex flex-wrap items-start justify-between gap-4"><div className="flex flex-col gap-2"><h1 className="text-title-1-semibold">{categories?'Category spending':'Report months'}</h1></div>{canManage&&<div className="flex flex-wrap gap-2"><Button variant="secondary" leadingIcon={RiCalendarLine} onClick={()=>setAdding('bulk')}>Bulk add months</Button><Button leadingIcon={RiAddLine} onClick={()=>setAdding('single')}>Add month</Button></div>}</header>
 {months.isPending?<div className="flex items-center gap-3"><Spinner/> Loading months…</div>:months.isError?<div role="alert" className={reportPanel}><p>{apiErrorMessage(months.error,'Could not load months.')}</p><Button variant="secondary" onClick={()=>void months.refetch()}>Retry</Button></div>:<section className={reportPanel}><Table aria-label="Report months"><TableHeader><TableColumn isRowHeader>Month</TableColumn><TableColumn>Budget</TableColumn><TableColumn>Spent</TableColumn><TableColumn>Approval limit</TableColumn><TableColumn>Actions</TableColumn></TableHeader><TableBody items={months.data?.data??[]} renderEmptyState={()=><div className="flex flex-col gap-2 p-8 text-center"><p className="text-body-medium">No months added yet</p></div>}>{month=><TableRow id={month.id} textValue={monthLabel(month.month)}><TableCell><span className="whitespace-nowrap text-body-medium">{monthLabel(month.month)}</span></TableCell><TableCell><span className="whitespace-nowrap tabular-nums">{moneyLabel(month.budget)}</span></TableCell><TableCell><span className="whitespace-nowrap tabular-nums">{moneyLabel(month.spent)}</span></TableCell><TableCell><span className="whitespace-nowrap tabular-nums">{moneyLabel(month.approvalLimit)}</span></TableCell><TableCell><ButtonLink href={`/reports/${month.id}${categories?'/categories':''}`} variant="secondary" aria-label={`View ${monthLabel(month.month)}`}>View</ButtonLink></TableCell></TableRow>}</TableBody></Table><div className="flex flex-wrap items-center justify-between gap-3"><Button variant="secondary" disabled={page===1||months.isFetching} onClick={()=>setPage(value=>value-1)}>Previous</Button><p className="text-body-2-regular text-text-secondary">Page {page} · {months.data?.total??0} months</p><Button variant="secondary" disabled={page*25>=(months.data?.total??0)||months.isFetching} onClick={()=>setPage(value=>value+1)}>Next</Button></div></section>}
 <Modal isDismissable={false} isOpen={!!adding} onOpenChange={open=>{if(!open)setAdding(null);}} size="md"><ModalHeader title={adding==='bulk'?'Add a range of months':'Add a report month'} /><ModalBody>{adding&&<MonthForm key={adding} bulk={adding==='bulk'} done={added} cancel={()=>setAdding(null)}/>}</ModalBody></Modal>
 </main>;
}
