// {{token}} replacement for CMS text (pages, FAQs, announcement bar, footer, info strip).
// Any string/number site setting can be referenced as {{setting_key}}, so copy can mention
// contact details, fees or timelines that are edited once in the admin.
// Computed tokens: {{whatsapp_number}} (formatted, e.g. +91 98765 43210), {{whatsapp_url}},
// {{shipping_fee}} (formatted fee, e.g. ₹80). Setting values may themselves contain tokens
// (e.g. ready_stock_dispatch_text uses {{dispatch_days}}); they are expanded too.

import { formatINR } from "./format";
import type { SiteSettings } from "./settings";
import { formatWhatsAppDisplay, whatsappUrl } from "./whatsapp";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const TOKEN = /\{\{\s*([a-z0-9_]+)\s*\}\}/g;

function tokenValues(settings: SiteSettings): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, v] of Object.entries(settings)) {
    if (typeof v === "string" || typeof v === "number") values[key] = String(v);
  }
  const whatsapp = values.whatsapp_number ?? "";
  values.whatsapp_number = whatsapp ? formatWhatsAppDisplay(whatsapp) : "";
  values.whatsapp_url = whatsapp ? whatsappUrl(whatsapp) : "";
  const fee = values.standard_shipping_fee_inr;
  if (fee) values.shipping_fee = formatINR(fee); // e.g. "₹80"

  // Settings may reference other settings (e.g. ready_stock_dispatch_text uses {{dispatch_days}});
  // expand a few levels so one edit updates every sentence that mentions it.
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (const key of Object.keys(values)) {
      const next = values[key].replace(TOKEN, (m, k: string) => (k in values && k !== key ? values[k] : m));
      if (next !== values[key]) {
        values[key] = next;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return values;
}

function replaceTokens(text: string, settings: SiteSettings, escape: (s: string) => string) {
  const values = tokenValues(settings);
  return text.replace(TOKEN, (match, key: string) => (key in values ? escape(values[key]) : match));
}

/**
 * For HTML strings rendered with dangerouslySetInnerHTML. Values are HTML-escaped;
 * unknown tokens are left as-is so typos are visible rather than silently blank.
 */
export function renderTokens(html: string, settings: SiteSettings) {
  return replaceTokens(html, settings, escapeHtml);
}

/** For plain text and attribute values rendered by React (which escapes on its own). */
export function renderTokensText(text: string, settings: SiteSettings) {
  return replaceTokens(text, settings, (s) => s);
}
