// Cache tags for public data. Admin mutations call updateTag()/revalidateTag() with these
// so storefront changes show up immediately.
export const TAGS = {
  settings: "settings",
  menu: "menu",
  homepage: "homepage",
  pages: "pages",
  faqs: "faqs",
  products: "products",
} as const;
