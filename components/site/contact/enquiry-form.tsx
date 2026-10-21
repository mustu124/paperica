"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ENQUIRY_TYPES, enquirySchema, enquiryWhatsappMessage, type Enquiry, type EnquiryInput } from "@/lib/enquiry";
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
 * Contact form. Nothing is stored: the message opens in WhatsApp with the details filled in
 * (or in the customer's email app when no WhatsApp number is set).
 */
export function EnquiryForm({
  whatsappNumber,
  whatsappIntro,
  contactEmail,
  defaultType,
}: {
  whatsappNumber: string;
  whatsappIntro: string;
  contactEmail: string;
  defaultType?: EnquiryType;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

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
    if (values.website) return; // honeypot
    const message = enquiryWhatsappMessage(whatsappIntro, values);
    if (whatsappNumber) {
      window.open(whatsappUrl(whatsappNumber, message), "_blank", "noopener,noreferrer");
    } else if (contactEmail) {
      window.location.assign(`mailto:${contactEmail}?subject=${encodeURIComponent("Enquiry from the website")}&body=${encodeURIComponent(message)}`);
    } else {
      setServerError("We can't take messages here right now. Please try again later.");
    }
  };

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

      <Button type="submit" size="lg" className="sm:self-start sm:min-w-64">
        {whatsappNumber ? <WhatsAppIcon /> : <Mail className="size-4" aria-hidden />}
        {whatsappNumber ? "Send on WhatsApp" : "Send by email"}
      </Button>
      {whatsappOnly && (
        <p className="text-xs text-ink-muted">
          Personalised orders are arranged on WhatsApp, where we can share designs and confirm details with you.
        </p>
      )}
    </form>
  );
}
