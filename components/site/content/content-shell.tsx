import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Readable layout for long text: breadcrumbs, serif title, ~760px measure, generous spacing. */
export function ContentShell({
  title,
  crumbs,
  lastUpdated,
  wide = false,
  children,
}: {
  title: string;
  crumbs?: Crumb[];
  lastUpdated?: string | null;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 pb-20 pt-6 md:px-6", wide ? "max-w-6xl" : "max-w-[808px]")}>
      <Breadcrumbs items={crumbs ?? [{ label: "Home", href: "/" }, { label: title }]} className="mb-6" />
      <header className="mb-10 border-b border-taupe pb-6">
        <h1 className="font-serif text-3xl font-semibold leading-tight md:text-[2.75rem]">{title}</h1>
        {lastUpdated && <p className="mt-3 text-sm text-ink-muted">Last updated: {formatDate(lastUpdated)}</p>}
      </header>
      {children}
    </div>
  );
}

/** CMS HTML (already token-rendered) in the shared prose style. */
export function Prose({ html, className }: { html: string; className?: string }) {
  return <div className={cn("prose-paperica text-[1.0625rem]", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
