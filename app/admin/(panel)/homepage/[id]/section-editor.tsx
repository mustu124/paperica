"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Card, Field, inputCls } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import { SECTION_SPECS, type SlotField } from "@/lib/admin/homepage-specs";
import type { HomepageSectionType } from "@/types/db";
import { saveSection } from "../actions";

export type EditorSlot = {
  images: { url: string | null; alt: string }[];
  fields: Record<SlotField, string>;
};

const emptySlot = (images: number): EditorSlot => ({
  images: Array.from({ length: images }, () => ({ url: null, alt: "" })),
  fields: { heading: "", subheading: "", button_label: "", link_url: "", badge_text: "" },
});

const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export function SectionEditor({
  id,
  type,
  initialConfig,
  initialSlots,
  initialSettings,
  links,
  products,
}: {
  id: string;
  type: HomepageSectionType;
  initialConfig: Record<string, unknown>;
  initialSlots: EditorSlot[];
  initialSettings: Record<string, string | number>;
  links: { value: string; label: string }[];
  products: { slug: string; name: string; active: boolean }[];
}) {
  const spec = SECTION_SPECS[type];
  const [config, setConfig] = useState(initialConfig);
  const [slots, setSlots] = useState(initialSlots);
  const [settings, setSettings] = useState(initialSettings);
  const { run, pending } = useSave();
  const linkListId = useId();
  const fixed = "fixed" in spec.slots;

  const setSlot = (i: number, patch: Partial<EditorSlot>) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setField = (i: number, key: SlotField, value: string) =>
    setSlots((s) => s.map((x, j) => (j === i ? { ...x, fields: { ...x.fields, [key]: value } } : x)));
  const str = (key: string) => (typeof config[key] === "string" ? (config[key] as string) : "");

  return (
    <form
      className="space-y-6 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => saveSection(id, type, { config, slots, settings }), "Homepage updated");
      }}
    >
      <datalist id={linkListId}>
        {links.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </datalist>

      <div>
        <Link href="/admin/homepage" className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-muted hover:text-chilli lg:min-h-0">
          <ArrowLeft className="size-4" aria-hidden /> Homepage
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold">{spec.title}</h1>
        <p className="mt-1 text-ink-muted">{spec.description}</p>
      </div>

      {(spec.config.some((c) => c.type !== "icons") || spec.settings?.length) && (
        <Card title="Section options">
          <div className="grid gap-4 sm:grid-cols-2">
            {spec.config.map((c) => {
              if (c.type === "text")
                return (
                  <Field key={c.key} label={c.label} hint={c.hint}>
                    <input value={str(c.key)} onChange={(e) => setConfig({ ...config, [c.key]: e.target.value })} className={inputCls} />
                  </Field>
                );
              if (c.type === "select")
                return (
                  <Field key={c.key} label={c.label}>
                    <select value={str(c.key) || c.options[0].value} onChange={(e) => setConfig({ ...config, [c.key]: e.target.value })} className={inputCls}>
                      {c.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                );
              if (c.type === "image")
                return (
                  <ImageUpload
                    key={c.key}
                    label={c.label}
                    folder="homepage"
                    aspect="aspect-square max-w-40"
                    value={str(c.key) || null}
                    onChange={(url) => setConfig({ ...config, [c.key]: url ?? "" })}
                  />
                );
              if (c.type === "products") {
                const picked = Array.isArray(config[c.key]) ? (config[c.key] as string[]) : [];
                const setPicked = (list: string[]) => setConfig({ ...config, [c.key]: list });
                return (
                  <div key={c.key} className="space-y-3 sm:col-span-2">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-ink-muted">{c.hint}</p>
                    {picked.length > 0 && (
                      <ol className="space-y-1.5">
                        {picked.map((slug, i) => (
                          <li key={slug} className="flex items-center gap-2 rounded-md bg-blush/30 px-3 py-2 text-sm">
                            <span className="w-5 text-ink-muted">{i + 1}.</span>
                            <span className="flex-1">{products.find((p) => p.slug === slug)?.name ?? `${slug} (not found)`}</span>
                            <button type="button" disabled={i === 0} onClick={() => setPicked(move(picked, i, i - 1))} aria-label="Move up" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 p-1 disabled:opacity-30">
                              <ArrowUp className="size-4" aria-hidden />
                            </button>
                            <button type="button" disabled={i === picked.length - 1} onClick={() => setPicked(move(picked, i, i + 1))} aria-label="Move down" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 p-1 disabled:opacity-30">
                              <ArrowDown className="size-4" aria-hidden />
                            </button>
                            <button type="button" onClick={() => setPicked(picked.filter((x) => x !== slug))} aria-label="Remove" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 p-1 text-chilli">
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                    {picked.length < c.max && (
                      <select
                        value=""
                        onChange={(e) => e.target.value && setPicked([...picked, e.target.value])}
                        className={inputCls}
                        aria-label="Add a product"
                      >
                        <option value="">+ Add a product…</option>
                        {products
                          .filter((p) => !picked.includes(p.slug))
                          .map((p) => (
                            <option key={p.slug} value={p.slug}>
                              {p.name}
                              {p.active ? "" : " (inactive)"}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                );
              }
              return null;
            })}
            {spec.settings?.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
                {f.type === "number" ? (
                  <input
                    type="number"
                    min={f.min}
                    step={100}
                    value={settings[f.key] ?? ""}
                    onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value === "" ? "" : Number(e.target.value) })}
                    className={inputCls}
                  />
                ) : (
                  <textarea rows={3} value={String(settings[f.key] ?? "")} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })} className={inputCls} />
                )}
              </Field>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {slots.map((slot, i) => (
          <Card
            key={i}
            title={`${spec.slotLabel} ${i + 1}`}
            actions={
              !fixed && (
                <div className="flex gap-1">
                  <button type="button" disabled={i === 0} onClick={() => setSlots(move(slots, i, i - 1))} aria-label="Move earlier" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1 disabled:opacity-30">
                    <ArrowUp className="size-4 -rotate-90" aria-hidden />
                  </button>
                  <button type="button" disabled={i === slots.length - 1} onClick={() => setSlots(move(slots, i, i + 1))} aria-label="Move later" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1 disabled:opacity-30">
                    <ArrowDown className="size-4 -rotate-90" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={"min" in spec.slots && slots.length <= spec.slots.min}
                    onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                    aria-label={`Remove ${spec.slotLabel.toLowerCase()} ${i + 1}`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1 text-chilli disabled:opacity-30"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              )
            }
          >
            <div className="space-y-4">
              {spec.images.length > 0 && (
                <div className={spec.images.length > 1 ? "grid grid-cols-2 gap-3" : ""}>
                  {spec.images.map((label, j) => (
                    <div key={label} className="space-y-2">
                      <ImageUpload
                        label={label}
                        folder="homepage"
                        aspect={spec.aspect}
                        value={slot.images[j]?.url ?? null}
                        onChange={(url) => setSlot(i, { images: slot.images.map((im, k) => (k === j ? { ...im, url } : im)) })}
                      />
                      <input
                        value={slot.images[j]?.alt ?? ""}
                        onChange={(e) => setSlot(i, { images: slot.images.map((im, k) => (k === j ? { ...im, alt: e.target.value } : im)) })}
                        placeholder="Describe the image"
                        aria-label={`${label} description`}
                        className={`${inputCls} py-1.5 lg:text-sm`}
                      />
                    </div>
                  ))}
                </div>
              )}
              {spec.config
                .filter((c) => c.type === "icons")
                .map((c) => {
                  const icons = Array.isArray(config[c.key]) ? (config[c.key] as string[]) : [];
                  return (
                    c.type === "icons" && (
                      <Field key={c.key} label={c.label}>
                        <select
                          value={icons[i] ?? ""}
                          onChange={(e) => {
                            const next = [...icons];
                            next[i] = e.target.value;
                            setConfig({ ...config, [c.key]: next });
                          }}
                          className={inputCls}
                        >
                          <option value="">No icon</option>
                          {c.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )
                  );
                })}
              {spec.fields.map((f) => (
                <Field key={f.key} label={f.label} hint={f.hint ?? (f.link ? "Start typing to pick a page, or paste a link." : undefined)}>
                  {f.multiline ? (
                    <textarea rows={3} value={slot.fields[f.key]} onChange={(e) => setField(i, f.key, e.target.value)} className={inputCls} />
                  ) : (
                    <input
                      value={slot.fields[f.key]}
                      onChange={(e) => setField(i, f.key, e.target.value)}
                      list={f.link ? linkListId : undefined}
                      className={inputCls}
                    />
                  )}
                </Field>
              ))}
            </div>
          </Card>
        ))}
        {!fixed && "max" in spec.slots && slots.length < spec.slots.max && (
          <button
            type="button"
            onClick={() => setSlots([...slots, emptySlot(spec.images.length)])}
            className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink/25 text-ink-muted hover:border-chilli hover:text-chilli"
          >
            <Plus className="size-6" aria-hidden />
            Add {spec.slotLabel.toLowerCase()}
          </button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-taupe bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl justify-end md:px-4">
          <Button type="submit" size="lg" disabled={pending} className="min-w-40">
            {pending ? "Saving…" : "Save section"}
          </Button>
        </div>
      </div>
    </form>
  );
}
