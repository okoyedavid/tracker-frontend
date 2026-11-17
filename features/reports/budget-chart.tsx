"use client";
import { Pie,PieChart,ResponsiveContainer } from 'recharts';
import { moneyLabel } from './report-ui';
export function BudgetChart({percentage,spent,budget,verdict}:{percentage:string|null;spent:string;budget:string|null;verdict?:string}){
 const percent=percentage===null?null:Number(percentage);
 const status=verdict==='NEEDS APPROVAL'?'NEEDS APPROVAL':percentage===null?'NO BUDGET':verdict&&['ON TRACK','WATCH','OVER BUDGET'].includes(verdict)?verdict:percent!<=80?'ON TRACK':percent!<=100?'WATCH':'OVER BUDGET';
 const color=status==='NO BUDGET'?'var(--color-text-tertiary)':status==='ON TRACK'?'var(--color-status-lime-text)':status==='WATCH'?'var(--color-status-yellow-text)':'var(--color-status-rose-text)';
 const used=Math.min(100,Math.max(0,percent??0));
 const data=[{name:'Budget used',value:used,fill:color},{name:'Remaining',value:100-used,fill:'var(--color-background-tertiary-default)'}];
 return <div className="flex flex-col items-center gap-4"><div role="img" aria-label={percentage===null?'No budget set':`${percentage}% of monthly budget used. ${status}.`} className="relative mx-auto h-60 w-60 max-w-full"><div aria-hidden className="h-full w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={data} dataKey="value" innerRadius="74%" outerRadius="94%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}/></PieChart></ResponsiveContainer></div><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1"><span className="text-title-2-medium tabular-nums">{percentage===null?'—':`${percentage}%`}</span><span className="text-caption-1-regular text-text-secondary">{percentage===null?'No budget set':'of monthly budget'}</span></div></div><p className="text-body-medium" style={{color}}>{status}</p><p className="text-center text-body-2-regular text-text-secondary">{moneyLabel(spent)} spent<br/>{budget===null?"Monthly budget not set":`out of ${moneyLabel(budget)}`}</p></div>;
}
