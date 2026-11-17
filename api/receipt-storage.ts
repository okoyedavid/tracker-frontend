import type { AxiosInstance } from "axios";
import type { ScanResponse,OcrResponse } from "@/api/receipts";
import type { Category } from "@/api/tracker";
export type { Category } from "@/api/tracker";
export type SavedScan={id:string;vendor:string;date:string;total:string;imageUrl:string;reconciled:boolean;categoryId:string;categoryName:string;createdBy:string;createdByName:string;createdAt:string;reportMonthId:string|null;reviewStatus:"approved"|"pending";reviewReasons:string[];override:{approvedBy:string;reason:string;createdAt:string;originalTotal:string;confirmedTotal:string}|null;expenses:{id:string;title:string;cost:string;date:string;month:string}[]};
export type SaveReceipt={reviewToken:string;overrideReason?:string;requestId:string;categoryId:string;vendor:string;date:string;total:string;tax:string|null;discount:string|null;
  response:Omit<ScanResponse,"reviewToken"|"quality">;reviewedOcr:OcrResponse;expenses:{title:string;cost:string;sourceLineIndexes:number[]}[]};
export const createReceiptStorageApi=({request}:{request:AxiosInstance["request"]})=>({
  categories:async(signal?:AbortSignal)=>(await request<{data:Category[]}>({method:"GET",url:"/categories",signal})).data.data,
  list:async(page:number,signal?:AbortSignal)=>(await request<{data:SavedScan[];total:number;page:number;pageSize:number}>({method:"GET",url:"/scans",params:{page},signal})).data,
  get:async(id:string,signal?:AbortSignal)=>(await request<{data:SavedScan & {response:Omit<ScanResponse,"reviewToken"|"quality">;reviewedOcr:OcrResponse}}>({method:"GET",url:`/scans/${id}`,signal})).data.data,
  save:async(file:File,payload:SaveReceipt,signal:AbortSignal)=>{
    const form=new FormData();form.append("image",file,file.name);form.append("payload",JSON.stringify(payload));
    return (await request<{data:SavedScan}>({method:"POST",url:"/scans",data:form,signal,timeout:35000})).data.data;
  },
});
export type ReceiptStorageApi=ReturnType<typeof createReceiptStorageApi>;
