import type { HomepageSectionType } from "@/types/db";

// Describes each homepage section's editing form. Storage model (homepage_assets):
// one row per image per slot; sort_order 0 = image A (carries the text fields), 1 = image B.

export type SlotField = "heading" | "subheading" | "button_label" | "link_url" | "badge_text";

export type ConfigField =
  | { key: string; label: string; type: "text"; hint?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "image" }
  | { key: string; label: string; type: "products"; max: number; hint?: string }
  | { key: string; label: string; type: "icons"; options: { value: string; label: string }[] };

export type SettingField = { key: string; label: string; type: "number" | "textarea"; hint?: string; min?: number };

export type SectionSpec = {
  title: string;
  description: string;
  slots: { fixed: number } | { min: number; max: number };
  slotLabel: string; // e.g. "Panel" → "Panel 1"
  images: string[]; // labels per image, e.g. ["Image A", "Image B"]; [] = no images
  aspect: string;
  /** Shape of the optional phone image (defaults to `aspect`). */
  mobileAspect?: string;
  fields: { key: SlotField; label: string; multiline?: boolean; hint?: string; link?: boolean }[];
  config: ConfigField[];
  settings?: SettingField[];
  reorderable: boolean;
};

const ICONS = [
  { value: "truck", label: "Delivery van" },
  { value: "package", label: "Parcel" },
  { value: "help", label: "Question mark" },
  { value: "gift", label: "Gift" },
  { value: "heart", label: "Heart" },
  { value: "sparkles", label: "Sparkles" },
  { value: "chat", label: "Chat bubble" },
];

export const SECTION_SPECS: Record<HomepageSectionType, SectionSpec> = {
  hero: {
    title: "Hero banner",
    description:
      "Full-width banner slides at the top (1–3; arrows move between them). Each slide swaps between image A and image B. Laptop images: about 2400 × 1000. Phone versions: 1080 × 1920. If the banner already has its text and button drawn in, leave the text fields empty and just set the link: the whole banner becomes clickable.",
    slots: { min: 1, max: 3 },
    slotLabel: "Slide",
    images: ["Image A", "Image B"],
    aspect: "aspect-[12/5]",
    mobileAspect: "aspect-[9/16]",
    fields: [
      { key: "heading", label: "Heading (optional)", hint: "Wrap words in *stars* for the handwritten script, e.g. A little paper happiness for your *everyday life.*" },
      { key: "subheading", label: "Short line (optional)" },
      { key: "button_label", label: "Button label (optional)", hint: "e.g. Shop now. Leave empty to make the whole banner the link." },
      { key: "link_url", label: "Link", link: true },
    ],
    config: [
      {
        key: "heading_font",
        label: "Heading style",
        type: "select",
        options: [
          { value: "playful", label: "Soft serif + script (default)" },
          { value: "script", label: "Script (handwritten)" },
          { value: "serif", label: "Condensed serif" },
          { value: "display", label: "Logo style" },
        ],
      },
      {
        key: "text_tone",
        label: "Text colour",
        type: "select",
        options: [
          { value: "dark", label: "Chilli red on light photos (default)" },
          { value: "light", label: "White on darker photos" },
        ],
      },
    ],
    settings: [{ key: "hero_rotation_ms", label: "Image swap speed (milliseconds)", type: "number", min: 500, hint: "3000 = every 3 seconds. Used by the hero and promo banners." }],
    reorderable: true,
  },
  collection_carousel: {
    title: "Shop By Collection",
    description: "Pastel tiles with a caption and a small line that link to collections.",
    slots: { min: 1, max: 12 },
    slotLabel: "Tile",
    images: ["Image"],
    aspect: "aspect-square",
    fields: [
      { key: "heading", label: "Caption" },
      { key: "subheading", label: "Small line under the caption (optional)", hint: "e.g. Our latest designs" },
      { key: "link_url", label: "Link", link: true },
    ],
    config: [
      { key: "heading", label: "Section heading", type: "text" },
      { key: "view_all_url", label: "“View all” link (optional)", type: "text", hint: "e.g. /collections/new-in" },
    ],
    reorderable: true,
  },
  promo_duo: {
    title: "Promo banners (two)",
    description: "Two large banners side by side. Each swaps between image A and image B.",
    slots: { fixed: 2 },
    slotLabel: "Banner",
    images: ["Image A", "Image B"],
    aspect: "aspect-[9/10]",
    mobileAspect: "aspect-[4/5]",
    fields: [
      { key: "heading", label: "Heading" },
      { key: "subheading", label: "Smaller line" },
      { key: "button_label", label: "Button label", hint: "e.g. Discover the gift shop" },
      { key: "link_url", label: "Button link", link: true },
    ],
    config: [],
    reorderable: true,
  },
  product_mosaic: {
    title: "Product feature",
    description: "Two stacked lifestyle images with a caption, next to up to 8 products.",
    slots: { fixed: 1 },
    slotLabel: "Lifestyle block",
    images: ["Top image", "Bottom image"],
    aspect: "aspect-[9/7]",
    fields: [
      { key: "heading", label: "Caption" },
      { key: "link_url", label: "Link", link: true },
    ],
    config: [
      { key: "heading", label: "Section heading (optional)", type: "text", hint: "e.g. The New Collection" },
      { key: "view_all_url", label: "“View all” link (optional)", type: "text", hint: "e.g. /collections/new-in" },
      { key: "product_slugs", label: "Products", type: "products", max: 8, hint: "Pick up to 8 in order. Pick none to show the newest products marked New." },
      {
        key: "tile_tone",
        label: "Product tile background",
        type: "select",
        options: [
          { value: "blush", label: "Blush pink" },
          { value: "paper", label: "Cream" },
          { value: "tint-blue", label: "Pale blue" },
          { value: "white", label: "White" },
        ],
      },
    ],
    reorderable: true,
  },
  promo_trio: {
    title: "Promo tiles (three)",
    description: "Three square tiles with a round sticker and a small button.",
    slots: { fixed: 3 },
    slotLabel: "Tile",
    images: ["Image"],
    aspect: "aspect-square",
    fields: [
      { key: "badge_text", label: "Sticker text", multiline: true, hint: "Keep it to 2–3 short lines." },
      { key: "button_label", label: "Button label", hint: "e.g. Shop planners" },
      { key: "link_url", label: "Button link", link: true },
    ],
    config: [],
    reorderable: true,
  },
  instagram_feed: {
    title: "Instagram",
    description: "Avatar, a line about your Instagram, and photo tiles that link to posts.",
    slots: { min: 1, max: 12 },
    slotLabel: "Post",
    images: ["Photo"],
    aspect: "aspect-[4/5]",
    fields: [{ key: "link_url", label: "Instagram post link", hint: "https://www.instagram.com/p/…" }],
    config: [
      { key: "heading", label: "Line", type: "text", hint: "e.g. Join the community on Instagram" },
      { key: "handle", label: "Handle", type: "text", hint: "e.g. @paperica.in (links to your Instagram from Site Settings)" },
      { key: "follower_text", label: "Follower text (optional)", type: "text", hint: "e.g. 2.4k followers" },
      { key: "avatar_url", label: "Avatar (defaults to your logo)", type: "image" },
    ],
    reorderable: true,
  },
  info_strip: {
    title: "Info strip & footer blurb",
    description: "The pink strip above the footer (three columns) and the short About text in the footer.",
    slots: { fixed: 3 },
    slotLabel: "Column",
    images: [],
    aspect: "aspect-square",
    fields: [
      { key: "badge_text", label: "Small label" },
      { key: "heading", label: "Headline" },
      { key: "subheading", label: "Text", multiline: true, hint: "Add a link like [Help Centre](/faq)." },
    ],
    config: [{ key: "icons", label: "Icon", type: "icons", options: ICONS }],
    settings: [{ key: "footer_about_blurb", label: "Footer “About” blurb", type: "textarea" }],
    reorderable: false,
  },
};

export function slotCount(spec: SectionSpec, current: number) {
  return "fixed" in spec.slots ? spec.slots.fixed : Math.min(Math.max(current, spec.slots.min), spec.slots.max);
}
