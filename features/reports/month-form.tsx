"use client";
import { useState,type FormEvent } from 'react';
import { MonthPicker } from './month-picker';
import { reportsApi } from '@/api/composition';
import { apiErrorMessage } from '@/api/client';
import type { ReportMonth } from '@/api/reports';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { toast } from '@/components/base/toast/toast';
const validMoney=(value:string)=>/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/.test(value);
export function MonthForm({bulk=false,record,done,cancel}:{bulk?:boolean;record?:ReportMonth;done:()=>Promise<void>;cancel:()=>void}){
 const [startMonth,setStart]=useState(()=>{if(record)return record.month;const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;}),[endMonth,setEnd]=useState(''),[budget,setBudget]=useState(record?.budget??''),[approvalLimit,setLimit]=useState(record?.approvalLimit??'500.00'),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const monthIndex=(value:string)=>Number(value.slice(0,4))*12+Number(value.slice(5,7));
 const monthValid=(value:string)=>/^\d{4}-(0[1-9]|1[0-2])$/.test(value)&&Number(value.slice(0,4))>=2000;
 const rangeLength=bulk&&endMonth?monthIndex(endMonth)-monthIndex(startMonth)+1:1;
 const valid=(monthValid(startMonth)&&(!bulk||monthValid(endMonth)&&rangeLength>=1&&rangeLength<=120))&&(!budget||validMoney(budget)&&Number(budget)>0)&&validMoney(approvalLimit);
 async function submit(event:FormEvent){event.preventDefault();if(busy||!valid)return;setBusy(true);setError(null);try{if(record){await reportsApi.updateMonth(record.id,{month:startMonth,budget:budget||null,approvalLimit});toast.success('Month details updated.');}else{const result=await reportsApi.createMonths({startMonth,...(bulk?{endMonth}:{}),budget:budget||null,approvalLimit});toast.success(`${result.created} ${result.created===1?'month':'months'} added.`,{description:result.skipped?`${result.skipped} existing months kept unchanged.`:undefined});}await done();}catch(cause){const message=apiErrorMessage(cause,'Could not save the month.');setError(message);toast.error(message);}finally{setBusy(false);}}
 return <form onSubmit={submit} className="flex flex-col gap-5"><><MonthPicker label={bulk?'From month':'Month'} value={startMonth} onChange={setStart} disabled={busy}/>{bulk&&<MonthPicker label="Through month (inclusive)" value={endMonth} onChange={setEnd} disabled={busy}/>}</><Input label={bulk?'Budget for each month (optional)':'Monthly budget (optional)'} type="number" min="0.01" step="0.01" value={budget} onChange={setBudget} isDisabled={busy}/><Input label={bulk?'Approval limit for each month':'Expense approval limit'} type="number" min="0" step="0.01" value={approvalLimit} onChange={setLimit} isRequired isDisabled={busy} hint="Expenses above this amount need approval."/>{bulk&&monthValid(endMonth)&&rangeLength>=1&&rangeLength<=120&&<p className="text-body-2-regular text-text-secondary">{rangeLength} {rangeLength===1?'month':'months'} selected. Existing months are skipped. Maximum: 120.</p>}{error&&<p role="alert" className="text-body-2-regular text-text-error-primary">{error}</p>}<div className="flex justify-end gap-3"><Button variant="secondary" disabled={busy} onClick={cancel}>Cancel</Button><Button type="submit" disabled={busy||!valid}>{busy?'Saving…':record?'Save changes':bulk?'Add months':'Add month'}</Button></div></form>;
}
