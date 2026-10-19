import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Built on native <details>/<summary>: keyboard accessible, works without JavaScript,
 * and the content stays searchable with find-in-page.
 * Pass the same `name` to items that should behave as an exclusive group.
 */
export function AccordionItem({
  title,
  children,
  defaultOpen,
  name,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  name?: string;
  className?: string;
}) {
  return (
    <details
      open={defaultOpen}
      name={name}
      className={cn("group border-b border-taupe", className)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium hover:text-chilli [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="pb-5 text-ink/90">{children}</div>
    </details>
  );
}

export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("border-t border-taupe", className)}>{children}</div>;
}
