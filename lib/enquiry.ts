// Contact-page enquiry form: shared schema + WhatsApp message builder (browser and server).
import { z } from "zod";
import type { EnquiryType } from "@/types/db";

// Shared with the browser: skip zod's `new Function` probe, which the CSP (no 'unsafe-eval') reports.
z.config({ jitless: true });

export const ENQUIRY_TYPES: { value: EnquiryType; label: string }[] = [
  { value: "customer_support", label: "Customer Support" },
  { value: "personalised_orders", label: "Personalised Orders" },
  { value: "corporate_gifting", label: "Corporate Gifting" },
];

export const enquiryTypeLabel = (t: EnquiryType) => ENQUIRY_TYPES.find((e) => e.value === t)?.label ?? t;

const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(200)),
  orderNumber: optional(20),
  // Optional, so the shop can reply on WhatsApp.
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, "").replace(/^(?:\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^([6-9]\d{9})?$/, "Enter a 10-digit mobile number, or leave it empty"))
    .optional(),
  enquiryType: z.enum(["customer_support", "personalised_orders", "corporate_gifting"], {
    error: "Choose an enquiry type",
  }),
  message: z.string().trim().min(5, "Tell us a little more").max(2000),
  // Corporate gifting short form (all optional)
  company: optional(150),
  quantity: optional(50),
  budget: optional(100),
  deliveryDate: optional(50),
  destination: optional(150),
  website: z.string().optional(), // honeypot
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;

/**
 * WhatsApp message for an enquiry. `intro` comes from site_settings.whatsapp_enquiry_intro,
 * where {type} is replaced with the enquiry type.
 */
export function enquiryWhatsappMessage(intro: string, e: Partial<Enquiry> & { enquiryType: EnquiryType }) {
  const lines: string[] = [
    (intro || "Hi! I have a {type} enquiry.").replaceAll("{type}", enquiryTypeLabel(e.enquiryType)),
  ];
  if (e.name) lines.push(`Name: ${e.name}`);
  if (e.email) lines.push(`Email: ${e.email}`);
  if (e.orderNumber) lines.push(`Order number: ${e.orderNumber}`);
  if (e.enquiryType === "corporate_gifting") {
    lines.push(
      `Company or organisation: ${e.company ?? ""}`,
      `Estimated quantity: ${e.quantity ?? ""}`,
      `Budget: ${e.budget ?? ""}`,
      `Preferred delivery date: ${e.deliveryDate ?? ""}`,
      `Delivery destination: ${e.destination ?? ""}`,
    );
  }
  if (e.message) lines.push("", e.message);
  return lines.join("\n");
}
