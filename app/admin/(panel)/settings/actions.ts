"use server";

import { friendlyError, NOT_AUTHORISED, requireAdmin, type ActionResult } from "@/lib/admin/auth";
import { ALL_SETTING_FIELDS, type SettingField } from "@/lib/admin/settings-fields";
import { refreshTags } from "@/lib/revalidate";
import type { Json } from "@/types/db";

type Errors = Record<string, string>;

function validate(field: SettingField, raw: unknown): { value: Json } | { error: string } {
  const text = typeof raw === "string" ? raw.trim() : "";
  switch (field.type) {
    case "bool":
      return { value: raw === true };
    case "number": {
      const n = Number(text);
      return text !== "" && Number.isFinite(n) && n >= 0 ? { value: n } : { error: "Enter a number." };
    }
    case "optional_number": {
      if (text === "") return { value: null };
      const n = Number(text);
      return Number.isFinite(n) && n >= 0 ? { value: n } : { error: "Enter a number, or leave empty." };
    }
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? { value: text.toLowerCase() } : { error: "Enter a valid email address." };
    case "whatsapp":
      // Country code + number: 11–15 digits (a bare 10-digit number is missing the 91).
      if (/^[6-9]\d{9}$/.test(text)) return { error: `Add the country code: 91${text}.` };
      return /^[1-9]\d{10,14}$/.test(text)
        ? text.startsWith("91") && text.length !== 12
          ? { error: "Indian numbers are 91 followed by 10 digits." }
          : { value: text }
        : { error: "Digits only, with country code (e.g. 919876543210) — no +, spaces or dashes." };
    case "url":
      return text === "" || /^https:\/\/[^\s]+\.[^\s]+/.test(text) ? { value: text } : { error: "Paste the full link starting with https://" };
    case "image":
      // Uploaded to Storage (https; http on a local Supabase) or bundled with the site (/brand/...). Empty hides it.
      return text === "" || /^(https?:\/\/|\/(?!\/))\S+$/.test(text) ? { value: text } : { error: "Upload an image." };
    default:
      return text.length <= 2000 ? { value: text } : { error: "That's too long." };
  }
}

/** Saves the whole Site Settings form (only known keys; each validated by its type). */
export async function saveSettings(
  values: Record<string, unknown>,
): Promise<ActionResult | { ok: false; error: string; errors: Errors }> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;

  const rows: { key: string; value: Json }[] = [];
  const errors: Errors = {};
  for (const field of ALL_SETTING_FIELDS) {
    if (!(field.key in values)) continue;
    const result = validate(field, values[field.key]);
    if ("error" in result) errors[field.key] = result.error;
    else rows.push({ key: field.key, value: result.value });
  }
  if (Object.keys(errors).length) {
    const n = Object.keys(errors).length;
    return { ok: false, error: `Please fix the highlighted field${n === 1 ? "" : "s"}.`, errors };
  }

  const { error } = await admin.supabase.from("site_settings").upsert(rows);
  if (error) return { ok: false, error: friendlyError(error) };
  // Settings feed every page (header, footer, policies, product pages).
  refreshTags("settings", "pages", "homepage", "products");
  return { ok: true };
}
