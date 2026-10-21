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
    title: "Free gift offer",
    description: "Buying enough products marked New adds one free item to the order at checkout.",
    fields: [
      { key: "gift_offer_enabled", label: "Offer is on", type: "bool" },
      { key: "gift_offer_text", label: "Offer text", type: "text", hint: "Shown on the products it applies to (New products), in the cart and at checkout." },
      { key: "gift_offer_min_qty", label: "New products needed", type: "number", hint: "e.g. 2 — the free item itself doesn't count." },
      { key: "gift_offer_product_slug", label: "Free product (web address)", type: "text", hint: "The end of the product's link, e.g. snap-in-separators" },
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
  {
    title: "Messages & templates",
    description: "Small pieces of text used around the shop.",
    fields: [
      { key: "brand_name", label: "Shop name", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "cart_message", label: "Cart note", type: "text" },
      { key: "delivery_badge_dispatch", label: "Product page: dispatch badge", type: "text" },
      { key: "delivery_badge_delivery", label: "Product page: delivery badge", type: "text" },
      { key: "low_stock_threshold", label: "Show “Selling Fast” at or below (stock)", type: "number" },
      { key: "low_stock_message", label: "“Selling Fast” message", type: "text" },
      { key: "product_price_note", label: "Note under the price", type: "text", hint: "Links like [Shipping](/shipping-policy) work." },
      { key: "payment_note", label: "Payment note", type: "text" },
      { key: "personalised_info_text", label: "Personalised products: info box", type: "textarea" },
      { key: "returns_summary_text", label: "Product page: returns summary", type: "textarea" },
      { key: "checkout_serviceability_note", label: "Checkout: serviceability note", type: "text" },
      { key: "checkout_same_day_note", label: "Checkout: same-day note", type: "text" },
      { key: "order_thank_you_text", label: "Order confirmation: thank-you text", type: "textarea" },
      { key: "whatsapp_customise_template", label: "“Customise on WhatsApp” message", type: "textarea", hint: "{product} and {url} are filled in." },
      { key: "whatsapp_enquiry_intro", label: "Contact form WhatsApp first line", type: "text", hint: "{type} = enquiry type" },
    ],
  },
];

export const ALL_SETTING_FIELDS = SETTINGS_GROUPS.flatMap((g) => g.fields);
