import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Plain, large, friendly building blocks for the admin panel.

export const inputCls =
  "w-full rounded-md border border-ink/25 bg-white px-3 py-2.5 text-base text-ink placeholder:text-ink-muted/70 focus:border-chilli focus:outline-none focus:ring-2 focus:ring-chilli/15 disabled:bg-paper/50";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, children, className, actions }: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-taupe bg-white p-5 shadow-sm md:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, error, children, className }: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink-muted">{hint}</span>}
      {error && (
        <span role="alert" className="text-xs text-chilli">
          {error}
        </span>
      )}
    </label>
  );
}

/** Large on/off switch (a styled checkbox, so it works in forms and with keyboards). */
export function Toggle({ checked, onChange, label, name, disabled }: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label: ReactNode;
  name?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("relative inline-flex min-h-11 cursor-pointer select-none items-center gap-3 text-sm", disabled && "cursor-not-allowed opacity-60")}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-6 w-11 shrink-0 rounded-full bg-taupe transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-stem-deep peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-chilli peer-focus-visible:ring-offset-2"
      />
      <span>{label}</span>
    </label>
  );
}

const BADGE: Record<string, string> = {
  paid: "bg-stem-deep text-white",
  pending: "bg-paper text-ink border border-taupe",
  failed: "bg-chilli/10 text-chilli",
  refunded: "bg-ink text-white",
  processing: "bg-blush text-chilli-deep",
  dispatched: "bg-tint-blue text-ink",
  delivered: "bg-stem-deep text-white",
  cancelled: "bg-ink/10 text-ink-muted line-through",
  new: "bg-chilli text-white",
  in_progress: "bg-blush text-chilli-deep",
  closed: "bg-ink/10 text-ink-muted",
  active: "bg-stem-deep text-white",
  inactive: "bg-ink/10 text-ink-muted",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", BADGE[status] ?? "bg-paper text-ink")}>
      {label ?? status.replace("_", " ")}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-taupe bg-paper/30 px-6 py-12 text-center text-ink-muted">{children}</p>;
}
