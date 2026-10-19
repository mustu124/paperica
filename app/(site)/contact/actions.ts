"use server";

import { headers } from "next/headers";
import { enquirySchema, type EnquiryInput } from "@/lib/enquiry";
import { onEnquiryReceived } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export type EnquiryResult = { ok: true } | { ok: false; error: string };

/**
 * Saves a contact-form enquiry (Customer Support or the Corporate Gifting short form).
 * Personalised Orders are handled on WhatsApp, so they are not stored here.
 */
export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  if (!(await rateLimit(await headers(), "enquiry", 5, 600))) {
    return { ok: false, error: "Too many messages from your connection. Please try again in a few minutes." };
  }

  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const e = parsed.data;

  // Honeypot: pretend success so bots learn nothing.
  if (e.website) return { ok: true };
  if (e.enquiryType === "personalised_orders") {
    return { ok: false, error: "Personalised orders are handled on WhatsApp — please use the WhatsApp button." };
  }

  const details =
    e.enquiryType === "corporate_gifting"
      ? Object.fromEntries(
          Object.entries({
            company: e.company,
            quantity: e.quantity,
            budget: e.budget,
            delivery_date: e.deliveryDate,
            destination: e.destination,
          }).filter(([, v]) => v),
        )
      : {};

  const { data, error } = await createAdminClient()
    .from("enquiries")
    .insert({
      enquiry_type: e.enquiryType,
      name: e.name,
      email: e.email,
      order_number: e.orderNumber || null,
      phone: e.phone || null,
      message: e.message,
      details,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[contact] saving enquiry failed:", error?.message);
    return { ok: false, error: "We couldn't send your message. Please email or WhatsApp us instead." };
  }
  await onEnquiryReceived(data.id);
  return { ok: true };
}
