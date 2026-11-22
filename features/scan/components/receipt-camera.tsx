"use client";

import { useEffect, useRef, useState } from "react";
import { RiCameraLine, RiEdit2Line } from "@remixicon/react";
import type { Point, Quad } from "@quannqit/doc-scanner";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Spinner } from "@/components/base/spinner/spinner";

export function ReceiptCamera({ onClose, onCapture }: { onClose: () => void; onCapture: (file: File) => void }) {
  return <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} size="lg">
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
  const [corners, setCorners] = useState<Quad | null>(null);
  const [detectorReady, setDetectorReady] = useState(false);
  const [detectorError, setDetectorError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureCanvas, setCaptureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [autoCorners, setAutoCorners] = useState<Quad | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorCorners, setEditorCorners] = useState<Quad | null>(null);
  const [resetCorners, setResetCorners] = useState<Quad | null>(null);
  const [isCropped, setIsCropped] = useState(false);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [reviewPreviewUrl, setReviewPreviewUrl] = useState<string | null>(null);
  const dragCorner = useRef<number | null>(null);
  const editorSvg = useRef<SVGSVGElement>(null);
  const [cameraSize, setCameraSize] = useState({ width: 16, height: 9 });
  const cameraWidth = cameraSize.width;
  const cameraHeight = cameraSize.height;
  const cameraRatio = cameraWidth / cameraHeight;
  const detectorFrameHeight = Math.round(360 / cameraRatio);
  useEffect(() => {
    if (!originalFile) {
      setOriginalPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(originalFile);
    setOriginalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalFile]);

  useEffect(() => {
    if (!reviewFile) {
      setReviewPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(reviewFile);
    setReviewPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [reviewFile]);

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

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const source = video.current;
    const previewWidth = 360;
    const frame = document.createElement("canvas");
    const frameContext = frame.getContext("2d", { willReadFrequently: true });
    if (!source || !source.videoWidth || !source.videoHeight || !frameContext) return;
    const context = frameContext;

    frame.width = previewWidth;
    frame.height = Math.round(previewWidth * source.videoHeight / source.videoWidth);

    async function runDetector() {
      try {
        const { detectOnCanvas } = await import("@quannqit/doc-scanner");
        if (cancelled) return;
        setDetectorReady(true);

        const detectFrame = () => {
          if (cancelled || !source || source.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
          try {
            context.drawImage(source, 0, 0, frame.width, frame.height);
            setCorners(detectOnCanvas(frame, previewWidth)?.corners ?? null);
          } catch {
            setDetectorError(true);
          }
          timer = setTimeout(detectFrame, 180);
        };
        detectFrame();
      } catch {
        if (!cancelled) setDetectorError(true);
      }
    }

    void runDetector();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [ready]);

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
      const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: "image/jpeg" });
      const { detectOnCanvas, scanImage, canvasToBlob } = await import("@quannqit/doc-scanner");
      const detected = detectOnCanvas(canvas, 1000);
      if (!mounted.current) return;
      setCaptureCanvas(canvas);
      setOriginalFile(file);
      setAutoCorners(detected?.corners ?? null);
      if (detected) {
        const cropped = await scanImage(canvas, { corners: detected.corners, mode: "original", maxSide: 2400 });
        const croppedBlob = await canvasToBlob(cropped.canvas, "image/jpeg", 0.92);
        if (!mounted.current) return;
        setReviewFile(new File([croppedBlob], file.name, { type: "image/jpeg" }));
        setIsCropped(true);
      } else {
        setReviewFile(file);
        setIsCropped(false);
      }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "Could not capture the image.");
    } finally {
      captureLock.current = false;
      if (mounted.current) setCapturing(false);
    }
  }

  async function applyCrop(corners: Quad) {
    if (!captureCanvas || !originalFile) return;
    try {
      const { scanImage, canvasToBlob } = await import("@quannqit/doc-scanner");
      const cropped = await scanImage(captureCanvas, { corners, mode: "original", maxSide: 2400 });
      const blob = await canvasToBlob(cropped.canvas, "image/jpeg", 0.92);
      if (!mounted.current) return;
      setReviewFile(new File([blob], originalFile.name, { type: "image/jpeg" }));
      setIsCropped(true);
      setEditorOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not crop the receipt. Try again.");
    }
  }

  function openEditor() {
    if (!captureCanvas) return;
    const initial = autoCorners ?? [
      { x: captureCanvas.width * 0.05, y: captureCanvas.height * 0.05 },
      { x: captureCanvas.width * 0.95, y: captureCanvas.height * 0.05 },
      { x: captureCanvas.width * 0.95, y: captureCanvas.height * 0.95 },
      { x: captureCanvas.width * 0.05, y: captureCanvas.height * 0.95 },
    ] as Quad;
    setEditorCorners(initial);
    setResetCorners(initial);
    setEditorOpen(true);
  }

  function moveEditorCorner(event: React.PointerEvent<SVGSVGElement>) {
    const index = dragCorner.current;
    const svg = editorSvg.current;
    if (index === null || !svg || !captureCanvas || !editorCorners) return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const position = point.matrixTransform(matrix.inverse());
    const next = [...editorCorners] as Quad;
    next[index] = {
      x: Math.min(captureCanvas.width, Math.max(0, position.x)),
      y: Math.min(captureCanvas.height, Math.max(0, position.y)),
    };
    setEditorCorners(next);
  }

  function useOriginal() {
    if (!originalFile) return;
    setReviewFile(originalFile);
    setIsCropped(false);
    setEditorOpen(false);
  }

  function retake() {
    setCaptureCanvas(null);
    setOriginalFile(null);
    setReviewFile(null);
    setAutoCorners(null);
    setEditorCorners(null);
    setIsCropped(false);
    setError(null);
  }

  function usePhoto() {
    if (!reviewFile) return;
    onCapture(reviewFile);
    onClose();
  }

  return <>
    <ModalHeader title={reviewFile ? "Review receipt" : "Capture receipt"} />
    <ModalBody>
      <div className="flex flex-col gap-4">
        {!reviewFile && <>
        <div
          className="relative mx-auto max-w-full overflow-hidden rounded-xl bg-background-secondary-default"
          style={{ width: `min(100%, calc(60vh * ${cameraRatio}))`, aspectRatio: `${cameraWidth} / ${cameraHeight}` }}
        >
          <video
            ref={video}
            autoPlay
            muted
            playsInline
            aria-label="Live camera preview"
            className="h-full w-full object-contain"
            onPlaying={() => {
              const current = video.current;
              if (current) setCameraSize({ width: current.videoWidth, height: current.videoHeight });
              setReady(true);
            }}
          />
          {ready && corners && (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full text-accent-600"
              viewBox={`0 0 360 ${detectorFrameHeight}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <polygon
                points={corners.map(({ x, y }) => `${x},${y}`).join(" ")}
                fill="currentColor"
                fillOpacity="0.12"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {!ready && !error && <p role="status" className="flex items-center gap-2"><Spinner size="sm" /> Opening camera…</p>}
        {ready && !detectorReady && !detectorError && <p role="status" className="flex items-center gap-2"><Spinner size="sm" /> Loading receipt outline detection…</p>}
        {ready && detectorReady && !detectorError && <p role="status" className="text-body-2-regular text-text-secondary">{corners ? "Receipt outline detected" : "Point the camera at a receipt to find its edges"}</p>}
        {detectorError && <p role="status" className="text-body-2-regular text-text-secondary">Live edge detection is unavailable. You can still capture the photo.</p>}
        </>}
        {reviewFile && reviewPreviewUrl && (
          <div className="relative mx-auto flex max-h-[60vh] max-w-full items-center justify-center overflow-hidden rounded-xl bg-background-secondary-default">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reviewPreviewUrl} alt={isCropped ? "Auto-cropped receipt preview" : "Original photo preview"} className="max-h-[60vh] max-w-full object-contain" />
            <Button
              variant="secondary"
              size="medium"
              iconOnly
              leadingIcon={RiEdit2Line}
              aria-label="Edit receipt crop"
              className="absolute end-3 top-3 shadow-md"
              onClick={openEditor}
            />
            <span className="absolute bottom-3 start-3 rounded-full bg-background-primary-default px-3 py-1 text-caption-1-semibold text-text-primary shadow-md">
              {isCropped ? "Auto-cropped" : "Original photo"}
            </span>
          </div>
        )}
        {reviewFile && !autoCorners && <p className="text-body-2-regular text-text-secondary">Receipt edges weren’t detected. Edit the crop manually or use the original photo.</p>}
        {error && <p role="alert" className="text-body-2-regular text-text-error-primary">{error}</p>}
      </div>
    </ModalBody>
    <ModalFooter>
      {reviewFile ? <>
        <Button variant="secondary" onClick={retake}>Retake</Button>
        <Button leadingIcon={RiCameraLine} onClick={usePhoto}>Use photo</Button>
      </> : <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button leadingIcon={RiCameraLine} disabled={!ready || capturing} onClick={() => void capture()}>{capturing ? "Capturing…" : "Capture photo"}</Button>
      </>}
    </ModalFooter>
    {editorOpen && captureCanvas && originalPreviewUrl && editorCorners && (
      <Modal isOpen onOpenChange={(open) => { if (!open) setEditorOpen(false); }} size="lg" aria-label="Edit receipt crop">
        <ModalHeader title="Adjust receipt crop" description="Drag the corner handles to fit the receipt before scanning." />
        <ModalBody>
          <div
            className="relative mx-auto max-h-[60vh] max-w-full overflow-hidden rounded-xl bg-background-secondary-default"
            style={{ aspectRatio: `${captureCanvas.width} / ${captureCanvas.height}`, width: `min(100%, calc(60vh * ${captureCanvas.width / captureCanvas.height}))` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={originalPreviewUrl} alt="Original photo with adjustable crop corners" className="absolute inset-0 h-full w-full object-contain" />
            <svg
              ref={editorSvg}
              aria-label="Adjustable crop corners"
              role="application"
              className="absolute inset-0 h-full w-full touch-none"
              viewBox={`0 0 ${captureCanvas.width} ${captureCanvas.height}`}
              onPointerMove={moveEditorCorner}
              onPointerUp={() => { dragCorner.current = null; }}
              onPointerCancel={() => { dragCorner.current = null; }}
            >
              <polygon points={editorCorners.map(({ x, y }) => `${x},${y}`).join(" ")} fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth={Math.max(3, captureCanvas.width / 240)} className="text-accent-600" />
              {editorCorners.map((point: Point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={Math.max(24, captureCanvas.width / 24)}
                  strokeWidth={Math.max(4, captureCanvas.width / 180)}
                  className="cursor-grab touch-none fill-accent-600 stroke-background-full active:cursor-grabbing"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    dragCorner.current = index;
                    event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
                  }}
                />
              ))}
            </svg>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={useOriginal}>Use original</Button>
          <Button variant="secondary" onClick={() => { if (resetCorners) setEditorCorners(resetCorners); }}>Reset corners</Button>
          <Button disabled={!editorCorners} onClick={() => void applyCrop(editorCorners)}>Apply crop</Button>
        </ModalFooter>
      </Modal>
    )}
  </>;
}
