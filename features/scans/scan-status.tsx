import { cx } from "@/utils/cx";
export function ScanStatus({pending}:{pending:boolean}){return <span className={cx('inline-flex rounded-full px-3 py-1 text-caption-1-semibold',pending?'bg-status-yellow-background text-status-yellow-text':'bg-status-lime-background text-status-lime-text')}>{pending?'Pending review':'Approved'}</span>;}
