// Guided enquiry forms on the Custom Orders and Corporate Gifting pages (browser and server).
// The choices and indicative prices live in pages.form_config and are edited in
// Admin → Pages & FAQs; nothing here is shop data, only the shape and the message layout.
import { z } from "zod";

// Shared with the browser: skip zod's `new Function` probe, which the CSP (no 'unsafe-eval') reports.
z.config({ jitless: true });

/** One choice in a list: a format, an inside-page type, an extra, a product... */
export type FormOption = {
  label: string;
  /** Indicative price in ₹ (formats only). */
  price?: number | null;
  /** "Additional charges apply" is shown next to it. */
  extra?: boolean;
  /** Choosing it asks for the photo book brief instead of notebook details. */
  photo_book?: boolean;
};

const option = z.object({
  label: z.string().trim().min(1).max(120),
  price: z.number().nonnegative().nullable().optional(),
  extra: z.boolean().optional(),
  photo_book: z.boolean().optional(),
});
const options = z.array(option).max(30).catch([]);
const text = (max: number) => z.string().max(max).catch("");

export const customOrderConfig = z.object({
  form: z.literal("custom_order"),
  formats: options,
  page_types: options,
  extras: options,
  /** Shown next to anything marked extra. */
  extra_label: text(200),
  /** Small print under the form (e.g. "not an order confirmation"). */
  note: text(500),
});
export type CustomOrderConfig = z.infer<typeof customOrderConfig>;

export const corporateConfig = z.object({
  form: z.literal("corporate"),
  gifting_types: options,
  products: options,
  note: text(500),
});
export type CorporateConfig = z.infer<typeof corporateConfig>;

export const formConfig = z.discriminatedUnion("form", [customOrderConfig, corporateConfig]);
export type FormConfig = z.infer<typeof formConfig>;

/** The page's form, or null when it has none (the page then shows plain enquiry buttons). */
export function parseFormConfig(value: unknown): FormConfig | null {
  const parsed = formConfig.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// ---------------------------------------------------------------------------
// Admin text format: one option per line, extra details after "|".
//   Softbound Wiro | 899
//   Custom Photo Book | 2500 | photo book
//   Planner layout | extra
// ---------------------------------------------------------------------------

export function optionsToText(list: FormOption[]): string {
  return list
    .map((o) =>
      [o.label, o.price != null ? String(o.price) : null, o.extra ? "extra" : null, o.photo_book ? "photo book" : null]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");
}

export function textToOptions(value: string): FormOption[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter(([label]) => label)
    .map(([label, ...rest]) => {
      const o: FormOption = { label };
      for (const part of rest) {
        const flag = part.toLowerCase();
        const price = Number(part.replace(/[₹,\s]/g, ""));
        if (flag === "extra") o.extra = true;
        else if (flag.replace(/[\s_-]/g, "") === "photobook") o.photo_book = true;
        else if (part && Number.isFinite(price)) o.price = price;
      }
      return o;
    });
}

// ---------------------------------------------------------------------------
// Customer forms
// ---------------------------------------------------------------------------

const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const mobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, "").replace(/^(?:\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"));

export const customOrderSchema = z.object({
  format: z.string().min(1, "Choose a format"),
  cover: optional(500),
  pages: optional(120),
  /** Answers to config.extras, by position: "yes", "no" or "" (not answered). */
  extras: z.array(z.enum(["yes", "no", ""])).max(30).optional(),
  photoCount: optional(50),
  photoLayout: optional(500),
  personalisation: optional(500),
  quantity: z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, "Enter how many you need")
    .refine((v) => Number(v) >= 1, "At least 1"),
  name: optional(100),
  notes: optional(2000),
});
export type CustomOrderInput = z.input<typeof customOrderSchema>;
export type CustomOrder = z.output<typeof customOrderSchema>;

export const corporateSchema = z.object({
  company: z.string().trim().min(2, "Enter your company name").max(150),
  contact: z.string().trim().min(2, "Enter the contact person's name").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(200)).optional().or(z.literal("")),
  phone: mobile,
  giftingTypes: z.array(z.string().max(120)).max(30).optional(),
  products: z.array(z.string().max(120)).max(30).optional(),
  quantity: optional(50),
  budget: optional(100),
  deliveryDate: optional(50),
  notes: optional(2000),
});
export type CorporateInput = z.input<typeof corporateSchema>;
export type Corporate = z.output<typeof corporateSchema>;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const line = (label: string, value: string | undefined | null) => (value ? `${label}: ${value}` : null);

/** WhatsApp message for the custom order form; `intro` is the page's pre-filled message. */
export function customOrderMessage(intro: string, config: CustomOrderConfig, v: CustomOrder) {
  const format = config.formats.find((f) => f.label === v.format);
  const photoBook = Boolean(format?.photo_book);
  const lines = [
    intro.trim() || "Hi Paperica! I'd like a quote for a custom order.",
    "",
    line("Format", format ? `${format.label}${format.price != null ? ` (from ${inr(format.price)})` : ""}` : v.format),
    ...(photoBook
      ? [line("Number of photos", v.photoCount), line("Layout", v.photoLayout), line("Personalisation", v.personalisation)]
      : [
          line("Cover preference", v.cover),
          line("Inside pages", v.pages),
          ...config.extras.map((e, i) => {
            const answer = v.extras?.[i];
            return answer ? `${e.label}: ${answer === "yes" ? `Yes${e.extra ? " (additional charges apply)" : ""}` : "No"}` : null;
          }),
        ]),
    line("Quantity", v.quantity),
    line("Additional requirements", v.notes),
    line("Name", v.name),
  ];
  return lines.filter((l) => l !== null).join("\n");
}

/** WhatsApp message for the corporate gifting form; `intro` is the page's pre-filled message. */
export function corporateMessage(intro: string, v: Corporate) {
  const lines = [
    intro.trim() || "Hi Paperica! I'd like to discuss corporate gifting.",
    "",
    line("Company", v.company),
    line("Contact person", v.contact),
    line("Phone / WhatsApp", v.phone),
    line("Email", v.email),
    line("Type of gifting", v.giftingTypes?.join(", ")),
    line("Products of interest", v.products?.join(", ")),
    line("Approximate quantity", v.quantity),
    line("Budget", v.budget),
    line("Required by", v.deliveryDate),
    line("Branding requirements and notes", v.notes),
  ];
  return lines.filter((l) => l !== null).join("\n");
}
