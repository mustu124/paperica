import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/lib/data/products";

/** Live search suggestions for the header: top 5 active products. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const products = await searchProducts(q, 5);

  return NextResponse.json(
    {
      results: products.map((p) => ({
        name: p.name,
        href: p.href,
        price: p.price,
        customisable: p.mode === "whatsapp",
        image: p.image?.url ?? null,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
