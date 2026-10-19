// Prices are stored as numeric rupees (e.g. 449.00). Razorpay needs integer paise,
// so convert with rupeesToPaise only at the payment boundary.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatINR(rupees: number | string) {
  return inr.format(Number(rupees));
}

export function rupeesToPaise(rupees: number | string) {
  return Math.round(Number(rupees) * 100);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(value: string | Date) {
  return dateFmt.format(typeof value === "string" ? new Date(value) : value);
}

/** "NOTEBOOKS & JOURNALS" → "Notebooks & Journals" (for serif titles of uppercase labels). */
export function titleCase(s: string) {
  return s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, sp: string, ch: string) => sp + ch.toUpperCase());
}
