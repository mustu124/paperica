import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutClient, CheckoutSkeleton, type CheckoutCopy } from "@/components/site/checkout/checkout-client";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { renderTokensText } from "@/lib/content";
import { getMenu } from "@/lib/data/menu";
import { getAllPages } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/settings";
import { titleCase } from "@/lib/format";
import { settingString } from "@/lib/settings";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

/** Guest checkout (no account). Prices are always recomputed on the server. */
export default async function CheckoutPage() {
  const [settings, menu, pages] = await Promise.all([getSiteSettings(), getMenu(), getAllPages()]);
  const policy = (slug: string, fallback: string) => ({ href: `/${slug}`, title: pages.find((p) => p.slug === slug)?.title || fallback });
  const s = (k: string) => renderTokensText(settingString(settings, k), settings);
  const number = settingString(settings, "whatsapp_number");
  const firstHead = menu[0];

  const copy: CheckoutCopy = {
    brandName: settingString(settings, "brand_name"),
    serviceabilityNote: s("checkout_serviceability_note"),
    sameDayNote: s("checkout_same_day_note"),
    contactEmail: settingString(settings, "contact_email"),
    whatsappUrl: number ? whatsappUrl(number) : "",
    emptyCta: firstHead ? { label: `Browse ${titleCase(firstHead.name)}`, href: firstHead.href } : null,
    policies: {
      terms: policy("terms-and-conditions", "Terms & Conditions"),
      shipping: policy("shipping-policy", "Shipping Policy"),
      cancellation: policy("cancellation-returns-refund-policy", "Cancellation, Returns & Refund Policy"),
      privacy: policy("privacy-policy", "Privacy Policy"),
    },
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 md:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Checkout" }]} className="mb-4" />
      <h1 className="mb-8 font-serif text-3xl font-semibold md:text-4xl">Checkout</h1>
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutClient copy={copy} />
      </Suspense>
    </div>
  );
}
