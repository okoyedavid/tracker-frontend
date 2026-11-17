"use client";
import { useEffect,useRef,useState } from "react";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import type { OcrLine,OcrResponse,Provider,ScanResponse } from "@/api/receipts";
import type { ReceiptStorageApi,SavedScan } from "@/api/receipt-storage";
import type { ReceiptWorkflow } from "@/features/scan/services/create-receipt-workflow";
import { MAX_BYTES,isSupportedImage,validIsoDate,normalizeExtractedDate } from "@/features/scan/receipt-utils";
import { useAuth } from "@/features/auth/auth-provider";

type EditableOcrLine=OcrLine & {originalText?:string};
type ExpenseRow={id:string;title:string;cost:string;sourceLineIndexes:number[]};
const isMoney=(value:string)=>/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/.test(value.trim());
const toCents=(value:string)=>{const [whole,fraction=""]=value.trim().split(".");return BigInt(whole!)*BigInt(100)+BigInt(fraction.padEnd(2,"0"));};
const showMoney=(value:bigint)=>`${value<BigInt(0)?"-":""}${(value<BigInt(0)?-value:value)/BigInt(100)}.${String((value<BigInt(0)?-value:value)%BigInt(100)).padStart(2,"0")}`;

export function useReceiptScan({workflow,storage,describeError,notifyError,notifySaved}:{workflow:ReceiptWorkflow;storage:ReceiptStorageApi;
  describeError:(error:unknown)=>string;notifyError:(message:string)=>void;notifySaved:(pending:boolean)=>void;}){
  const auth=useAuth(),cache=useQueryClient();
  const readMutation=useMutation({mutationFn:workflow.scan,retry:false,gcTime:0,networkMode:"always"});
  const categoriesQuery=useQuery({queryKey:["categories",auth.user?.id],queryFn:({signal})=>storage.categories(signal),enabled:!!auth.user});
  const [overrideReason,setOverrideReason]=useState("");
  const [originalResponse,setOriginalResponse]=useState<ScanResponse|null>(null);
  const canOverride=auth.user?.role.key==="supervisor"&&auth.user.role.type==="system"&&auth.can("expenses:approve");
  const [file,setFile]=useState<File|null>(null),[selectedProvider,setSelectedProvider]=useState<Provider>("gemini");
  const [previewUrl,setPreviewUrl]=useState<string|null>(null),[lines,setLines]=useState<EditableOcrLine[]|null>(null);
  const [recognizedText,setRecognizedText]=useState<string|null>(null),[ocrModel,setOcrModel]=useState<string|null>(null);
  const [reviewAvailable,setReviewAvailable]=useState(false),[vendor,setVendor]=useState(""),[date,setDate]=useState(""),[total,setTotal]=useState("");
  const [draft,setDraft]=useState<EditableOcrLine[]>([]),[reading,setReading]=useState(false),[error,setError]=useState<string|null>(null),[editOpen,setEditOpen]=useState(false);
  const [categoryId,setCategoryId]=useState(""),[expenseRows,setExpenseRows]=useState<ExpenseRow[]>([]);
  const [saving,setSaving]=useState(false),[savedScan,setSavedScan]=useState<SavedScan|null>(null),[saveError,setSaveError]=useState<string|null>(null);
  const [cameraOpen,setCameraOpen]=useState(false);
  const selectionVersion=useRef(0),processingLock=useRef(false),savingRef=useRef(false),previewUrlRef=useRef<string|null>(null);
  const activeRequest=useRef<AbortController|null>(null),mounted=useRef(true),requestId=useRef("");
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;activeRequest.current?.abort();if(previewUrlRef.current)URL.revokeObjectURL(previewUrlRef.current);};},[]);
  function reset(){setOverrideReason("");selectionVersion.current++;activeRequest.current?.abort();activeRequest.current=null;processingLock.current=false;setReading(false);setLines(null);setRecognizedText(null);setOcrModel(null);setReviewAvailable(false);setVendor("");setDate("");setTotal("");setDraft([]);setEditOpen(false);setError(null);setCategoryId("");setExpenseRows([]);setSavedScan(null);setSaveError(null);setOriginalResponse(null);requestId.current="";}
  function chooseFile(selected:File){
    if(savingRef.current)return;
    if(!isSupportedImage(selected)){setError("Choose a JPEG, PNG, WebP, HEIC, or HEIF image.");return;}
    if(selected.size>MAX_BYTES){setError("Choose an image up to 10 MB.");return;}
    reset();if(previewUrlRef.current)URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current=URL.createObjectURL(selected);setPreviewUrl(previewUrlRef.current);setFile(selected);
  }
  function chooseProvider(provider:Provider){if(processingLock.current||provider===selectedProvider)return;reset();setSelectedProvider(provider);}
  function displayOcr(data:OcrResponse){setRecognizedText(data.text);setOcrModel(data.model);setLines(data.lines.map(line=>({...line,originalText:line.text})));}
  function applyReview(data:ScanResponse){
    setOverrideReason("");setOriginalResponse(data);requestId.current=crypto.randomUUID();displayOcr(data.ocr);
    setVendor(data.fields.vendor??"");setDate(normalizeExtractedDate(data.fields.date));setTotal(data.fields.total===null?"":String(data.fields.total));
    setExpenseRows(data.expenses.map(item=>({id:crypto.randomUUID(),title:item.title,cost:item.cost===null?"":String(item.cost),sourceLineIndexes:item.sourceLineIndexes})));
    setSavedScan(null);setSaveError(null);setReviewAvailable(true);
  }
  async function readReceipt(){
    if(!file||processingLock.current)return;
    const controller=new AbortController(),version=++selectionVersion.current;
    activeRequest.current=controller;processingLock.current=true;setReading(true);setError(null);setReviewAvailable(false);setSavedScan(null);setLines(null);setRecognizedText(null);setOcrModel(null);
    const current=()=>mounted.current&&version===selectionVersion.current&&!controller.signal.aborted;
    try{const result=await readMutation.mutateAsync({file,provider:selectedProvider,signal:controller.signal});if(!current())return;if(result.status==="success")applyReview(result.data);if(result.status==="error")setError(result.message);}
    finally{if(current()){activeRequest.current=null;processingLock.current=false;setReading(false);}}
  }
  function openEditor(){setDraft((lines??[]).map(line=>({...line})));setEditOpen(true);}
  function saveDraft(){setLines(draft.map(line=>({...line})));setEditOpen(false);}
  function updateExpense(id:string,patch:Partial<Pick<ExpenseRow,"title"|"cost">>){setExpenseRows(current=>current.map(item=>item.id===id?{...item,...patch}:item));}
  function addExpense(){setExpenseRows(current=>[...current,{id:crypto.randomUUID(),title:"",cost:"",sourceLineIndexes:[]}]);}
  function removeExpense(id:string){setExpenseRows(current=>current.filter(item=>item.id!==id));}
  const tax=originalResponse?.adjustments.tax==null?"":originalResponse.adjustments.tax.toFixed(2);
  const discount=originalResponse?.adjustments.discount==null?"":originalResponse.adjustments.discount.toFixed(2);
  const reviewValid=!!vendor.trim()&&vendor.trim().length<=200&&validIsoDate(date)&&isMoney(total)&&Number(total)>0&&!!categoryId&&
    expenseRows.length>0&&expenseRows.every(item=>!!item.title.trim()&&item.title.trim().length<=200&&isMoney(item.cost));
  const reconciliation=expenseRows.length&&expenseRows.every(item=>isMoney(item.cost))&&isMoney(total)&&(!tax.trim()||isMoney(tax))&&(!discount.trim()||isMoney(discount))?(()=>{
    const subtotal=expenseRows.reduce((sum,item)=>sum+toCents(item.cost),BigInt(0)),calculated=subtotal+(tax.trim()?toCents(tax):BigInt(0))-(discount.trim()?toCents(discount):BigInt(0));
    return {subtotal:showMoney(subtotal),calculated:showMoney(calculated),total:showMoney(toCents(total)),matches:calculated===toCents(total)};
  })():null;
  const quality=originalResponse?.quality;
  const unreadLineIndexes=(quality?.unreadLineIndexes??[]).filter(index=>!lines?.[index]?.text.trim()||lines[index]?.text===originalResponse?.ocr.lines[index]?.text);
  const needsQualityReview=!!quality?.missingTotal||unreadLineIndexes.length>0;
  const overrideValid=!overrideReason.trim()||(canOverride&&overrideReason.trim().length>=5&&overrideReason.trim().length<=1000);
  const canSave=auth.can("expenses:create");
  async function confirmReview(){
    if(!reviewValid||!overrideValid||!canSave||!file||!originalResponse||!ocrModel||!lines||processingLock.current||savedScan)return;
    const controller=new AbortController();activeRequest.current=controller;savingRef.current=true;processingLock.current=true;setSaving(true);setSaveError(null);
    try{
      const saved=await storage.save(file,{reviewToken:originalResponse.reviewToken,...(overrideReason.trim()?{overrideReason:overrideReason.trim()}:{}),requestId:requestId.current,categoryId,vendor:vendor.trim(),date,total:total.trim(),tax:tax.trim()||null,discount:discount.trim()||null,
        response:{ocr:originalResponse.ocr,fields:originalResponse.fields,expenses:originalResponse.expenses,adjustments:originalResponse.adjustments,needsReview:true},reviewedOcr:{...originalResponse.ocr,model:ocrModel,text:lines.map(line=>line.text).join("\n"),lines:lines.map(line=>{const snapshot={...line};delete snapshot.originalText;return snapshot;})},
        expenses:expenseRows.map(item=>({title:item.title.trim(),cost:item.cost.trim(),sourceLineIndexes:item.sourceLineIndexes}))},controller.signal);
      if(!mounted.current)return;setSavedScan(saved);notifySaved(saved.reviewStatus==="pending");await Promise.all([cache.invalidateQueries({queryKey:["saved-scans"]}),cache.invalidateQueries({queryKey:["monthly-summary"]}),cache.invalidateQueries({queryKey:["report-month"]}),cache.invalidateQueries({queryKey:["report-months"]}),cache.invalidateQueries({queryKey:["pending-scans"]})]);
    }catch(cause){if(!mounted.current||controller.signal.aborted)return;const message=describeError(cause);setSaveError(message);notifyError(message);}
    finally{savingRef.current=false;processingLock.current=false;activeRequest.current=null;if(mounted.current)setSaving(false);}
  }
  return {file,previewUrl,lines,recognizedText,ocrModel,reviewAvailable,vendor,date,total,draft,error,editOpen,cameraOpen,setCameraOpen,openCamera:()=>{if(!processingLock.current)setCameraOpen(true);},selectedProvider,chooseProvider,chooseFile,readReceipt,
    openEditor,saveDraft,reviewValid,confirmReview,busy:reading||saving,setVendor,setDate,setTotal,setDraft,setEditOpen,
    quality,unreadLineIndexes,needsQualityReview,canOverride,overrideReason,setOverrideReason,overrideValid,
    categoryId,setCategoryId,expenseRows,updateExpense,addExpense,removeExpense,reconciliation,saving,savedScan,saveError,
    categories:categoriesQuery.data??[],categoriesLoading:categoriesQuery.isPending,categoryError:categoriesQuery.error?describeError(categoriesQuery.error):null,
    reloadCategories:()=>{void categoriesQuery.refetch();},canSave,
  };
}
