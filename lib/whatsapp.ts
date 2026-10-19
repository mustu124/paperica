// WhatsApp click-to-chat links. The phone number always comes from the
// settings table in Supabase; nothing is hard-coded here.

/** Strips spaces, dashes, brackets and a leading "+" so wa.me accepts the number. */
export function normaliseWhatsAppNumber(raw: string) {
  return raw.replace(/[^\d]/g, "");
}

/** "919876543210" → "+91 98765 43210" (Indian numbers); other numbers get a "+" prefix. */
export function formatWhatsAppDisplay(raw: string) {
  const digits = normaliseWhatsAppNumber(raw);
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

export function whatsappUrl(number: string, message?: string) {
  const base = `https://wa.me/${normaliseWhatsAppNumber(number)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Used only if site_settings.whatsapp_customise_template is empty. */
const DEFAULT_CUSTOMISE_TEMPLATE = [
  "Hi! I'd like to customise: {product} ({url}).",
  "Here are my details:",
  "Name: ",
  "Quantity: ",
  "Personalisation text/design: ",
  "Preferred delivery date: ",
].join("\n");

/**
 * Pre-filled "Customise on WhatsApp" message from the template in
 * site_settings.whatsapp_customise_template (editable in admin):
 *   {product} → product name, plus the chosen option, e.g. "Custom Planner (Colour: Blush)"
 *   {url}     → absolute product URL
 */
export function customiseProductMessage({
  template,
  name,
  variant,
  url,
}: {
  template: string;
  name: string;
  variant?: string | null;
  url: string;
}) {
  const product = variant ? `${name} (${variant})` : name;
  return (template.trim() ? template : DEFAULT_CUSTOMISE_TEMPLATE)
    .replaceAll("{product}", product)
    .replaceAll("{url}", url);
}
