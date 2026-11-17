"use client";
import { Input } from '@/components/base/input/input';
import { Select,SelectItem } from '@/components/base/select/select';
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
export function MonthPicker({label,value,onChange,disabled=false}:{label:string;value:string;onChange:(value:string)=>void;disabled?:boolean}){
 const [year='',month='01']=value.split('-');
 return <div className="grid gap-3 sm:grid-cols-2"><Select label={label} selectedKey={month||'01'} onSelectionChange={key=>{if(key!==null)onChange(`${year}-${key}`);}} isRequired isDisabled={disabled}>{months.map((name,index)=><SelectItem key={name} id={String(index+1).padStart(2,'0')} textValue={name}>{name}</SelectItem>)}</Select><Input label={`${label} year`} value={year} onChange={next=>onChange(`${next.replace(/\D/g,'').slice(0,4)}-${month||'01'}`)} inputMode="numeric" maxLength={4} placeholder="2026" isRequired isDisabled={disabled}/></div>;
}
