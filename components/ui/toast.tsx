"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: ReactNode; tone: ToastTone };
type ToastApi = { toast: (message: ReactNode, tone?: ToastTone) => void };

const ToastContext = createContext<ToastApi | null>(null);
const DURATION_MS = 4000;

const tones: Record<ToastTone, { className: string; Icon: typeof Info }> = {
  success: { className: "border-stem-deep", Icon: CheckCircle2 },
  error: { className: "border-chilli", Icon: TriangleAlert },
  info: { className: "border-ink", Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastApi["toast"]>(
    (message, tone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((all) => [...all.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-20 z-50 md:bottom-24 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map(({ id, message, tone }) => {
          const { className, Icon } = tones[tone];
          return (
            <div
              key={id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 border-l-4 bg-white px-4 py-3 text-sm shadow-lg",
                "animate-[toast-in_200ms_ease-out]",
                className,
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="flex-1">{message}</div>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="-m-1 p-1 text-ink-muted hover:text-chilli"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const ctx = use(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
