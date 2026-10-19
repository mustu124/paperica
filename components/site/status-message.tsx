import type { ReactNode } from "react";
import { ScribbleCircle } from "@/components/ui/scribble-circle";

/** Brand-style full-page message (404, errors): scribble ring, serif heading, actions. */
export function StatusMessage({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative isolate mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <ScribbleCircle className="absolute left-1/2 top-1/2 -z-10 size-[22rem] -translate-x-1/2 -translate-y-1/2 md:size-[28rem]" />
      {eyebrow && <p className="label-caps text-chilli">{eyebrow}</p>}
      <h1 className="font-serif text-3xl font-semibold md:text-5xl">{title}</h1>
      {children && <div className="text-ink-muted">{children}</div>}
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
