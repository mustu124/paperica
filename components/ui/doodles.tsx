import { cn } from "@/lib/cn";

// Hand-drawn accents from the "paper happiness" look. Decorative only (aria-hidden).

/** Wobbly outlined star, e.g. after section titles. */
export function DoodleStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={cn("inline-block", className)}>
      <path
        d="M16 3.5c1.2 3.9 2.3 6.8 3.4 8.4 3.3.2 6.6.3 9.1.9-2.6 2-5 4-7.3 5.7 1 3.2 1.9 6.4 2.4 9.2-2.7-1.8-5.2-3.6-7.6-5-2.6 1.6-5.2 3.4-7.9 5.2.8-3 1.7-6.1 2.8-9.3C8.6 16.7 6 14.8 3.5 12.9c3.2-.6 6.3-.9 9.3-1C13.9 9.6 15 6.8 16 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Small outlined heart. */
export function DoodleHeart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("inline-block", className)}>
      <path
        d="M12 20.2c-4.6-3.1-8.3-6.3-8.3-10.2 0-2.6 2-4.6 4.4-4.6 1.7 0 3 .9 3.9 2.3.9-1.4 2.2-2.3 3.9-2.3 2.4 0 4.4 2 4.4 4.6 0 3.9-3.7 7.1-8.3 10.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Loose looping squiggle, used as a corner flourish. */
export function DoodleSquiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" fill="none" aria-hidden className={cn("inline-block", className)}>
      <path
        d="M3 40c14-14 30-24 44-18 10 4 4 18-4 14s0-22 16-26c18-4 32 12 58 4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Three little dashes radiating from a corner ("sparkle lines"). */
export function DoodleDashes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={cn("inline-block", className)}>
      <path d="M20 4v9M6 14l7 5M34 14l-7 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
