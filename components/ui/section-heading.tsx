import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { DoodleStar } from "./doodles";
import { ScribbleCircle } from "./scribble-circle";

/**
 * Section title. `align="start"` is the storefront look: red condensed serif with a doodled star
 * on the left and an optional "VIEW ALL →" link on the right. Centred is used for page-level titles.
 */
export function SectionHeading({
  title,
  eyebrow,
  link,
  viewAll,
  scribble = false,
  align = "center",
  as: Tag = "h2",
  className,
}: {
  title: string;
  eyebrow?: string;
  link?: { href: string; label: string };
  viewAll?: { href: string; label?: string } | null;
  scribble?: boolean;
  align?: "center" | "start";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  if (align === "start") {
    return (
      <div className={cn("mb-6 flex items-end justify-between gap-4 md:mb-8", className)}>
        <div>
          {eyebrow && <p className="label-caps mb-1 text-chilli">{eyebrow}</p>}
          <Tag className="relative inline-block pr-8 font-serif text-3xl font-bold leading-none text-chilli md:pr-10 md:text-[2.75rem]">
            {title}
            <DoodleStar className="absolute -top-2 right-0 size-6 rotate-12 md:size-7" />
          </Tag>
        </div>
        {viewAll && (
          <Link
            href={viewAll.href}
            className="group inline-flex min-h-11 shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-chilli hover:text-chilli-deep"
          >
            {viewAll.label ?? "View all"}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative isolate mb-6 text-center md:mb-8", className)}>
      {scribble && (
        <ScribbleCircle className="absolute left-1/2 top-1/2 -z-10 size-28 -translate-x-1/2 -translate-y-1/2 md:size-36" />
      )}
      {eyebrow && <p className="label-caps mb-2 text-chilli">{eyebrow}</p>}
      <Tag className="font-serif text-3xl font-bold text-chilli md:text-4xl">{title}</Tag>
      {link && (
        <Link
          href={link.href}
          className="mt-2 inline-block text-sm text-ink-muted underline underline-offset-4 hover:text-chilli"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
