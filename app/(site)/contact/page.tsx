import type { Metadata } from "next";
import { Suspense } from "react";
import { EnquiryForm } from "@/components/site/contact/enquiry-form";
import { EnquiryButtons } from "@/components/site/enquiry-buttons";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { renderTokens, renderTokensText } from "@/lib/content";
import { getPage } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/settings";
import { settingString } from "@/lib/settings";
import type { EnquiryType } from "@/types/db";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact");
  return {
    title: page?.title || "Contact Us",
    description: "Questions about an order, personalised stationery or corporate gifting? Get in touch.",
    alternates: { canonical: "/contact" },
  };
}

const TYPES: EnquiryType[] = ["customer_support", "personalised_orders", "corporate_gifting"];

/** Pre-selects the enquiry type from ?type= (e.g. links from the corporate gifting page). */
async function FormWithDefault({
  searchParams,
  whatsappNumber,
  whatsappIntro,
}: {
  searchParams: PageProps<"/contact">["searchParams"];
  whatsappNumber: string;
  whatsappIntro: string;
}) {
  const { type } = await searchParams;
  const t = typeof type === "string" && (TYPES as string[]).includes(type) ? (type as EnquiryType) : undefined;
  return <EnquiryForm whatsappNumber={whatsappNumber} whatsappIntro={whatsappIntro} defaultType={t} />;
}

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const [page, settings] = await Promise.all([getPage("contact"), getSiteSettings()]);
  const whatsappNumber = settingString(settings, "whatsapp_number");
  const whatsappIntro = renderTokensText(settingString(settings, "whatsapp_enquiry_intro"), settings);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 md:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: page?.title || "Contact Us" }]} className="mb-4" />
      <h1 className="mb-10 font-serif text-3xl font-semibold md:text-4xl">{page?.title || "Contact Us"}</h1>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          {page?.body_html && (
            <div className="prose-paperica" dangerouslySetInnerHTML={{ __html: renderTokens(page.body_html, settings) }} />
          )}
          <EnquiryButtons
            settings={settings}
            label="WhatsApp Us"
            emailLabel="Email Us"
            whatsappMessage={null}
            emailSubject={null}
            className="mt-6"
          />
        </div>
        <section aria-labelledby="enquiry-heading" className="lg:sticky lg:top-40 lg:self-start">
          <h2 id="enquiry-heading" className="mb-5 font-serif text-2xl font-semibold">
            Send us a message
          </h2>
          <Suspense fallback={<EnquiryForm whatsappNumber={whatsappNumber} whatsappIntro={whatsappIntro} />}>
            <FormWithDefault searchParams={searchParams} whatsappNumber={whatsappNumber} whatsappIntro={whatsappIntro} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
