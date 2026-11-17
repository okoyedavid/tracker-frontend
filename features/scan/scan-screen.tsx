"use client";

import { Toaster } from "@/components/base/toast/toast";
import { useReceiptScan } from "@/features/scan/hooks/use-receipt-scan";
import { ReceiptCamera } from "@/features/scan/components/receipt-camera";
import { ReceiptUpload } from "@/features/scan/components/receipt-upload";
import { RecognizedText } from "@/features/scan/components/recognized-text";
import { ReceiptReview } from "@/features/scan/components/receipt-review";
import { ReceiptEditor } from "@/features/scan/components/receipt-editor";
import { receiptDependencies } from "@/features/scan/composition";

export function ScanScreen() {
  const scan = useReceiptScan(receiptDependencies);
  return (
    <main className="flex-1 bg-background-full px-4 py-8 text-text-primary sm:px-6 sm:py-12">
      <Toaster />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">

          <h1 className="text-title-1-medium">Read a receipt</h1>

        </header>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          <ReceiptUpload {...scan} />
          <RecognizedText {...scan} />
        </div>
        {scan.reviewAvailable && <ReceiptReview {...scan} />}
      </div>
      <ReceiptEditor {...scan} />
      {scan.cameraOpen && <ReceiptCamera onClose={() => scan.setCameraOpen(false)} onCapture={scan.chooseFile} />}
    </main>
  );
}
