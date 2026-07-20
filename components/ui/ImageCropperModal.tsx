"use client";

import { Check, X, ZoomIn } from "lucide-react";
import { useMemo, useRef, useState } from "react";

interface ImageCropperModalProps {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

interface NaturalSize { w: number; h: number }

const VIEWPORT = 288; // px, square crop viewport shown on screen
const OUTPUT = 512; // px, exported square logo resolution

/** Displayed image size ("cover" fit) at a given zoom level. */
function dispSizeFor(size: NaturalSize, zoom: number) {
  const baseScale = Math.max(VIEWPORT / size.w, VIEWPORT / size.h);
  const scale = baseScale * zoom;
  return { w: size.w * scale, h: size.h * scale };
}

/** Keep the image offset so it always fully covers the crop viewport. */
function clampPos(dispW: number, dispH: number, x: number, y: number) {
  return {
    x: Math.min(0, Math.max(VIEWPORT - dispW, x)),
    y: Math.min(0, Math.max(VIEWPORT - dispH, y)),
  };
}

export default function ImageCropperModal({ file, onCancel, onConfirm }: ImageCropperModalProps) {
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const imgRef = useRef<HTMLImageElement>(null);

  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const releasedUrlRef = useRef(false);

  const { w: dispW, h: dispH } = naturalSize ? dispSizeFor(naturalSize, zoom) : { w: VIEWPORT, h: VIEWPORT };

  const setZoomClamped = (nextZoom: number) => {
    const clampedZoom = Math.min(4, Math.max(1, nextZoom));
    setZoom(clampedZoom);
    if (!naturalSize) return;
    const { w, h } = dispSizeFor(naturalSize, clampedZoom);
    setPos((p) => clampPos(w, h, p.x, p.y));
  };

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const size = { w: img.naturalWidth, h: img.naturalHeight };
    setNaturalSize(size);
    setZoom(1);
    const { w, h } = dispSizeFor(size, 1);
    setPos({ x: (VIEWPORT - w) / 2, y: (VIEWPORT - h) / 2 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos(clampPos(dispW, dispH, dragState.current.origX + dx, dragState.current.origY + dy));
  };

  const onPointerUp = () => {
    dragState.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomClamped(zoom - e.deltaY * 0.0015);
  };

  const handleCancel = () => {
    if (!releasedUrlRef.current) {
      releasedUrlRef.current = true;
      URL.revokeObjectURL(imageUrl);
    }
    onCancel();
  };

  const handleConfirm = () => {
    if (!imgRef.current || !naturalSize) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = OUTPUT / VIEWPORT;
    ctx.drawImage(imgRef.current, pos.x * ratio, pos.y * ratio, dispW * ratio, dispH * ratio);
    canvas.toBlob((blob) => {
      if (!releasedUrlRef.current) {
        releasedUrlRef.current = true;
        URL.revokeObjectURL(imageUrl);
      }
      if (blob) onConfirm(blob);
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div>
          <h3 className="font-bold text-ink text-sm">Sesuaikan Logo</h3>
          <p className="text-ink-soft text-xs mt-0.5">Geser untuk memindahkan, gunakan slider atau scroll untuk zoom.</p>
        </div>

        <div
          className="relative mx-auto rounded-lg overflow-hidden border-2 border-dashed border-primary-400 bg-background cursor-move touch-none select-none"
          style={{ width: VIEWPORT, height: VIEWPORT }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Pratinjau crop logo"
            onLoad={handleImgLoad}
            draggable={false}
            className="absolute top-0 left-0 max-w-none pointer-events-none"
            style={{ width: dispW, height: dispH, transform: `translate(${pos.x}px, ${pos.y}px)` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="w-4 h-4 text-ink-soft shrink-0" />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoomClamped(parseFloat(e.target.value))}
            className="w-full accent-primary-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-ink-soft hover:bg-background transition"
          >
            <X className="w-3.5 h-3.5" />
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 transition shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            Gunakan Logo
          </button>
        </div>
      </div>
    </div>
  );
}
