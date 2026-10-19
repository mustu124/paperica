"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import { submitEnquiry } from "@/app/(site)/contact/actions";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ENQUIRY_TYPES, enquirySchema, enquiryWhatsappMessage, type Enquiry, type EnquiryInput } from "@/lib/enquiry";
import { cn } from "@/lib/cn";
import { whatsappUrl } from "@/lib/whatsapp";
import type { EnquiryType } from "@/types/db";

const inputCls =
  "w-full border border-ink/30 bg-white px-3 py-2.5 text-base focus:border-chilli focus:outline-none aria-[invalid=true]:border-chilli";

function Field({ label, error, optional, children }: { label: string; error?: FieldError; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
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

/**
 * Contact form. Routing by enquiry type:
 *   Customer Support     → saved enquiry (admin inbox)
 *   Personalised Orders  → opens WhatsApp with the details pre-filled (not stored)
 *   Corporate Gifting    → WhatsApp, or the short enquiry form (saved)
 */
export function EnquiryForm({
  whatsappNumber,
  whatsappIntro,
  defaultType,
}: {
  whatsappNumber: string;
  whatsappIntro: string;
  defaultType?: EnquiryType;
}) {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [via, setVia] = useState<"whatsapp" | "form">("form");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EnquiryInput, unknown, Enquiry>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { enquiryType: defaultType ?? "customer_support", website: "" },
    mode: "onTouched",
  });
  const type = useWatch({ control, name: "enquiryType" }) as EnquiryType;
  const whatsappOnly = type === "personalised_orders";
  const corporate = type === "corporate_gifting";

  const onSubmit = (values: Enquiry) => {
    setServerError(null);
    if (whatsappOnly || via === "whatsapp") {
      if (!whatsappNumber) {
        setServerError("WhatsApp isn't available right now — please email us instead.");
        return;
      }
      window.open(whatsappUrl(whatsappNumber, enquiryWhatsappMessage(whatsappIntro, values)), "_blank", "noopener,noreferrer");
      return;
    }
    startTransition(async () => {
      const result = await submitEnquiry(values);
      if (result.ok) setSent(true);
      else setServerError(result.error);
    });
  };

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 border border-taupe bg-paper/40 px-6 py-12 text-center">
        <CheckCircle2 className="size-10 text-stem-deep" strokeWidth={1.5} aria-hidden />
        <p className="font-serif text-2xl font-semibold">Thank you — we&apos;ve received your message</p>
        <p className="text-sm text-ink-muted">We&apos;ll get back to you by email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name}>
          <input {...register("name")} autoComplete="name" aria-invalid={!!errors.name} className={inputCls} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input {...register("email")} type="email" autoComplete="email" aria-invalid={!!errors.email} className={inputCls} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Enquiry type" error={errors.enquiryType}>
          <select {...register("enquiryType")} className={inputCls}>
            {ENQUIRY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Order number" optional error={errors.orderNumber}>
          <input {...register("orderNumber")} placeholder="PPR-000123" className={inputCls} />
        </Field>
      </div>
      {!whatsappOnly && (
        <Field label="Mobile number" optional error={errors.phone}>
          <input {...register("phone")} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="So we can reply on WhatsApp" className={inputCls} />
        </Field>
      )}

      {corporate && (
        <fieldset className="grid gap-4 border-l-2 border-blush pl-4 sm:grid-cols-2">
          <legend className="mb-2 text-xs uppercase tracking-[0.2em] text-ink-muted">Corporate gifting details</legend>
          <Field label="Company or organisation" optional error={errors.company}>
            <input {...register("company")} autoComplete="organization" className={inputCls} />
          </Field>
          <Field label="Estimated quantity" optional error={errors.quantity}>
            <input {...register("quantity")} inputMode="numeric" className={inputCls} />
          </Field>
          <Field label="Budget (per gift or overall)" optional error={errors.budget}>
            <input {...register("budget")} className={inputCls} />
          </Field>
          <Field label="Preferred delivery date" optional error={errors.deliveryDate}>
            <input {...register("deliveryDate")} type="date" className={inputCls} />
          </Field>
          <Field label="Delivery destination" optional error={errors.destination}>
            <input {...register("destination")} placeholder="City / PIN code" className={inputCls} />
          </Field>
        </fieldset>
      )}

      <Field
        label={corporate ? "Occasion and branding requirements" : whatsappOnly ? "What would you like personalised?" : "Message"}
        error={errors.message}
      >
        <textarea {...register("message")} rows={5} aria-invalid={!!errors.message} className={inputCls} />
      </Field>

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input {...register("website")} tabIndex={-1} autoComplete="off" />
      </div>

      {serverError && (
        <p role="alert" className="border-l-2 border-chilli bg-blush/40 px-4 py-3 text-sm">
          {serverError}
        </p>
      )}

      <div className={cn("flex flex-col gap-3", corporate && "sm:flex-row")}>
        {(whatsappOnly || corporate) && whatsappNumber && (
          <Button type="submit" size="lg" onClick={() => setVia("whatsapp")} className={corporate ? "sm:flex-1" : undefined}>
            <WhatsAppIcon />
            {whatsappOnly ? "Continue on WhatsApp" : "Send on WhatsApp"}
          </Button>
        )}
        {!whatsappOnly && (
          <Button
            type="submit"
            size="lg"
            variant={corporate ? "secondary" : "primary"}
            disabled={pending}
            onClick={() => setVia("form")}
            className={corporate ? "sm:flex-1" : undefined}
          >
            <Send className="size-4" aria-hidden />
            {pending ? "Sending…" : corporate ? "Submit enquiry" : "Send message"}
          </Button>
        )}
      </div>
      {whatsappOnly && (
        <p className="text-xs text-ink-muted">
          Personalised orders are arranged on WhatsApp, where we can share designs and confirm details with you.
        </p>
      )}
    </form>
  );
}
