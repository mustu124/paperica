import { NextResponse, type NextRequest } from "next/server";
import { priceItems } from "@/lib/checkout/pricing";
import { quoteRequestSchema } from "@/lib/checkout/schema";
import { rateLimit } from "@/lib/rate-limit";

/** Prices the cart (or a "Buy now" item) from the database for the checkout summary. */
export async function POST(request: NextRequest) {
  if (!(await rateLimit(request, "quote", 60, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }
  const parsed = quoteRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart." }, { status: 400 });

  try {
    return NextResponse.json(await priceItems(parsed.data.items), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[checkout/quote]", (e as Error).message);
    return NextResponse.json({ error: "We couldn't load your cart. Please try again." }, { status: 500 });
  }
}
