"use client";

import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useModalDialog } from "./use-modal-dialog";

/** Centred dialog (size guide, image zoom, confirmations). */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { ref, onBackdropClick } = useModalDialog(open, onClose);
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className={cn(
        "pp-dialog pp-modal m-auto w-[calc(100%-2rem)] max-w-lg bg-white p-0 text-ink shadow-xl",
        className,
      )}
    >
      <div className="relative p-6 md:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-2 hover:text-chilli"
          aria-label="Close"
        >
          <X className="size-5" aria-hidden />
        </button>
        <h2 id={titleId} className="mb-4 pr-8 font-serif text-2xl font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
