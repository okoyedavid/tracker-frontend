import type { AxiosInstance } from 'axios';
import type { SavedScan } from '@/api/receipt-storage';
import type { ScanResponse,OcrResponse } from '@/api/receipts';
export type MonthlySummary={month:string;categories:{categoryId:string;category:string;total:string;scanCount:number;expenseSubtotal:string;expenseCount:number;percentage:string|null;budgetVerdict:string}[];total:string;expenseSubtotal:string;budget:string|null;percentage:string|null;
  budgetVerdict:string;verdict:string;approvalLimit:string;pending:{id:string;vendor:string;total:string;reasons:string[];imageUrl:string}[];highExpenses:{scanId:string;title:string;cost:string;vendor:string}[]};
export type ReportMonth={id:string;month:string;budget:string|null;approvalLimit:string;createdBy:string;updatedBy:string;createdAt:string;updatedAt:string};
export type MonthList={data:(ReportMonth & {spent:string})[];total:number;page:number;pageSize:number};
export type MonthDetail=ReportMonth & {summary:MonthlySummary};
export type CreateMonths={startMonth:string;endMonth?:string;budget:string|null;approvalLimit:string};
export type ReviewScan=SavedScan & {response:Omit<ScanResponse,'reviewToken'|'quality'>;reviewedOcr:OcrResponse;date:string;createdBy:string};
export const createReportsApi=({request}:{request:AxiosInstance['request']})=>({
  months:async(page:number,signal?:AbortSignal)=>(await request<MonthList>({method:'GET',url:'/reports/months',params:{page},signal})).data,
  month:async(id:string,signal?:AbortSignal)=>(await request<{data:MonthDetail}>({method:'GET',url:`/reports/months/${id}`,signal})).data.data,
  createMonths:async(data:CreateMonths)=>(await request<{data:ReportMonth[];created:number;skipped:number}>({method:'POST',url:'/reports/months',data})).data,
  updateMonth:async(id:string,data:{month?:string;budget?:string|null;approvalLimit?:string})=>(await request<{data:ReportMonth}>({method:'PATCH',url:`/reports/months/${id}`,data})).data.data,
  pending:async(page:number,signal?:AbortSignal)=>(await request<{data:SavedScan[]}>({method:'GET',url:'/scans/pending',params:{page},signal})).data.data,
  scan:async(id:string,signal?:AbortSignal)=>(await request<{data:ReviewScan}>({method:'GET',url:`/scans/${id}`,signal})).data.data,
  override:async(id:string,data:{reason:string;total:string})=>(await request<{data:SavedScan}>({method:'PATCH',url:`/scans/${id}/override`,data})).data.data,
});
