import type { AxiosInstance, AxiosResponse } from "axios";

export type Provider = "gemini" | "paddle";

export type OcrLine = {
  text: string;
  confidencePercentage: number | null;
  confidenceSource?: "model_estimate" | "provider";
  boundingBox?: [number, number][];
  boxHeight?: number;
};

export type OcrResponse = { text: string; model: string; lines: OcrLine[] };
export type ScanResponse = {
  reviewToken: string;
  quality: {threshold:number;unreadLineIndexes:number[];missingTotal:boolean};
  ocr: OcrResponse;
  fields: { vendor: string | null; date: string | null; total: number | null };
  expenses: {
    title: string;
    cost: number | null;
    sourceLineIndexes: number[];
  }[];
  adjustments: {
    tax: number | null;
    discount: number | null;
    currency: string | null;
  };
  needsReview: true;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateOcrResponse(value: unknown): OcrResponse {
  if (
    !isRecord(value) ||
    typeof value.text !== "string" ||
    typeof value.model !== "string" ||
    !Array.isArray(value.lines) ||
    value.lines.some((line: unknown) => {
      if (!isRecord(line) || typeof line.text !== "string") return true;
      const confidence = line.confidencePercentage;
      if (
        confidence !== null &&
        (!isFiniteNumber(confidence) || confidence < 0 || confidence > 100)
      )
        return true;
      if (
        line.boxHeight !== undefined &&
        (!isFiniteNumber(line.boxHeight) || line.boxHeight < 0)
      )
        return true;
      if (
        line.boundingBox !== undefined &&
        (!Array.isArray(line.boundingBox) ||
          line.boundingBox.some(
            (point: unknown) =>
              !Array.isArray(point) ||
              point.length !== 2 ||
              !point.every(isFiniteNumber),
          ))
      )
        return true;
      return false;
    })
  )
    throw new Error("The OCR response was invalid. Please scan again.");
  // Validate without projecting fields: retain geometry and other backend metadata.
  return value as OcrResponse;
}

export function validateScanResponse(value: unknown): ScanResponse {
  if (
    !isRecord(value) ||
    !isRecord(value.fields) ||
    value.needsReview !== true || typeof value.reviewToken !== "string" || !isRecord(value.quality) || !Array.isArray(value.quality.unreadLineIndexes) || typeof value.quality.missingTotal !== "boolean"
  ) {
    throw new Error("The receipt response was invalid. Please scan again.");
  }
  validateOcrResponse(value.ocr);
  const { vendor, date, total } = value.fields;
  if (
    (vendor !== null && typeof vendor !== "string") ||
    (date !== null && typeof date !== "string") ||
    (total !== null && !isFiniteNumber(total))
  )
    throw new Error("The receipt response was invalid. Please scan again.");
  const expenses = value.expenses;
  const adjustments = value.adjustments;
  if (
    !Array.isArray(expenses) ||
    expenses.some(
      (item) =>
        !isRecord(item) ||
        typeof item.title !== "string" ||
        (item.cost !== null && (!isFiniteNumber(item.cost) || item.cost < 0)) ||
        !Array.isArray(item.sourceLineIndexes) ||
        item.sourceLineIndexes.some(
          (index) => !Number.isInteger(index) || Number(index) < 0,
        ),
    ) ||
    !isRecord(adjustments)
  )
    throw new Error("The expense extraction response was invalid.");
  for (const key of ["tax", "discount"])
    if (
      adjustments[key] !== null &&
      (!isFiniteNumber(adjustments[key]) || Number(adjustments[key]) < 0)
    )
      throw new Error("The receipt adjustments were invalid.");
  if (
    adjustments.currency !== null &&
    (typeof adjustments.currency !== "string" ||
      !/^[A-Z]{3}$/.test(adjustments.currency))
  )
    throw new Error("The receipt currency was invalid.");
  return value as ScanResponse;
}

export class ReceiptApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ReceiptApiError";
  }
}

const statusMessages: Record<number, string> = {
  400: "The selected provider or receipt input is invalid.",
  413: "This image exceeds the 10 MB upload limit.",
  415: "This image format is not supported.",
  429: "The selected provider's quota or rate limit has been reached.",
  502: "The provider could not process or validate this receipt.",
  503: "The selected provider is unavailable, unconfigured, or access was denied.",
  504: "The selected provider took too long to process this receipt.",
};

export function receiptHttpError(status: number, body: unknown) {
  const message =
    typeof body === "object" && body !== null && "message" in body
      ? body.message
      : null;
  return new ReceiptApiError(
    typeof message === "string" && message.trim()
      ? message
      : (statusMessages[status] ??
          "The receipt request failed. Please try again."),
    status,
  );
}

export function receiptErrorMessage(error: unknown) {
  return error instanceof ReceiptApiError
    ? error.message
    : "Could not reach the receipt service. Check your connection and try again.";
}

type Dependencies = {
  request: AxiosInstance["request"];
  config: { ocrPath: string };
  validate: (body: unknown) => ScanResponse;
  httpError: (status: number, body: unknown) => Error;
  invalidResponse: (message: string) => Error;
};

/** One combined OCR and field-extraction request through the shared transport. */
export function createReceiptApi({
  request,
  config,
  validate,
  httpError,
  invalidResponse,
}: Dependencies) {
  function readResponse<T>(
    response: AxiosResponse<unknown>,
    validate: (body: unknown) => T,
  ): T {
    // Axios parses JSON once and leaves non-JSON proxy errors as text.
    if (response.status < 200 || response.status >= 300) {
      throw httpError(response.status, response.data);
    }
    try {
      return validate(response.data);
    } catch (error) {
      throw invalidResponse(
        error instanceof Error
          ? error.message
          : "The receipt response was invalid.",
      );
    }
  }

  return {
    async readReceipt({
      file,
      provider,
      signal,
    }: {
      file: File;
      provider: Provider;
      signal: AbortSignal;
    }) {
      const params = new URLSearchParams({ model: provider });
      const response = await request<unknown>({
        url: `${config.ocrPath}?${params}`,
        method: "POST",
        headers: { "Content-Type": file.type, "x-filename": file.name },
        data: file,
        signal,
        validateStatus: () => true,
      });
      return readResponse(response, validate);
    },
  };
}

export type ReceiptApi = ReturnType<typeof createReceiptApi>;
