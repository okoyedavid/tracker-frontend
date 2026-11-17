"use client";

import { RiCameraLine, RiFileImageLine, RiScanLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { FileUpload } from "@/components/base/file-upload/file-upload";
import { Spinner } from "@/components/base/spinner/spinner";
import { Select, SelectItem } from "@/components/base/select/select";
import { MAX_BYTES, SUPPORTED_EXTENSIONS } from "@/features/scan/receipt-utils";
import type { useReceiptScan } from "@/features/scan/hooks/use-receipt-scan";

type Props = Pick<ReturnType<typeof useReceiptScan>, "file" | "previewUrl" | "openCamera" | "busy" | "chooseFile" | "readReceipt" | "selectedProvider" | "chooseProvider">;

export function ReceiptUpload({ file, previewUrl, openCamera, busy, chooseFile, readReceipt, selectedProvider, chooseProvider }: Props) {
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Receipt image">
      <div className="flex items-center gap-2">
        <RiFileImageLine aria-hidden className="size-5 text-foreground-icon-secondary" />
        <h2 className="text-headline-medium">Receipt image</h2>
      </div>
      <FileUpload
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
        allowedExtensions={SUPPORTED_EXTENSIONS}
        maxBytes={MAX_BYTES}
        onFileSelect={chooseFile}
        disabled={busy}
      />
      <Select
        label="OCR provider"
        selectedKey={selectedProvider}
        onSelectionChange={(key) => {
          if (key === "gemini" || key === "paddle") chooseProvider(key);
        }}
        isDisabled={busy}
        className="w-full sm:max-w-xs"
      >
        <SelectItem id="gemini" textValue="Gemini">Gemini</SelectItem>
        <SelectItem id="paddle" textValue="Paddle">Paddle</SelectItem>
      </Select>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          leadingIcon={RiScanLine}
          disabled={!file || busy}
          onClick={readReceipt}
        >
          Scan receipt
        </Button>
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          leadingIcon={RiCameraLine}
          disabled={busy}
          onClick={openCamera}
        >
          Use camera
        </Button>
      </div>
      {busy && (
        <p className="flex items-center gap-2 text-body-medium text-text-secondary" role="status">
          <Spinner size="sm" aria-hidden />
          Reading receipt&#8230;
        </p>
      )}
      {previewUrl ? (
        <div className="overflow-hidden rounded-3xl border border-border-button-default bg-background-secondary-default p-2">
          {/* Native image preview keeps the original receipt dimensions. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={`Preview of ${file?.name ?? "selected receipt"}`} className="max-h-[560px] w-full rounded-2xl object-contain" />
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-border-button-default bg-background-secondary-default p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-background-tertiary-default text-foreground-icon-secondary"><RiFileImageLine aria-hidden className="size-6" /></span>
          <p className="text-body-medium text-text-secondary">No image selected</p>
        </div>
      )}
      <p className="text-body-2-regular text-text-tertiary">Images up to 10 MB. JPEG, PNG, WebP, HEIC, or HEIF.</p>
    </section>
  );
}
