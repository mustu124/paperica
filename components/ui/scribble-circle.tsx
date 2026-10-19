import { cn } from "@/lib/cn";

/**
 * Thin hand-drawn ring of overlapping ellipses, echoing the scribble around the logo.
 * Purely decorative: position it absolutely behind a heading or empty state.
 */
export function ScribbleCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none text-scribble", className)}
    >
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <ellipse cx="100" cy="100" rx="88" ry="82" transform="rotate(-8 100 100)" />
        <ellipse cx="102" cy="98" rx="84" ry="86" transform="rotate(12 100 100)" />
        <ellipse cx="98" cy="102" rx="90" ry="79" transform="rotate(28 100 100)" />
        <ellipse cx="101" cy="100" rx="80" ry="88" transform="rotate(-24 100 100)" />
        <ellipse cx="99" cy="99" rx="86" ry="83" transform="rotate(45 100 100)" />
      </g>
    </svg>
  );
}
