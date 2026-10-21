"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Card, Field, inputCls, Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import type { SubcategoryKind } from "@/types/db";
import { addSubcategory, deleteSubcategory, moveCategory, moveSubcategory, saveCategory, saveSubcategory } from "./actions";

type Feature = { url: string; alt: string; label: string; link_url: string };

const KIND_NOTE: Partial<Record<SubcategoryKind, string>> = {
  view_all: "Shows everything in this head",
  filter_new: "Automatic: products marked New",
  filter_best: "Automatic: products marked Best Seller",
  filter_under_1000: "Automatic: under ₹1,000",
  filter_personalised: "Automatic: WhatsApp-mode products",
  content_page: "Page — edit its text in Pages & FAQs",
};

function SubRow({
  sub,
  isFirst,
  isLast,
}: {
  sub: { id: string; name: string; slug: string; kind: SubcategoryKind; description: string; footerNote: string; linkUrl: string };
  isFirst: boolean;
  isLast: boolean;
}) {
  const [name, setName] = useState(sub.name);
  const [description, setDescription] = useState(sub.description);
  const [footerNote, setFooterNote] = useState(sub.footerNote);
  const [linkUrl, setLinkUrl] = useState(sub.linkUrl);
  const [moreOpen, setMoreOpen] = useState(Boolean(sub.footerNote || sub.linkUrl));
  const { run, pending } = useSave();
  const noteDirty = footerNote !== sub.footerNote;
  const linkDirty = linkUrl !== sub.linkUrl;
  const dirty = name !== sub.name || description !== sub.description || noteDirty || linkDirty;

  return (
    <li className="grid gap-2 rounded-md bg-paper/40 p-3 md:grid-cols-[auto_1fr_1.4fr_auto] md:items-center">
      <div className="flex gap-1">
        <button type="button" disabled={pending || isFirst} onClick={() => run(() => moveSubcategory(sub.id, "up"), "Moved")} aria-label={`Move ${sub.name} up`} className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 bg-white p-1 disabled:opacity-30">
          <ArrowUp className="size-4" aria-hidden />
        </button>
        <button type="button" disabled={pending || isLast} onClick={() => run(() => moveSubcategory(sub.id, "down"), "Moved")} aria-label={`Move ${sub.name} down`} className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 bg-white p-1 disabled:opacity-30">
          <ArrowDown className="size-4" aria-hidden />
        </button>
      </div>
      <div>
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Subcategory name" className={`${inputCls} py-1.5`} />
        {KIND_NOTE[sub.kind] && <p className="mt-0.5 text-xs text-ink-muted">{KIND_NOTE[sub.kind]}</p>}
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        aria-label={`${sub.name} description`}
        className={`${inputCls} py-1.5 lg:text-sm`}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!dirty || pending}
          onClick={() =>
            run(() =>
              saveSubcategory(sub.id, {
                name,
                description,
                ...(noteDirty ? { footer_note: footerNote } : {}),
                ...(linkDirty ? { link_url: linkUrl } : {}),
              }),
            )
          }
        >
          Save
        </Button>
        {sub.kind === "manual" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => window.confirm(`Delete “${sub.name}”? Products in it are not deleted.`) && run(() => deleteSubcategory(sub.id), "Subcategory deleted")}
            aria-label={`Delete ${sub.name}`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 bg-white px-2 text-chilli"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {sub.kind === "manual" &&
        (moreOpen ? (
          <div className="grid gap-3 md:col-span-4">
            <label className="flex flex-col gap-1 text-xs text-ink-muted">
              Opens this page instead (optional) — e.g. a product: /products/the-little-things-set. Leave empty to show this section&apos;s products.
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/products/…" className={`${inputCls} py-1.5 text-sm text-ink`} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-muted">
              Note at the bottom of this page — first paragraph is the heading; a “Chat on WhatsApp” button is added. Leave empty for none.
              <textarea rows={4} value={footerNote} onChange={(e) => setFooterNote(e.target.value)} className={`${inputCls} text-sm text-ink`} />
            </label>
          </div>
        ) : (
          <button type="button" onClick={() => setMoreOpen(true)} className="justify-self-start text-xs text-chilli underline underline-offset-4 md:col-span-4">
            Link or note…
          </button>
        ))}
    </li>
  );
}

export function CategoryEditor({
  category,
  subcategories,
  isFirst,
  isLast,
}: {
  category: { id: string; name: string; slug: string; showInMenu: boolean; description: string; footerNote: string; imageUrl: string | null; features: Feature[] };
  subcategories: { id: string; name: string; slug: string; kind: SubcategoryKind; description: string; footerNote: string; linkUrl: string }[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [name, setName] = useState(category.name);
  const [show, setShow] = useState(category.showInMenu);
  const [description, setDescription] = useState(category.description);
  const [footerNote, setFooterNote] = useState(category.footerNote);
  const [imageUrl, setImageUrl] = useState(category.imageUrl);
  const [features, setFeatures] = useState<Feature[]>(
    [0, 1, 2, 3, 4].map((i) => category.features[i] ?? { url: "", alt: "", label: "", link_url: "" }),
  );
  const [newSub, setNewSub] = useState("");
  const { run, pending } = useSave();
  const setFeature = (i: number, patch: Partial<Feature>) => setFeatures((f) => f.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <Card
      title={
        <span className="flex items-center gap-3">
          {category.name}
          <span className="text-xs font-normal text-ink-muted">/collections/{category.slug}</span>
        </span>
      }
      actions={
        <div className="flex gap-1">
          <button type="button" disabled={pending || isFirst} onClick={() => run(() => moveCategory(category.id, "up"), "Moved up")} aria-label={`Move ${category.name} earlier in the menu`} className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1.5 disabled:opacity-30">
            <ArrowUp className="size-4" aria-hidden />
          </button>
          <button type="button" disabled={pending || isLast} onClick={() => run(() => moveCategory(category.id, "down"), "Moved down")} aria-label={`Move ${category.name} later in the menu`} className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1.5 disabled:opacity-30">
            <ArrowDown className="size-4" aria-hidden />
          </button>
        </div>
      }
    >
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() =>
            saveCategory(category.id, {
              name,
              show_in_menu: show,
              description,
              image_url: imageUrl,
              menu_feature_images: features,
              ...(footerNote !== category.footerNote ? { footer_note: footerNote } : {}),
            }),
          );
        }}
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <Field label="Menu name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <Toggle checked={show} onChange={setShow} label="Show in the menu" />
            <Field label="Description (optional)" hint="Shown under the title on the collection page.">
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Note at the bottom of the page (optional)" hint="First paragraph is the heading; a “Chat on WhatsApp” button is added.">
              <textarea rows={4} value={footerNote} onChange={(e) => setFooterNote(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <ImageUpload label="Collection image" folder="categories" value={imageUrl} onChange={setImageUrl} className="w-36" />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Mega-menu feature images (up to 5)</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="grid grid-cols-[7rem_1fr] gap-3 rounded-md border border-taupe p-3">
                <ImageUpload label={`Image ${i + 1}`} folder="categories" value={f.url || null} onChange={(url) => setFeature(i, { url: url ?? "" })} />
                <div className="space-y-2">
                  <Field label="Caption">
                    <input value={f.label} onChange={(e) => setFeature(i, { label: e.target.value })} className={`${inputCls} py-1.5`} />
                  </Field>
                  <Field label="Link">
                    <input value={f.link_url} onChange={(e) => setFeature(i, { link_url: e.target.value })} placeholder={`/collections/${category.slug}`} className={`${inputCls} py-1.5`} />
                  </Field>
                  <Field label="Image description">
                    <input value={f.alt} onChange={(e) => setFeature(i, { alt: e.target.value })} className={`${inputCls} py-1.5`} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : `Save ${category.name}`}
        </Button>
      </form>

      <div className="mt-8 border-t border-taupe pt-5">
        <p className="mb-3 text-sm font-medium">Subcategories</p>
        <ul className="space-y-2">
          {subcategories.map((s, i) => (
            <SubRow key={s.id} sub={s} isFirst={i === 0} isLast={i === subcategories.length - 1} />
          ))}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => addSubcategory(category.id, newSub), "Subcategory added").then((r) => r.ok && setNewSub(""));
          }}
        >
          <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="New subcategory name" aria-label={`New subcategory in ${category.name}`} className={inputCls} />
          <Button type="submit" variant="secondary" disabled={pending || !newSub.trim()}>
            <Plus className="size-4" aria-hidden /> Add
          </Button>
        </form>
      </div>
    </Card>
  );
}
