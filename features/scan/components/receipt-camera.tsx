"use client";

import { useEffect, useRef, useState } from "react";
import { RiCameraLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Spinner } from "@/components/base/spinner/spinner";

export function ReceiptCamera({ onClose, onCapture }: { onClose: () => void; onCapture: (file: File) => void }) {
  return <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} size="lg">
    <ModalHeader title="Capture receipt" />
    <CameraPreview onClose={onClose} onCapture={onCapture} />
  </Modal>;
}

function CameraPreview({ onClose, onCapture }: { onClose: () => void; onCapture: (file: File) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const mounted = useRef(false);
  const captureLock = useRef(false);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access requires HTTPS or localhost and a supported browser.");
        }
        const media = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (cancelled) { media.getTracks().forEach(track => track.stop()); return; }
        stream.current = media;
        const element = video.current;
        if (!element) { media.getTracks().forEach(track => track.stop()); return; }
        element.srcObject = media;
        await element.play();
      } catch (cause) {
        stream.current?.getTracks().forEach(track => track.stop());
        stream.current = null;
        if (cancelled) return;
        const name = cause instanceof Error ? cause.name : "";
        setError(name === "NotAllowedError" ? "Camera permission denied. Allow camera access in your browser and try again."
          : name === "NotFoundError" ? "No camera found. Connect a camera or upload an image."
          : name === "NotReadableError" ? "Camera unavailable. Close other apps using it and try again."
          : cause instanceof Error ? cause.message : "Could not open the camera.");
      }
    }
    void start();
    return () => {
      cancelled = true;
      mounted.current = false;
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;
    };
  }, []);

  async function capture() {
    const element = video.current;
    if (!element || !ready || captureLock.current || !element.videoWidth || !element.videoHeight) return;
    captureLock.current = true;
    setCapturing(true);
    try {
      const scale = Math.min(1, 2400 / Math.max(element.videoWidth, element.videoHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(element.videoWidth * scale);
      canvas.height = Math.round(element.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not capture the image. Try again.");
      context.drawImage(element, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!mounted.current) return;
      if (!blob) throw new Error("Could not capture the image. Try again.");
      onCapture(new File([blob], `receipt-${Date.now()}.jpg`, { type: "image/jpeg" }));
      onClose();
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "Could not capture the image.");
    } finally {
      captureLock.current = false;
      if (mounted.current) setCapturing(false);
    }
  }

  return <>
    <ModalBody>
      <div className="flex flex-col gap-4">
        <video ref={video} autoPlay muted playsInline aria-label="Live camera preview" className="max-h-[60vh] w-full rounded-xl bg-background-secondary-default object-contain" onPlaying={() => setReady(true)} />
        {!ready && !error && <p role="status" className="flex items-center gap-2"><Spinner size="sm" /> Opening camera…</p>}
        {error && <p role="alert" className="text-body-2-regular text-text-error-primary">{error}</p>}
      </div>
    </ModalBody>
    <ModalFooter>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button leadingIcon={RiCameraLine} disabled={!ready || capturing} onClick={() => void capture()}>{capturing ? "Capturing…" : "Capture photo"}</Button>
    </ModalFooter>
  </>;
}
