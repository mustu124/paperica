"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_WIDTH = 2000;
const QUALITY = 0.85;
export type MediaFolder = "products" | "homepage" | "categories" | "pages" | "branding";
/** WebP for the site; JPEG for images other apps must read (e.g. WhatsApp/Facebook link previews). */
export type ImageFormat = "webp" | "jpeg";

/** Resizes (max 2000px wide, keeps aspect ratio) and re-encodes in the browser. */
async function reencode(file: File, format: ImageFormat): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  // Link-preview images: 1200px is the recommended size and keeps the file small enough for WhatsApp.
  const scale = Math.min(1, (format === "jpeg" ? 1200 : MAX_WIDTH) / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process this image.");
  if (format === "jpeg") {
    // JPEG has no transparency: fill with white first.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, `image/${format}`, QUALITY));
  if (!blob) throw new Error("Your browser couldn't convert this image.");
  return blob;
}

/**
 * Uploads an image to the public "media" bucket using the signed-in admin's session
 * (Storage RLS only lets admins write). Returns the public URL.
 */
export async function uploadImage(file: File, folder: MediaFolder, format: ImageFormat = "webp"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  const blob = await reencode(file, format);
  const path = `${folder}/${crypto.randomUUID()}.${format === "jpeg" ? "jpg" : "webp"}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    contentType: `image/${format}`,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
