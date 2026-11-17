"use client";

import { RiDeleteBinLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { cx } from "@/utils/cx";
import { confidenceTone } from "@/features/scan/receipt-utils";
import type { useReceiptScan } from "@/features/scan/hooks/use-receipt-scan";

type Props = Pick<ReturnType<typeof useReceiptScan>, "editOpen" | "setEditOpen" | "draft" | "setDraft" | "saveDraft">;

export function ReceiptEditor({ editOpen, setEditOpen, draft, setDraft, saveDraft }: Props) {
  return (
    <Modal isOpen={editOpen} onOpenChange={setEditOpen} size="md" className="max-h-[min(88dvh,760px)]">
      <ModalHeader title="Edit recognized text"  />
      <ModalBody className="py-3">
        <div className="flex flex-col gap-3">
          {draft.map((line, index) => (
            <div key={index} className="flex items-end gap-2">
              <Input
                label={`Line ${index + 1}`}
                value={line.text}
                onChange={(value) => setDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, text: value } : item))}
                className="min-w-0 flex-1"
              />
              <span className={cx("mb-2 w-14 shrink-0 text-end text-body-2-medium tabular-nums", confidenceTone(line.confidencePercentage))}>{line.confidencePercentage === null ? "N/A" : `${line.confidencePercentage.toFixed(2)}%`}</span>
              <Button
                variant="ghost"
                size="small"
                iconOnly
                leadingIcon={RiDeleteBinLine}
                aria-label={`Remove line ${index + 1}`}
                onClick={() => setDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            </div>
          ))}
          {draft.length === 0 && <p className="py-4 text-body-regular text-text-secondary">No lines to edit.</p>}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
        <Button variant="primary" onClick={saveDraft}>Save</Button>
      </ModalFooter>
    </Modal>
  );
}
