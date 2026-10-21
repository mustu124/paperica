import { Gift } from "lucide-react";
import { countsTowardsOffer, giftOffer } from "@/lib/offer";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/site/product-card";
import { ProductGallery } from "@/components/site/product/product-gallery";
import { PurchasePanel, type PanelCopy } from "@/components/site/product/purchase-panel";
import { ShareButton } from "@/components/site/product/share-button";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Carousel } from "@/components/ui/carousel";
import { SectionHeading } from "@/components/ui/section-heading";
import { renderTokens, renderTokensText } from "@/lib/content";
import { getProduct, getRelatedProducts } from "@/lib/data/product";
import { getCatalog } from "@/lib/data/products";
import { openGraphDefaults, shareImages } from "@/lib/seo";
import { NO_MATCH_PARAM, withFallback } from "@/lib/static-params";
import { getSiteSettings } from "@/lib/data/settings";
import { titleCase } from "@/lib/format";
import { settingNumber, settingString } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";

type Props = PageProps<"/products/[slug]">;

const SITE_URL = siteUrl();

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return withFallback(products.map((p) => ({ slug: p.slug })), { slug: NO_MATCH_PARAM });
}

function plainText(html: string | null, max = 160) {
  const text = (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), getSiteSettings()]);
  // Missing or deactivated: the body renders the 404 page; keep it out of search results.
  if (!product) return { title: "Page not found", robots: { index: false, follow: false } };
  const description =
    product.short_description || plainText(product.description_html) || `${product.name} by ${settingString(settings, "brand_name")}`;
  // Link previews can't show SVGs (the seeded placeholders); fall back to the shop's preview image.
  const own = product.images.filter((i) => !i.url.endsWith(".svg")).slice(0, 4).map((i) => ({ url: i.url, alt: i.alt }));
  const images = own.length ? own : shareImages(settings);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { ...openGraphDefaults(settings), type: "website", title: product.name, description, images },
    twitter: { card: "summary_large_image", title: product.name, description, images: images.map((i) => i.url) },
  };
}

/**
 * The page body streams inside Suspense: params + data are read in ProductContent, so an
 * on-demand revalidation (admin save) can re-render it without blocking the static shell.
 */
export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 pt-10 md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] md:px-6">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

async function ProductContent({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), getSiteSettings()]);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const offer = giftOffer(settings);
  const brand = settingString(settings, "brand_name");
  const url = `${SITE_URL}/products/${product.slug}`;
  const s = (key: string) => renderTokensText(settingString(settings, key), settings);

  const copy: PanelCopy = {
    lowStockThreshold: settingNumber(settings, "low_stock_threshold") ?? 5,
    lowStockMessage: s("low_stock_message"),
    deliveryBadges: [s("delivery_badge_dispatch") || s("ready_stock_dispatch_text"), s("delivery_badge_delivery") || s("ready_stock_delivery_text")].filter(Boolean),
    priceNote: s("product_price_note"),
    paymentNote: s("payment_note"),
    whatsappNumber: settingString(settings, "whatsapp_number"),
    whatsappTemplate: s("whatsapp_customise_template"),
    personalisedInfo: s("personalised_info_text") || s("personalised_production_text"),
  };

  const crumbs = [
    { label: "Home", href: "/" },
    ...(product.primary
      ? [
          { label: titleCase(product.primary.category.name), href: product.primary.category.href },
          { label: product.primary.subcategory.name, href: product.primary.subcategory.href },
        ]
      : []),
    { label: product.name },
  ];

  const price = product.variants[0]?.price_override ?? product.price_inr;
  const inStock =
    product.mode === "whatsapp" ||
    !product.track_stock ||
    (product.variants.length > 0
      ? product.variants.some((v) => (v.stock_qty ?? product.stock_qty ?? 0) > 0)
      : (product.stock_qty ?? 0) > 0);

  // JSON-LD Product schema (no offer when the price is "on enquiry").
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description || plainText(product.description_html, 500) || undefined,
    image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${SITE_URL}${i.url}`)),
    sku: product.sku ?? undefined,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    url,
    offers:
      price != null
        ? {
            "@type": "Offer",
            priceCurrency: "INR",
            price: Number(price).toFixed(2),
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url,
          }
        : undefined,
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-4 md:px-6 md:pt-6">
      <script
        type="application/ld+json"
        // Escape "<" so product text can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Breadcrumbs items={crumbs} className="mb-4 md:mb-6" />

      <div className="grid gap-8 md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div className="md:sticky md:top-40 md:self-start">
          <PurchasePanel
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              url,
              mode: product.mode,
              price: product.price_inr == null ? null : Number(product.price_inr),
              compareAt: product.compare_at_price_inr == null ? null : Number(product.compare_at_price_inr),
              isNew: product.is_new,
              trackStock: product.track_stock,
              stockQty: product.stock_qty,
              lowStockMessage: product.low_stock_message,
              image: product.images[0]?.url ?? null,
            }}
            variants={product.variants.map((v) => ({
              id: v.id,
              label: v.label,
              group: v.option_group,
              priceOverride: v.price_override == null ? null : Number(v.price_override),
              stockQty: v.stock_qty,
            }))}
            copy={copy}
          />

          {offer && countsTowardsOffer(offer, { isNew: product.is_new, mode: product.mode, slug: product.slug }) && inStock && (
            <p className="mt-6 flex items-start gap-3 rounded-2xl bg-butter/70 px-4 py-3 text-sm">
              <Gift className="mt-0.5 size-5 shrink-0 text-chilli" aria-hidden />
              <span>
                <strong className="font-semibold">{offer.text || `Buy any ${offer.minQty} from the New Collection and get a free gift`}</strong>
                <span className="block text-ink-muted">This product counts towards it. The free gift is added automatically at checkout.</span>
              </span>
            </p>
          )}

          <div className="mt-6">
            <ShareButton url={url.startsWith("http") ? url : ""} title={product.name} />
          </div>

          <Accordion className="mt-8">
            {product.description_html && (
              <AccordionItem title="Description" defaultOpen name="product-info">
                <div
                  className="prose-paperica text-sm"
                  dangerouslySetInnerHTML={{ __html: renderTokens(product.description_html, settings) }}
                />
              </AccordionItem>
            )}
            {product.details_html && (
              <AccordionItem title="Details & Specifications" name="product-info">
                <div
                  className="prose-paperica text-sm"
                  dangerouslySetInnerHTML={{ __html: renderTokens(product.details_html, settings) }}
                />
              </AccordionItem>
            )}
            <AccordionItem title="Shipping & Delivery" name="product-info">
              <div className="space-y-2 text-sm leading-relaxed">
                {product.mode === "whatsapp" ? (
                  <p>{s("personalised_production_text")}</p>
                ) : (
                  <>
                    {s("ready_stock_dispatch_text") && <p>{s("ready_stock_dispatch_text")}</p>}
                    {s("ready_stock_delivery_text") && <p>{s("ready_stock_delivery_text")}</p>}
                  </>
                )}
                {s("cart_message") && <p>{s("cart_message")}</p>}
                {s("same_day_mumbai_text") && <p>{s("same_day_mumbai_text")}</p>}
                <p>
                  <Link href="/shipping-policy" className="text-chilli underline underline-offset-4">
                    Shipping Policy
                  </Link>
                </p>
              </div>
            </AccordionItem>
            <AccordionItem title="Returns" name="product-info">
              <div className="space-y-2 text-sm leading-relaxed">
                {s("returns_summary_text") && <p>{s("returns_summary_text")}</p>}
                <p>
                  <Link
                    href="/cancellation-returns-refund-policy"
                    className="text-chilli underline underline-offset-4"
                  >
                    Cancellation, Returns &amp; Refund Policy
                  </Link>
                </p>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="reveal mt-16 md:mt-24" aria-label="You may also like">
          <SectionHeading title="You may also like" />
          <Carousel label="You may also like" slideClassName="basis-1/2 md:basis-1/4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} sizes="(min-width: 768px) 25vw, 50vw" />
            ))}
          </Carousel>
        </section>
      )}
    </div>
  );
}
