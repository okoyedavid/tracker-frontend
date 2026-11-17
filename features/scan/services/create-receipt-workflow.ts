import type { ReceiptApi, Provider } from "@/api/receipts";

type Dependencies = {
  api: ReceiptApi;
  notifyError: (title: string, message: string) => void;
  errorMessage: (error: unknown) => string;
};

export function createReceiptWorkflow({ api, notifyError, errorMessage }: Dependencies) {
  return {
    async scan(input: { file: File; provider: Provider; signal: AbortSignal }) {
      try {
        input.signal.throwIfAborted();
        const data = await api.readReceipt(input);
        input.signal.throwIfAborted();
        return { status: "success" as const, data };
      } catch (error) {
        if (input.signal.aborted) return { status: "cancelled" as const };
        const message = errorMessage(error);
        notifyError("Receipt reading failed", message);
        return { status: "error" as const, message };
      }
    },
  };
}

export type ReceiptWorkflow = ReturnType<typeof createReceiptWorkflow>;
