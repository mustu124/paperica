"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { useState } from "react";
import { Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { moveSection, setSectionActive } from "./actions";

type Row = {
  id: string;
  type: string;
  title: string;
  description: string;
  isActive: boolean;
  reorderable: boolean;
  thumbs: string[];
};

export function SectionList({ sections }: { sections: Row[] }) {
  const { run, pending } = useSave();
  const movable = sections.filter((s) => s.reorderable);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const toggle = (id: string, v: boolean) => {
    setShown((o) => ({ ...o, [id]: v }));
    void run(() => setSectionActive(id, v), v ? "Section shown" : "Section hidden").then((r) => !r.ok && setShown((o) => ({ ...o, [id]: !v })));
  };

  return (
    <ol className="space-y-3">
      {sections.map((s) => {
        const index = movable.findIndex((m) => m.id === s.id);
        return (
          <li key={s.id} className={cn("flex flex-col gap-4 rounded-lg border border-taupe bg-white p-4 sm:flex-row sm:items-center", !s.isActive && "opacity-70")}>
            {s.reorderable ? (
              <div className="flex gap-1 sm:flex-col">
                <button
                  type="button"
                  disabled={pending || index === 0}
                  onClick={() => run(() => moveSection(s.id, "up"), "Moved up")}
                  aria-label={`Move ${s.title} up`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1.5 hover:border-chilli disabled:opacity-30"
                >
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={pending || index === movable.length - 1}
                  onClick={() => run(() => moveSection(s.id, "down"), "Moved down")}
                  aria-label={`Move ${s.title} down`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1.5 hover:border-chilli disabled:opacity-30"
                >
                  <ArrowDown className="size-4" aria-hidden />
                </button>
              </div>
            ) : (
              <span className="w-8 text-center text-xs text-ink-muted" title="Always above the footer">
                ▼
              </span>
            )}
            <div className="flex shrink-0 gap-1">
              {s.thumbs.length ? (
                s.thumbs.map((t, i) => (
                  <span key={t + i} className="relative block size-12 overflow-hidden rounded bg-blush">
                    <Image src={t} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                ))
              ) : (
                <span className="flex size-12 items-center justify-center rounded bg-paper text-[0.625rem] text-ink-muted">Text</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-ink-muted">{s.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <Toggle
                checked={shown[s.id] ?? s.isActive}
                onChange={(v) => toggle(s.id, v)}
                label={(shown[s.id] ?? s.isActive) ? "Shown" : "Hidden"}
              />
              <ButtonLink href={`/admin/homepage/${s.id}`} variant="secondary" size="sm">
                <Pencil className="size-4" aria-hidden />
                Edit
              </ButtonLink>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
