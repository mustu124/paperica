"use client";

import { Gift, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, EmptyState, Field, inputCls, Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import { todayInIndia, type Offer, type OfferScope } from "@/lib/offer";
import { cn } from "@/lib/cn";
import { saveOffers } from "./actions";

export type ScopeOption = { group: string; value: string; label: string; phrase: string };
type ProductOption = { id: string; name: string; slug: string; hidden: boolean };

const scopeValue = (s: OfferScope) => (s.kind === "new" ? "new" : `${s.kind}:${s.id}`);
function scopeFrom(value: string): OfferScope {
  if (value === "new") return { kind: "new" };
  const [kind, id] = value.split(":");
  return kind === "category" ? { kind: "category", id } : { kind: "subcategory", id };
}

const QUANTITIES = Array.from({ length: 10 }, (_, i) => i + 1);

function status(o: Offer) {
  const today = todayInIndia();
  if (!o.enabled) return { label: "Off", cls: "bg-taupe/60 text-ink" };
  if (o.starts_on && o.starts_on > today) return { label: "Scheduled", cls: "bg-butter text-ink" };
  if (o.ends_on && o.ends_on < today) return { label: "Ended", cls: "bg-taupe/60 text-ink" };
  return { label: "Running", cls: "bg-stem-deep text-white" };
}

/** Every offer on one page; each is built from dropdowns, and the customer-facing wording writes itself. */
export function OffersForm({ initial, scopes, products }: { initial: Offer[]; scopes: ScopeOption[]; products: ProductOption[] }) {
  const [offers, setOffers] = useState<Offer[]>(initial);
  const { run, pending } = useSave();

  const suggest = (o: Offer) => {
    const phrase = scopes.find((s) => s.value === scopeValue(o.scope))?.phrase ?? "";
    const gift = products.find((p) => p.id === o.gift_product_id)?.name;
    return gift ? `Buy any ${o.min_qty} ${phrase}, get ${gift} free`.replace(/\s+/g, " ") : "";
  };
  // Changing a choice rewrites the wording, unless it has been reworded by hand.
  const update = (i: number, patch: Partial<Offer>) =>
    setOffers((list) =>
      list.map((o, j) => {
        if (j !== i) return o;
        const next = { ...o, ...patch };
        const autoWording = !o.text || o.text === suggest(o);
        return "text" in patch || !autoWording ? next : { ...next, text: suggest(next) };
      }),
    );

  const add = () =>
    setOffers((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        enabled: true,
        scope: { kind: "new" },
        min_qty: 2,
        gift_product_id: null,
        gift_slug: "",
        text: "",
        starts_on: null,
        ends_on: null,
      },
    ]);

  const groups = [...new Set(scopes.map((s) => s.group))];

  return (
    <form
      className="space-y-6 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () =>
            saveOffers(
              offers.map((o) => ({ ...o, gift_slug: products.find((p) => p.id === o.gift_product_id)?.slug ?? o.gift_slug, text: o.text || suggest(o) })),
            ),
          "Offers saved",
        );
      }}
    >
      {offers.length === 0 && <EmptyState>No offers yet. Tap “Add offer” to create one.</EmptyState>}

      {offers.map((o, i) => {
        const st = status(o);
        return (
          <Card
            key={o.id}
            title={
              <span className="flex flex-wrap items-center gap-3">
                <Gift className="size-5 text-chilli" aria-hidden />
                {o.text || suggest(o) || "New offer"}
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", st.cls)}>{st.label}</span>
              </span>
            }
            actions={
              <button
                type="button"
                onClick={() => window.confirm("Delete this offer?") && setOffers((list) => list.filter((_, j) => j !== i))}
                aria-label="Delete offer"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-ink/20 bg-white text-chilli lg:min-h-0 lg:min-w-0 lg:p-1.5"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            }
          >
            <div className="space-y-5">
              <Toggle checked={o.enabled} onChange={(v) => update(i, { enabled: v })} label="Offer is on" />

              <div className="grid gap-4 md:grid-cols-[2fr_1fr_2fr]">
                <Field label="Customer buys any">
                  <select value={scopeValue(o.scope)} onChange={(e) => update(i, { scope: scopeFrom(e.target.value) })} className={inputCls}>
                    {groups.map((g) => (
                      <optgroup key={g} label={g}>
                        {scopes
                          .filter((s) => s.group === g)
                          .map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>
                <Field label="How many">
                  <select value={o.min_qty} onChange={(e) => update(i, { min_qty: Number(e.target.value) })} className={inputCls}>
                    {QUANTITIES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Gets free" hint="One per order. It doesn't count towards the offer itself.">
                  <select value={o.gift_product_id ?? ""} onChange={(e) => update(i, { gift_product_id: e.target.value || null })} className={inputCls}>
                    <option value="">Choose a product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.hidden ? " (hidden)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:max-w-xl">
                <Field label="Starts (optional)">
                  <input type="date" value={o.starts_on ?? ""} onChange={(e) => update(i, { starts_on: e.target.value || null })} className={inputCls} />
                </Field>
                <Field label="Ends (optional)" hint="The offer runs to the end of this day.">
                  <input type="date" value={o.ends_on ?? ""} onChange={(e) => update(i, { ends_on: e.target.value || null })} className={inputCls} />
                </Field>
              </div>

              <Field
                label="Wording customers see"
                hint={
                  o.text && o.text !== suggest(o) && suggest(o) ? (
                    <button type="button" onClick={() => update(i, { text: suggest(o) })} className="text-chilli underline underline-offset-2">
                      Use the suggested wording: “{suggest(o)}”
                    </button>
                  ) : (
                    "Written for you from the choices above. You can reword it."
                  )
                }
              >
                <input value={o.text} onChange={(e) => update(i, { text: e.target.value })} placeholder={suggest(o)} className={inputCls} />
              </Field>
            </div>
          </Card>
        );
      })}

      <Button type="button" variant="secondary" onClick={add}>
        <Plus className="size-4" aria-hidden /> Add offer
      </Button>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-taupe bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl justify-end md:px-4">
          <Button type="submit" size="lg" disabled={pending} className="min-w-40">
            {pending ? "Saving…" : "Save offers"}
          </Button>
        </div>
      </div>
    </form>
  );
}
