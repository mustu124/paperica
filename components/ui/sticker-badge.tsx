import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Scalloped circle path (24 bumps) in a 100×100 box.
const SCALLOP = (() => {
  const bumps = 24;
  const r = 46;
  const depth = 3.5;
  const pts: string[] = [];
  for (let i = 0; i <= bumps * 2; i++) {
    const a = (i / (bumps * 2)) * Math.PI * 2;
    const rad = i % 2 === 0 ? r : r - depth;
    pts.push(`${(50 + rad * Math.cos(a)).toFixed(2)},${(50 + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(" L")}Z`;
})();

/**
 * Round red sticker with white text, slightly tilted, for promo tiles
 * (e.g. "Notebooks 2 for ₹799"). Keep text to 2–3 short lines.
 */
export function StickerBadge({
  children,
  size = "md",
  tilt = -10,
  tone = "chilli",
  className,
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  tilt?: number;
  tone?: "chilli" | "deep";
  className?: string;
}) {
  const dims = { sm: "size-20 text-xs", md: "size-28 text-sm", lg: "size-36 text-lg" }[size];

  return (
    <div
      className={cn("relative grid place-items-center text-white drop-shadow-md", dims, className)}
      style={{ rotate: `${tilt}deg` }}
    >
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full">
        <path d={SCALLOP} className={tone === "deep" ? "fill-chilli-deep" : "fill-chilli"} />
        <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="0.8" strokeDasharray="2 2" />
      </svg>
      <span className="relative px-4 text-center font-display leading-tight">{children}</span>
    </div>
  );
}
