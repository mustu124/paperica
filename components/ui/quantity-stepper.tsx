"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/cn";

/** − / value / + control. Controlled: pass value and onChange. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "Quantity",
  hideLabel = false,
  size = "md",
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  hideLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const btn =
    "flex items-center justify-center text-ink hover:text-chilli disabled:opacity-30 disabled:hover:text-ink";
  const h = size === "sm" ? "h-8" : "h-11";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className={cn("text-sm", hideLabel && "sr-only")}>
        {label}
      </label>
      <div className={cn("inline-flex w-fit items-center rounded-full border border-ink/30 bg-white px-1", h)}>
        <button
          type="button"
          className={cn(btn, h, size === "sm" ? "w-9" : "w-11")}
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus className="size-3.5" aria-hidden />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          className="h-full w-10 appearance-none bg-transparent text-center text-base [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          className={cn(btn, h, size === "sm" ? "w-9" : "w-11")}
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
