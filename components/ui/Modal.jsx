"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";

export function Modal({ open, onClose, title, children, footer }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const prevActive = useRef(null);

  useEffect(() => {
    if (!open) return;
    prevActive.current = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    queueMicrotask(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevActive.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="glass-panel relative z-[101] w-full max-w-lg rounded-3xl border border-white/10 bg-surface-container-low/90 p-6 shadow-2xl outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title ? (
            <h2 id={titleId} className="font-heading text-h3 text-on-surface">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-on-surface-variant transition hover:bg-white/10 hover:text-on-background focus-visible:ring-2 focus-visible:ring-surface-tint/60"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="text-on-surface-variant">{children}</div>
        {footer ? (
          <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>
        ) : (
          <div className="mt-6 flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
