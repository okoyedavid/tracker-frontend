"use client";

import { RiScanLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { confidenceTone } from "@/features/scan/receipt-utils";
import type { useReceiptScan } from "@/features/scan/hooks/use-receipt-scan";

type Props = Pick<ReturnType<typeof useReceiptScan>, "lines" | "error" | "busy" | "ocrModel" | "recognizedText" | "openEditor">;

export function RecognizedText({ lines, error, busy, ocrModel, recognizedText, openEditor }: Props) {
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Recognized text">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RiScanLine aria-hidden className="size-5 text-foreground-icon-secondary" />
          <h2 className="text-headline-medium">Recognized text</h2>
        </div>
        {lines !== null && lines.length > 0 && (
          <Button variant="secondary" size="small" onClick={openEditor} disabled={busy}>Edit</Button>
        )}
      </div>
      {error && <p role="alert" className="rounded-xl border border-border-error-default bg-background-secondary-default p-3 text-body-2-regular text-text-error-primary">{error}</p>}
      {lines?.some(line => line.confidenceSource === "model_estimate") && <p className="text-caption-1-regular text-text-tertiary">Gemini confidence is an estimate.</p>}
      {ocrModel && <p className="text-body-2-regular text-text-tertiary">Recognized with {ocrModel}</p>}
      {lines === null ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-3xl border border-border-button-default bg-background-secondary-default p-6 text-center">
          <p className="text-body-medium text-text-secondary">No text yet</p>

        </div>
      ) : lines.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-border-button-default bg-background-secondary-default p-6 text-center">
          <p className="text-body-medium text-text-secondary">No text was recognized on this image.</p>
        </div>
      ) : (
        <ol className="divide-y divide-separator-border overflow-hidden rounded-3xl border border-border-button-default bg-background-secondary-default">
          {lines.map((line, index) => (
            <li key={`${index}-${line.originalText ?? line.text}`} className="flex items-start justify-between gap-4 p-4">
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-body-regular text-text-primary">{line.text || <span className="text-text-tertiary">Empty line</span>}</p>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={cx("text-body-2-medium tabular-nums", confidenceTone(line.confidencePercentage))}>{line.confidencePercentage === null ? "N/A" : `${line.confidencePercentage.toFixed(2)}%`}</span>
                {(line.confidencePercentage===null||line.confidencePercentage<60)&&<span className="text-caption-1-medium text-text-error-primary">Unread · line {index+1}</span>}
                {line.originalText !== undefined && line.text !== line.originalText && <span className="text-caption-1-medium text-text-tertiary">Edited</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
      {recognizedText !== null && (
        <details className="rounded-3xl border border-border-button-default bg-background-secondary-default p-4">
          <summary className="cursor-pointer text-body-medium text-text-secondary">Full recognized text</summary>
          <pre className="mt-3 whitespace-pre-wrap break-words text-body-2-regular text-text-primary">{recognizedText}</pre>
        </details>
      )}
    </section>
  );
}
