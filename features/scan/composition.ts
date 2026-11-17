import { api } from "@/api/client";
import {
  createReceiptApi,
  validateScanResponse,
  ReceiptApiError,
  receiptErrorMessage,
  receiptHttpError,
} from "@/api/receipts";
import { toast } from "@/components/base/toast/toast";
import { createReceiptWorkflow } from "@/features/scan/services/create-receipt-workflow";

// Concrete dependencies are assembled only at this feature composition boundary.
const receiptApi = createReceiptApi({
  request: api.request.bind(api),
  config: { ocrPath: "/ocr" },
  validate: validateScanResponse,
  httpError: receiptHttpError,
  invalidResponse: (message) => new ReceiptApiError(message),
});

export const receiptWorkflow = createReceiptWorkflow({
  api: receiptApi,
  errorMessage: receiptErrorMessage,
  notifyError: (title, message) => { toast.error(title, { description: message }); },
});

import { receiptStorageApi } from "@/api/composition";
import { apiErrorMessage } from "@/api/client";
const storage=receiptStorageApi;
export const receiptDependencies={workflow:receiptWorkflow,storage,describeError:(error:unknown)=>apiErrorMessage(error,"Could not save the receipt. Please try again."),notifyError:(message:string)=>toast.error(message),notifySaved:(pending:boolean)=>toast.success(pending?"Submitted for supervisor review.":"Scan and expenses saved.")};
