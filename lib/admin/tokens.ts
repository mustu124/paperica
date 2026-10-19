// Tokens shown in the admin's page editor. Any text/number setting works as {{key}};
// these are the ones most useful in page copy.
export const TOKEN_HELP: { token: string; meaning: string }[] = [
  { token: "contact_email", meaning: "Contact email" },
  { token: "whatsapp_number", meaning: "WhatsApp number (formatted)" },
  { token: "whatsapp_url", meaning: "WhatsApp chat link (use as a link address)" },
  { token: "shipping_fee", meaning: "Standard shipping fee with the ₹ sign" },
  { token: "standard_shipping_fee_inr", meaning: "Shipping fee, number only" },
  { token: "dispatch_days", meaning: "Ready-stock dispatch time" },
  { token: "delivery_days", meaning: "Delivery time after dispatch" },
  { token: "personalised_production_days", meaning: "Personalised production time" },
  { token: "order_damage_report_window_text", meaning: "Window to report damage" },
  { token: "store_credit_validity", meaning: "Store credit validity" },
  { token: "grievance_officer_name", meaning: "Grievance officer name" },
  { token: "grievance_officer_designation", meaning: "Grievance officer designation" },
  { token: "grievance_acknowledgement_time", meaning: "Grievance acknowledgement time" },
  { token: "brand_name", meaning: "Shop name" },
];

/** Pages editable in Admin → Pages & FAQs (slug → label, public path). */
export const EDITABLE_PAGES: { slug: string; label: string; path: string; enquiry?: boolean; legal?: boolean }[] = [
  { slug: "about", label: "About (intro, Our Story, Our Mission)", path: "/about" },
  { slug: "shipping-policy", label: "Shipping Policy", path: "/shipping-policy", legal: true },
  { slug: "cancellation-returns-refund-policy", label: "Cancellation, Returns & Refund Policy", path: "/cancellation-returns-refund-policy", legal: true },
  { slug: "privacy-policy", label: "Privacy Policy", path: "/privacy-policy", legal: true },
  { slug: "terms-and-conditions", label: "Terms & Conditions", path: "/terms-and-conditions", legal: true },
  { slug: "corporate-gifting", label: "Corporate Gifting", path: "/corporate-gifting", enquiry: true },
  { slug: "custom-orders", label: "Custom Orders", path: "/custom-orders", enquiry: true },
];
