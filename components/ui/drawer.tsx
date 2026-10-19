"use client";

import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useModalDialog } from "./use-modal-dialog";

/** Panel that slides in from the right (cart, mobile menu, filters). */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = "right",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: "right" | "left";
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
        "pp-dialog fixed inset-y-0 m-0 h-dvh max-h-dvh w-full max-w-md bg-paper p-0 text-ink",
        side === "right" ? "pp-drawer left-auto right-0" : "pp-drawer-left left-0 right-auto",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-taupe bg-white px-5 py-4">
          <h2 id={titleId} className="font-serif text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 p-2 hover:text-chilli"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-taupe bg-white px-5 py-4">{footer}</footer>}
      </div>
    </dialog>
  );
}
