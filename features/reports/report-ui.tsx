"use client";
import { usePathname } from 'next/navigation';
import { ButtonLink } from '@/components/base/buttons/button';
import { useAuth } from '@/features/auth/auth-provider';
import { cx } from '@/utils/cx';
export const reportPanel='flex min-w-0 flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6';
export const reportPage='mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-8 text-text-primary sm:px-6 sm:py-12';
export function monthLabel(value:string){return new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'Africa/Lagos'}).format(new Date(`${value}-01T12:00:00Z`));}
export {formatNaira as moneyLabel} from '@/utils/format';
export function ReportsNav(){
 const path=usePathname(),auth=useAuth();
 const selected=path==='/reports/review'?'review':path.endsWith('/categories')?'categories':'months';
 const items=[...(auth.can('reports:view')?[{id:'months',label:'Months',href:'/reports'},{id:'categories',label:'Category spending',href:'/reports/categories'}]:[]),...(auth.user?.role.type==='system'&&auth.user.role.key==='supervisor'&&auth.can('expenses:approve')?[{id:'review',label:'Pending reviews',href:'/reports/review'}]:[])];
 return <nav aria-label="Report navigation" className="flex flex-wrap gap-2 border-b border-separator-border pb-4">{items.map(item=><ButtonLink key={item.id} href={item.href} variant="ghost" aria-current={selected===item.id?'page':undefined} className={cx('rounded-xl',selected===item.id&&'bg-sidebar-selected-background text-text-white hover:bg-sidebar-selected-background')}>{item.label}</ButtonLink>)}</nav>;
}
