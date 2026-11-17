"use client";
import { RiAddLine,RiDeleteBinLine,RiCheckLine } from "@remixicon/react";
import { Button,ButtonLink } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select,SelectItem } from "@/components/base/select/select";
import { Spinner } from "@/components/base/spinner/spinner";
import type { useReceiptScan } from "@/features/scan/hooks/use-receipt-scan";

type Props=ReturnType<typeof useReceiptScan>;
export function ReceiptReview(scan:Props){
  const locked=scan.saving||!!scan.savedScan;
  return <section className="flex flex-col gap-6 rounded-3xl border border-border-button-default bg-background-secondary-default p-5 sm:p-6" aria-label="Review receipt details">
    <div className="flex flex-col gap-2"><h2 className="text-headline-medium text-text-primary">Review receipt details</h2></div>
    {scan.needsQualityReview&&!scan.savedScan&&<div role="alert" className="flex flex-col gap-3 rounded-xl border border-border-button-default bg-background-tertiary-default p-4"><p className="text-body-medium">{scan.quality?.missingTotal?"Could not read Total — retake photo or enter the correct total.":"Some OCR lines are unread."}</p><p className="text-body-2-regular text-text-secondary">{scan.unreadLineIndexes.length?`Lines ${scan.unreadLineIndexes.map(index=>index+1).join(", ")} have confidence below 60% or unavailable confidence. Correct them in the text editor, retake, or submit for Supervisor review.`:"A Supervisor must approve the manually entered total."} Pending scans are excluded from spending totals.</p><Button variant="secondary" className="self-start" disabled={locked} onClick={scan.openCamera}>Retake photo</Button></div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Input label="Vendor" value={scan.vendor} onChange={scan.setVendor} isRequired isDisabled={locked}/>
      <Input label="Date" type="date" value={scan.date} onChange={scan.setDate} isRequired isDisabled={locked}/>
      <Input label="Total" type="number" inputMode="decimal" min="0.01" step="0.01" value={scan.total} onChange={scan.setTotal} isRequired isDisabled={locked}/>
      <Select label="Category" placeholder={scan.categoriesLoading?"Loading categories…":"Select category"} selectedKey={scan.categoryId||null} onSelectionChange={key=>scan.setCategoryId(key===null?"":String(key))} isRequired isDisabled={locked||scan.categoriesLoading}>
        {scan.categories.map(category=><SelectItem id={category.id} key={category.id} textValue={category.name}>{category.name}</SelectItem>)}
      </Select>
    </div>
    {scan.categoryError&&<div role="alert" className="flex flex-wrap items-center gap-3 text-body-2-regular text-text-error-primary">{scan.categoryError}<Button variant="secondary" onClick={scan.reloadCategories}>Retry categories</Button></div>}
    {!scan.categoriesLoading&&!scan.categories.length&&!scan.categoryError&&<p className="text-body-2-regular text-text-secondary">No categories available.</p>}
    <div className="flex flex-col gap-2 border-t border-separator-border pt-5"><h3 className="text-headline-medium text-text-primary">Expenses</h3></div>
    <div className="flex flex-col gap-4">
      {scan.expenseRows.map((item,index)=><div key={item.id} className="grid items-end gap-3 rounded-2xl border border-border-button-default bg-background-primary-default p-4 sm:grid-cols-3">
        <Input label={`Expense ${index+1} title`} value={item.title} onChange={value=>scan.updateExpense(item.id,{title:value})} maxLength={200} isRequired isDisabled={locked}/>
        <Input label="Cost" type="number" inputMode="decimal" min="0" step="0.01" value={item.cost} onChange={value=>scan.updateExpense(item.id,{cost:value})} isRequired isDisabled={locked}/>
        <Button variant="ghost" leadingIcon={RiDeleteBinLine} disabled={locked} onClick={()=>scan.removeExpense(item.id)} aria-label={`Remove expense ${index+1}`}>Remove</Button>
      </div>)}
      {!scan.expenseRows.length&&<p className="text-body-regular text-text-secondary">No expenses found.</p>}
      <Button variant="secondary" leadingIcon={RiAddLine} className="self-start" disabled={locked||scan.expenseRows.length>=200} onClick={scan.addExpense}>Add expense</Button>
    </div>
    {scan.reconciliation&&<div className="flex flex-col gap-2 rounded-xl border border-border-button-default bg-background-primary-default p-4"><p className="text-body-medium text-text-primary">Expenses: {scan.reconciliation.subtotal} · Calculated total: {scan.reconciliation.calculated} · Invoice total: {scan.reconciliation.total}</p>{!scan.reconciliation.matches&&<p role="status" className="text-body-2-regular text-text-error-primary">Expense amounts do not match the invoice total.</p>}</div>}
    {scan.canOverride&&!scan.savedScan&&<Input label="Supervisor override reason (optional)" value={scan.overrideReason} onChange={scan.setOverrideReason} minLength={5} maxLength={1000} isDisabled={locked} hint="At least 5 characters to override review flags."/>}
    {scan.saveError&&<p role="alert" className="text-body-2-regular text-text-error-primary">{scan.saveError}</p>}
    <div className="flex flex-wrap items-center justify-between gap-4"><Button disabled={!scan.reviewValid||!scan.overrideValid||locked||!scan.canSave} onClick={()=>void scan.confirmReview()} leadingIcon={scan.savedScan?RiCheckLine:undefined}>{scan.saving?<><Spinner size="sm" aria-hidden/> Saving…</>:scan.savedScan?(scan.savedScan.reviewStatus==="pending"?"Submitted":"Saved"):scan.overrideReason.trim()?"Approve and save":scan.needsQualityReview?"Submit for review":"Confirm details"}</Button></div>
    {!scan.canSave&&<p className="text-body-2-regular text-text-secondary">You don’t have permission to save scans.</p>}
    {scan.savedScan&&<div role="status" className="flex flex-col gap-2 rounded-xl border border-border-button-default bg-background-primary-default p-4"><p className="text-body-medium text-text-primary">{scan.savedScan.reviewStatus==="pending"?"Submitted for Supervisor review. Awaiting approval.":`Saved ${scan.savedScan.expenses.length} approved expenses with this scan.`}</p>{scan.savedScan.reviewReasons.map(reason=><p key={reason} className="text-body-2-regular text-text-secondary">{reason}</p>)}{scan.savedScan.override&&<p className="text-body-2-regular text-text-secondary">Supervisor override recorded: {scan.savedScan.override.reason}</p>}<ButtonLink href={`/scans/${scan.savedScan.id}`} variant="secondary" className="self-start">View saved scan</ButtonLink><p className="break-all text-caption-1-regular text-text-secondary">Scan ID: {scan.savedScan.id}</p><a href={scan.savedScan.imageUrl} target="_blank" rel="noreferrer" className="text-body-medium text-accent-600">View saved receipt image</a></div>}
  </section>;
}
