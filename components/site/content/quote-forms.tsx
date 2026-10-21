"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import {
  corporateMessage,
  corporateSchema,
  customOrderMessage,
  customOrderSchema,
  type Corporate,
  type CorporateConfig,
  type CorporateInput,
  type CustomOrder,
  type CustomOrderConfig,
  type CustomOrderInput,
} from "@/lib/enquiry-forms";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";

const inputCls =
  "w-full border border-ink/30 bg-white px-3 py-2.5 text-base focus:border-chilli focus:outline-none aria-[invalid=true]:border-chilli";
// Radio / checkbox drawn as a pill: the input is visually hidden, the label carries the style.
const pillCls =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-ink/25 bg-white px-4 text-sm transition has-[:checked]:border-chilli has-[:checked]:bg-chilli has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-chilli has-[:focus-visible]:ring-offset-2 hover:border-chilli";

function Field({ label, error, optional, className, children }: { label: string; error?: FieldError; optional?: boolean; className?: string; children: ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1 text-sm", className)}>
      <span>
        {label}
        {optional && <span className="text-ink-muted"> (optional)</span>}
      </span>
      {children}
      {error?.message && (
        <span role="alert" className="text-xs text-chilli">
          {error.message}
        </span>
      )}
    </label>
  );
}

function Group({ legend, hint, error, children }: { legend: string; hint?: ReactNode; error?: FieldError; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 font-serif text-xl font-bold text-chilli">{legend}</legend>
      {hint && <p className="-mt-2 text-xs text-ink-muted">{hint}</p>}
      {children}
      {error?.message && (
        <span role="alert" className="text-xs text-chilli">
          {error.message}
        </span>
      )}
    </fieldset>
  );
}

function ExtraTag({ text }: { text: string }) {
  if (!text) return null;
  return <span className="rounded-full bg-butter px-2 py-0.5 text-[0.6875rem] font-medium text-ink">{text}</span>;
}

/** After the button: WhatsApp has opened in a new tab (or the number is missing). */
function Opened({ onBack }: { onBack: () => void }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 border border-taupe bg-paper/40 px-6 py-10 text-center">
      <CheckCircle2 className="size-10 text-stem-deep" strokeWidth={1.5} aria-hidden />
      <p className="font-serif text-2xl font-semibold">WhatsApp is open with your brief</p>
      <p className="max-w-md text-sm text-ink-muted">Check the message and tap Send. We&apos;ll reply on WhatsApp to confirm the details and your final price.</p>
      <button type="button" onClick={onBack} className="min-h-11 text-sm font-medium text-chilli underline underline-offset-4">
        Change my answers
      </button>
    </div>
  );
}

function openWhatsapp(number: string, message: string) {
  window.open(whatsappUrl(number, message), "_blank", "noopener,noreferrer");
}

const NO_WHATSAPP = "WhatsApp isn't available right now — please email us instead.";

/** Custom Orders: guided brief (format → cover → inside pages → extras → quantity) sent on WhatsApp. */
export function CustomOrderForm({
  config,
  whatsappNumber,
  intro,
  ctaLabel,
}: {
  config: CustomOrderConfig;
  whatsappNumber: string;
  intro: string;
  ctaLabel: string;
}) {
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CustomOrderInput, unknown, CustomOrder>({
    resolver: zodResolver(customOrderSchema),
    defaultValues: { format: "", quantity: "1", extras: config.extras.map(() => "") },
    mode: "onTouched",
  });
  const formatLabel = useWatch({ control, name: "format" });
  const photoBook = Boolean(config.formats.find((f) => f.label === formatLabel)?.photo_book);

  const onSubmit = (values: CustomOrder) => {
    if (!whatsappNumber) return setError(NO_WHATSAPP);
    setError(null);
    openWhatsapp(whatsappNumber, customOrderMessage(intro, config, values));
    setOpened(true);
  };

  if (opened) return <Opened onBack={() => setOpened(false)} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      {config.formats.length > 0 && (
        <Group legend="1. Choose your format" hint="Indicative prices — your final quote comes on WhatsApp." error={errors.format}>
          <div className="grid gap-3 sm:grid-cols-2">
            {config.formats.map((f) => (
              <label
                key={f.label}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-3 border border-ink/25 bg-white px-4 py-3 transition hover:border-chilli has-[:checked]:border-chilli has-[:checked]:bg-blush/60 has-[:checked]:ring-1 has-[:checked]:ring-chilli has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-chilli"
              >
                <span className="flex items-center gap-3">
                  <input type="radio" value={f.label} {...register("format")} className="size-4 accent-chilli" />
                  <span className="font-medium">{f.label}</span>
                </span>
                {f.price != null && <span className="shrink-0 text-sm text-chilli">{formatINR(f.price)}</span>}
              </label>
            ))}
          </div>
        </Group>
      )}

      {photoBook ? (
        <Group legend="2. Your photo book" hint="Tell us a little about the photos and how you'd like them laid out.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of photos" optional error={errors.photoCount}>
              <input {...register("photoCount")} inputMode="numeric" placeholder="e.g. 40" className={inputCls} />
            </Field>
            <Field label="Layout" optional error={errors.photoLayout}>
              <input {...register("photoLayout")} placeholder="e.g. one photo per page, collage, captions" className={inputCls} />
            </Field>
            <Field label="Personalisation" optional error={errors.personalisation} className="sm:col-span-2">
              <textarea {...register("personalisation")} rows={3} placeholder="Names, dates, a title or message for the cover" className={inputCls} />
            </Field>
          </div>
        </Group>
      ) : (
        <>
          <Group legend="2. Cover preference">
            <Field label="Describe the cover you have in mind" optional error={errors.cover}>
              <textarea {...register("cover")} rows={3} placeholder="Theme, colours, a name or initials, or a reference you love" className={inputCls} />
            </Field>
          </Group>

          {config.page_types.length > 0 && (
            <Group legend="3. Inside pages">
              <div className="flex flex-wrap gap-2">
                {config.page_types.map((p) => (
                  <label key={p.label} className={pillCls}>
                    <input type="radio" value={p.label} {...register("pages")} className="sr-only" />
                    {p.label}
                    {p.extra && <span aria-hidden>*</span>}
                  </label>
                ))}
              </div>
              {config.page_types.some((p) => p.extra) && config.extra_label && (
                <p className="text-xs text-ink-muted">* {config.extra_label}</p>
              )}
            </Group>
          )}

          {config.extras.length > 0 && (
            <Group legend="4. Extras">
              <ul className="flex flex-col divide-y divide-taupe border-y border-taupe">
                {config.extras.map((e, i) => (
                  <li key={e.label} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex flex-wrap items-center gap-2 text-sm" id={`extra-${i}`}>
                      {e.label}
                      {e.extra && <ExtraTag text={config.extra_label} />}
                    </span>
                    <span role="radiogroup" aria-labelledby={`extra-${i}`} className="flex gap-2">
                      {(["yes", "no"] as const).map((answer) => (
                        <label key={answer} className={cn(pillCls, "px-5")}>
                          <input type="radio" value={answer} {...register(`extras.${i}`)} className="sr-only" />
                          {answer === "yes" ? "Yes" : "No"}
                        </label>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </Group>
          )}
        </>
      )}

      <Group legend={photoBook ? "3. Anything else" : "5. Anything else"}>
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Quantity" error={errors.quantity}>
            <input {...register("quantity")} inputMode="numeric" aria-invalid={!!errors.quantity} className={inputCls} />
          </Field>
          <Field label="Your name" optional error={errors.name}>
            <input {...register("name")} autoComplete="name" className={inputCls} />
          </Field>
          <Field label="Additional requirements" optional error={errors.notes} className="sm:col-span-2">
            <textarea {...register("notes")} rows={4} placeholder="Size, deadline, a gift message, anything we should know" className={inputCls} />
          </Field>
        </div>
      </Group>

      <div className="flex flex-col gap-3 border-t border-taupe pt-6">
        {config.note && <p className="text-sm text-ink-muted">{config.note}</p>}
        {error && (
          <p role="alert" className="text-sm text-chilli">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="sm:self-start sm:min-w-72">
          <WhatsAppIcon />
          {ctaLabel || "Get My Quote on WhatsApp"}
        </Button>
      </div>
    </form>
  );
}

/** Corporate Gifting: enquiry brief sent on WhatsApp. No prices or minimums. */
export function CorporateForm({
  config,
  whatsappNumber,
  intro,
  ctaLabel,
}: {
  config: CorporateConfig;
  whatsappNumber: string;
  intro: string;
  ctaLabel: string;
}) {
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CorporateInput, unknown, Corporate>({
    resolver: zodResolver(corporateSchema),
    defaultValues: { giftingTypes: [], products: [] },
    mode: "onTouched",
  });

  const onSubmit = (values: Corporate) => {
    if (!whatsappNumber) return setError(NO_WHATSAPP);
    setError(null);
    openWhatsapp(whatsappNumber, corporateMessage(intro, values));
    setOpened(true);
  };

  if (opened) return <Opened onBack={() => setOpened(false)} />;

  const checkList = (name: "giftingTypes" | "products", list: CorporateConfig["products"]) => (
    <div className="flex flex-wrap gap-2">
      {list.map((o) => (
        <label key={o.label} className={pillCls}>
          <input type="checkbox" value={o.label} {...register(name)} className="sr-only" />
          {o.label}
        </label>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <Group legend="Your details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" error={errors.company}>
            <input {...register("company")} autoComplete="organization" aria-invalid={!!errors.company} className={inputCls} />
          </Field>
          <Field label="Contact person" error={errors.contact}>
            <input {...register("contact")} autoComplete="name" aria-invalid={!!errors.contact} className={inputCls} />
          </Field>
          <Field label="Phone / WhatsApp" error={errors.phone}>
            <input {...register("phone")} type="tel" inputMode="numeric" autoComplete="tel-national" aria-invalid={!!errors.phone} className={inputCls} />
          </Field>
          <Field label="Email" optional error={errors.email}>
            <input {...register("email")} type="email" autoComplete="email" aria-invalid={!!errors.email} className={inputCls} />
          </Field>
        </div>
      </Group>

      {config.gifting_types.length > 0 && <Group legend="Type of gifting">{checkList("giftingTypes", config.gifting_types)}</Group>}
      {config.products.length > 0 && <Group legend="Products of interest">{checkList("products", config.products)}</Group>}

      <Group legend="Quantity, budget & timing">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Approximate quantity" optional error={errors.quantity}>
            <input {...register("quantity")} inputMode="numeric" className={inputCls} />
          </Field>
          <Field label="Budget" optional error={errors.budget}>
            <input {...register("budget")} placeholder="Per gift or overall" className={inputCls} />
          </Field>
          <Field label="Required delivery date" optional error={errors.deliveryDate}>
            <input {...register("deliveryDate")} type="date" className={inputCls} />
          </Field>
          <Field label="Branding requirements and additional notes" optional error={errors.notes} className="sm:col-span-3">
            <textarea {...register("notes")} rows={4} placeholder="Logo, brand colours, a message, packaging, the occasion" className={inputCls} />
          </Field>
        </div>
      </Group>

      <div className="flex flex-col gap-3 border-t border-taupe pt-6">
        {config.note && <p className="text-sm text-ink-muted">{config.note}</p>}
        {error && (
          <p role="alert" className="text-sm text-chilli">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="sm:self-start sm:min-w-72">
          <WhatsAppIcon />
          {ctaLabel || "Discuss Your Corporate Gifting Requirements"}
        </Button>
      </div>
    </form>
  );
}
