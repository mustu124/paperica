// The Site Settings form: groups, fields and how each value is validated/stored.

export type SettingType = "text" | "textarea" | "number" | "optional_number" | "bool" | "email" | "url" | "whatsapp" | "image";

export type SettingField = {
  key: string;
  label: string;
  type: SettingType;
  hint?: string;
  /** image fields: preview box shape and upload format. */
  aspect?: string;
  format?: "webp" | "jpeg";
};

export const SETTINGS_GROUPS: { title: string; description?: string; fields: SettingField[] }[] = [
  {
    title: "Branding & sharing",
    description: "PNG with a transparent background works best for logos.",
    fields: [
      { key: "logo_url", label: "Header logo", type: "image", aspect: "aspect-square" },
      { key: "footer_illustration_url", label: "Footer logo", type: "image", aspect: "aspect-square" },
      {
        key: "og_image_url",
        label: "Link preview image",
        type: "image",
        aspect: "aspect-[1200/630]",
        format: "jpeg",
        hint: "Shown when the shop is shared on WhatsApp, Instagram, Facebook etc. Best size 1200 × 630.",
      },
    ],
  },
  {
    title: "Announcement bar",
    fields: [
      { key: "announcement_bar_enabled", label: "Show the announcement bar", type: "bool" },
      { key: "announcement_bar_text", label: "Announcement text", type: "text", hint: "Tokens work here, e.g. {{shipping_fee}}." },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "contact_email", label: "Contact email", type: "email" },
      { key: "whatsapp_number", label: "WhatsApp number", type: "whatsapp", hint: "Digits only, with country code — e.g. 919876543210." },
      { key: "whatsapp_default_message", label: "Default WhatsApp message", type: "text", hint: "Pre-filled when someone taps the chat button." },
    ],
  },
  {
    title: "Shipping & delivery",
    description: "Used on product pages, checkout, policies and FAQs.",
    fields: [
      { key: "standard_shipping_fee_inr", label: "Standard shipping fee (₹)", type: "number" },
      { key: "free_shipping_threshold_inr", label: "Free shipping above (₹)", type: "optional_number", hint: "Leave empty for no free shipping." },
      { key: "dispatch_days", label: "Ready-stock dispatch time", type: "text", hint: "e.g. 4–6 business days ({{dispatch_days}})" },
      { key: "delivery_days", label: "Delivery time after dispatch", type: "text", hint: "({{delivery_days}})" },
      { key: "personalised_production_days", label: "Personalised production time", type: "text", hint: "({{personalised_production_days}})" },
      { key: "ready_stock_dispatch_text", label: "Ready-stock dispatch text", type: "textarea" },
      { key: "ready_stock_delivery_text", label: "Delivery text", type: "textarea" },
      { key: "personalised_production_text", label: "Personalised production text", type: "textarea" },
      { key: "same_day_mumbai_text", label: "Same-day Mumbai text", type: "textarea" },
      { key: "order_damage_report_window_text", label: "Damage reporting window", type: "text", hint: "e.g. 48 hours" },
      { key: "store_credit_validity", label: "Store credit validity", type: "text", hint: "e.g. 6 months" },
    ],
  },
  {
    title: "Social links",
    description: "Leave empty to hide an icon.",
    fields: [
      { key: "social_instagram", label: "Instagram", type: "url" },
      { key: "social_facebook", label: "Facebook", type: "url" },
      { key: "social_pinterest", label: "Pinterest", type: "url" },
    ],
  },
  {
    title: "Grievance officer",
    fields: [
      { key: "grievance_officer_name", label: "Name", type: "text" },
      { key: "grievance_officer_designation", label: "Designation", type: "text" },
      { key: "grievance_acknowledgement_time", label: "Acknowledgement time", type: "text", hint: "e.g. 48 hours" },
    ],
  },
];

export const ALL_SETTING_FIELDS = SETTINGS_GROUPS.flatMap((g) => g.fields);
