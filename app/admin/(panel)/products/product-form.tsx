"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, ExternalLink, GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { RichText } from "@/components/admin/rich-text";
import { Card, Field, inputCls, Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { uploadImage } from "@/lib/admin/image";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/format";
import type { SubcategoryKind } from "@/types/db";
import { deleteProduct, duplicateProduct, saveProduct, type ProductInput } from "./actions";

export type CategoryOption = {
  id: string;
  name: string;
  defaultMode: "buy" | "whatsapp";
  subcategories: { id: string; name: string; kind: SubcategoryKind }[];
};

type Variant = ProductInput["variants"][number];
type Img = ProductInput["images"][number];

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};
// Subcategories filled automatically (New Collection, Best Sellers, Under ₹1,000, Personalised Gifts, View All).
const AUTOMATIC: SubcategoryKind[] = ["view_all", "filter_new", "filter_best", "filter_under_1000", "filter_personalised"];

export function ProductForm({
  id,
  initial,
  categories,
}: {
  id: string | null;
  initial: ProductInput;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { run, pending } = useSave();
  const uploadId = useId();

  const [v, setV] = useState<ProductInput>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [priceText, setPriceText] = useState(initial.price_inr?.toString() ?? "");
  const [compareText, setCompareText] = useState(initial.compare_at_price_inr?.toString() ?? "");
  const [stockText, setStockText] = useState(initial.stock_qty?.toString() ?? "");
  const [uploading, setUploading] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setV((s) => ({ ...s, [key]: value }));
  const setVariant = (i: number, patch: Partial<Variant>) =>
    set("variants", v.variants.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setImage = (i: number, patch: Partial<Img>) => set("images", v.images.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files];
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const url = await uploadImage(file, "products");
        setV((s) => ({ ...s, images: [...s.images, { id: null, url, alt: s.name }] }));
      } catch (e) {
        toast((e as Error).message, "error");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const save = () =>
    run(
      () =>
        saveProduct(id, {
          ...v,
          price_inr: numOrNull(priceText),
          compare_at_price_inr: numOrNull(compareText),
          stock_qty: numOrNull(stockText),
        }),
      "Product saved",
    ).then((r) => {
      if (!r.ok || !r.data) return;
      const data = r.data as { id: string; product: ProductInput | null };
      if (!id) router.replace(`/admin/products/${data.id}`);
      else if (data.product) {
        setV(data.product);
        setPriceText(data.product.price_inr?.toString() ?? "");
        setCompareText(data.product.compare_at_price_inr?.toString() ?? "");
        setStockText(data.product.stock_qty?.toString() ?? "");
      }
    });

  const whatsapp = v.mode === "whatsapp";

  return (
    <form
      className="space-y-6 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-muted hover:text-chilli lg:min-h-0">
          <ArrowLeft className="size-4" aria-hidden /> Products
        </Link>
        {id && (
          <div className="flex flex-wrap gap-2">
            <a
              href={`/products/${v.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-11 rounded-md border border-ink/25 bg-white px-3 lg:min-h-0 lg:py-2 text-sm hover:border-chilli hover:text-chilli"
            >
              <ExternalLink className="size-4" aria-hidden /> Preview
            </a>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => duplicateProduct(id), "Copy created (inactive)").then(
                  (r) => r.ok && r.data && router.push(`/admin/products/${(r.data as { id: string }).id}`),
                )
              }
              className="inline-flex items-center gap-1.5 min-h-11 rounded-md border border-ink/25 bg-white px-3 lg:min-h-0 lg:py-2 text-sm hover:border-chilli hover:text-chilli"
            >
              <Copy className="size-4" aria-hidden /> Duplicate
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Delete “${v.name}”? If it appears in past orders it will be deactivated instead.`)) return;
                void run(() => deleteProduct(id), "Done", { refresh: false }).then((r) => {
                  if (!r.ok) return;
                  if ((r.data as { deactivated: boolean } | undefined)?.deactivated)
                    toast("This product is in past orders, so it was deactivated instead of deleted.", "info");
                  router.push("/admin/products");
                });
              }}
              className="inline-flex items-center gap-1.5 min-h-11 rounded-md border border-chilli/40 bg-white px-3 lg:min-h-0 lg:py-2 text-sm text-chilli hover:bg-chilli hover:text-white"
            >
              <Trash2 className="size-4" aria-hidden /> Delete
            </button>
          </div>
        )}
      </div>

      <h1 className="font-serif text-3xl font-semibold">{id ? v.name || "Edit product" : "Add product"}</h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <Card title="Basics">
            <div className="space-y-4">
              <Field label="Name">
                <input
                  required
                  value={v.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setV((s) => ({ ...s, name, slug: slugTouched ? s.slug : slugify(name) }));
                  }}
                  className={inputCls}
                />
              </Field>
              <Field label="Web address" hint={`paperica.in/products/${v.slug || "…"}`}>
                <input
                  value={v.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                  className={inputCls}
                />
              </Field>
              <Field label="Short description" hint="One line, shown in search results and when shared.">
                <input value={v.short_description} onChange={(e) => set("short_description", e.target.value)} className={inputCls} />
              </Field>
              <div className="space-y-1.5 text-sm">
                <span className="font-medium">Description</span>
                <RichText value={v.description_html} onChange={(html) => set("description_html", html)} />
              </div>
              <div className="space-y-1.5 text-sm">
                <span className="font-medium">Details &amp; specifications</span>
                <RichText value={v.details_html} onChange={(html) => set("details_html", html)} minHeight="min-h-28" />
              </div>
            </div>
          </Card>

          <Card title="Images" description="Drag to reorder (or use the arrows). The first image is the main one; the second shows on hover.">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {v.images.map((img, i) => (
                <li
                  key={img.url + i}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== i) set("images", move(v.images, dragIndex, i));
                    setDragIndex(null);
                  }}
                  className={cn("space-y-2 rounded-md border border-taupe bg-white p-2", dragIndex === i && "opacity-50")}
                >
                  <div className="relative aspect-[4/5] cursor-grab overflow-hidden rounded bg-blush">
                    <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
                    <span className="absolute left-1 top-1 rounded bg-white/90 p-0.5 text-ink-muted">
                      <GripVertical className="size-4" aria-hidden />
                    </span>
                    {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-chilli px-1.5 text-[0.625rem] font-semibold uppercase text-white">Main</span>}
                  </div>
                  <input
                    value={img.alt}
                    onChange={(e) => setImage(i, { alt: e.target.value })}
                    placeholder="Describe the image"
                    aria-label={`Alt text for image ${i + 1}`}
                    className={cn(inputCls, "min-h-11 py-1.5 lg:min-h-0 lg:text-sm")}
                  />
                  <div className="flex justify-between">
                    <span className="flex gap-1">
                      <button type="button" disabled={i === 0} onClick={() => set("images", move(v.images, i, i - 1))} aria-label="Move earlier" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1 disabled:opacity-30">
                        <ArrowUp className="size-3.5 -rotate-90" aria-hidden />
                      </button>
                      <button type="button" disabled={i === v.images.length - 1} onClick={() => set("images", move(v.images, i, i + 1))} aria-label="Move later" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1 disabled:opacity-30">
                        <ArrowDown className="size-3.5 -rotate-90" aria-hidden />
                      </button>
                    </span>
                    <button type="button" onClick={() => set("images", v.images.filter((_, j) => j !== i))} aria-label={`Remove image ${i + 1}`} className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1 text-chilli">
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
              <li>
                <label
                  htmlFor={uploadId}
                  className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-ink/25 text-sm text-ink-muted hover:border-chilli hover:text-chilli"
                >
                  <ImagePlus className="size-7" aria-hidden />
                  {uploading ? `Uploading ${uploading}…` : "Add images"}
                </label>
                <input
                  id={uploadId}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    void onUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </li>
            </ul>
          </Card>

          <Card
            title="Options"
            description="Optional choices like colour or ruling. Leave the price empty to use the product price."
            actions={
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  set("variants", [
                    ...v.variants,
                    { id: null, label: "", option_group: v.variants.at(-1)?.option_group ?? "Colour", price_override: null, stock_qty: null },
                  ])
                }
              >
                <Plus className="size-4" aria-hidden /> Add option
              </Button>
            }
          >
            {v.variants.length === 0 ? (
              <p className="text-sm text-ink-muted">No options — customers buy the product as it is.</p>
            ) : (
              <ul className="space-y-3">
                {v.variants.map((variant, i) => (
                  <li key={variant.id ?? `new-${i}`} className="grid grid-cols-2 items-end gap-2 rounded-md bg-paper/40 p-3 sm:grid-cols-[1fr_1fr_8rem_7rem_auto]">
                    <Field label="Option type">
                      <input value={variant.option_group} onChange={(e) => setVariant(i, { option_group: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Choice">
                      <input value={variant.label} onChange={(e) => setVariant(i, { label: e.target.value })} placeholder="e.g. Blush Pink" className={inputCls} />
                    </Field>
                    <Field label="Option price (₹)">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variant.price_override ?? ""}
                        onChange={(e) => setVariant(i, { price_override: numOrNull(e.target.value) })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Option stock">
                      <input
                        type="number"
                        min={0}
                        value={variant.stock_qty ?? ""}
                        onChange={(e) => setVariant(i, { stock_qty: numOrNull(e.target.value) })}
                        className={inputCls}
                      />
                    </Field>
                    <div className="flex gap-1 pb-1">
                      <button type="button" disabled={i === 0} onClick={() => set("variants", move(v.variants, i, i - 1))} aria-label="Move up" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1.5 disabled:opacity-30">
                        <ArrowUp className="size-4" aria-hidden />
                      </button>
                      <button type="button" onClick={() => set("variants", v.variants.filter((_, j) => j !== i))} aria-label="Remove option" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1.5 text-chilli">
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <div className="space-y-3">
              <Toggle checked={v.is_active} onChange={(x) => set("is_active", x)} label="Active (visible in the shop)" />
              <Toggle checked={v.is_new} onChange={(x) => set("is_new", x)} label="New (shows the NEW badge and in New Collection)" />
              <Toggle checked={v.is_best_seller} onChange={(x) => set("is_best_seller", x)} label="Best Seller" />
            </div>
          </Card>

          <Card title="How customers get it">
            <fieldset className="space-y-2">
              <legend className="sr-only">Purchase mode</legend>
              {(
                [
                  ["buy", "Buy online", "Add to cart and pay with Razorpay."],
                  ["whatsapp", "Customise on WhatsApp", "No cart — customers message you to personalise. Required for PERSONALISED."],
                ] as const
              ).map(([value, label, hint]) => (
                <label key={value} className={cn("flex cursor-pointer gap-3 rounded-md border p-3", v.mode === value ? "border-chilli bg-blush/30" : "border-ink/20")}>
                  <input type="radio" name="mode" checked={v.mode === value} onChange={() => set("mode", value)} className="mt-1 size-4 accent-chilli" />
                  <span>
                    <span className="font-medium">{label}</span>
                    <span className="block text-xs text-ink-muted">{hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </Card>

          <Card title="Price">
            <div className="grid grid-cols-2 gap-4">
              <Field label={whatsapp ? "Starting price (₹)" : "Price (₹)"} hint={whatsapp ? "Leave empty for “Enquire for price”." : undefined}>
                <input type="number" min={0} step="0.01" required={!whatsapp} value={priceText} onChange={(e) => setPriceText(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Compare-at price (₹)" hint="Shows as a struck-out price.">
                <input type="number" min={0} step="0.01" value={compareText} onChange={(e) => setCompareText(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Badge text" hint="e.g. BESTSELLER, 3 FOR ₹999" className="col-span-2">
                <input value={v.badge_text} onChange={(e) => set("badge_text", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Card>

          <Card title="Stock">
            <div className="space-y-4">
              <Field label="SKU">
                <input value={v.sku} onChange={(e) => set("sku", e.target.value)} className={inputCls} />
              </Field>
              <Toggle checked={v.track_stock} onChange={(x) => set("track_stock", x)} label="Track stock" />
              {v.track_stock && (
                <>
                  <Field label="Stock quantity" hint={v.variants.length ? "Options with their own stock use that instead." : undefined}>
                    <input type="number" min={0} value={stockText} onChange={(e) => setStockText(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Low-stock message" hint="Optional — overrides the default “Selling Fast” line.">
                    <input value={v.low_stock_message} onChange={(e) => set("low_stock_message", e.target.value)} className={inputCls} />
                  </Field>
                </>
              )}
            </div>
          </Card>

          <Card title="Categories" description="Where the product appears. New, Best Sellers, Under ₹1,000 and Personalised Gifts fill themselves.">
            <div className="space-y-4">
              {categories.map((c) => {
                const choices = c.subcategories.filter((s) => !AUTOMATIC.includes(s.kind));
                if (choices.length === 0) return null;
                return (
                  <fieldset key={c.id}>
                    <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {c.name}
                      {c.defaultMode === "whatsapp" && <span className="ml-1 normal-case tracking-normal">(WhatsApp only)</span>}
                    </legend>
                    <div className="space-y-1.5">
                      {choices.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={v.subcategory_ids.includes(s.id)}
                            onChange={(e) =>
                              set("subcategory_ids", e.target.checked ? [...v.subcategory_ids, s.id] : v.subcategory_ids.filter((x) => x !== s.id))
                            }
                            className="size-4 accent-chilli"
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-taupe bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 md:px-4">
          {uploading > 0 && <span className="text-sm text-ink-muted">Waiting for images…</span>}
          <Button type="submit" size="lg" disabled={pending || uploading > 0} className="min-w-40">
            {pending ? "Saving…" : "Save product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
