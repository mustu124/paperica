import Image from "next/image";
import { notFound } from "next/navigation";
import { resolveSubcategory } from "@/lib/collections";
import { renderTokens, renderTokensText } from "@/lib/content";
import { getCategoryTree } from "@/lib/data/categories";
import { getPage } from "@/lib/data/pages";
import { getCatalog, getProductCards } from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/settings";
import { parseFormConfig } from "@/lib/enquiry-forms";
import { titleCase } from "@/lib/format";
import { settingString } from "@/lib/settings";
import { EnquiryButtons } from "../enquiry-buttons";
import { ProductGrid } from "../product-grid";
import { ContentShell, Prose } from "./content-shell";
import { CorporateForm, CustomOrderForm } from "./quote-forms";

/**
 * Corporate Gifting / Custom Orders: page copy, then the guided quote form from
 * pages.form_config (sent on WhatsApp) — or, without a form, WhatsApp/email buttons above and
 * below the copy. Then any products tagged to the matching content subcategory.
 */
export async function EnquiryPage({ slug }: { slug: string }) {
  const [page, settings, tree, catalog] = await Promise.all([
    getPage(slug),
    getSiteSettings(),
    getCategoryTree(),
    getCatalog(),
  ]);
  if (!page) notFound();

  // Products tagged to the content subcategory with the same slug (e.g. PERSONALISED → Corporate Gifting).
  let productIds: string[] = [];
  let parent: { name: string; href: string } | null = null;
  for (const category of tree) {
    const sub = category.subcategories.find((s) => s.slug === slug && s.kind === "content_page");
    if (sub) {
      parent = { name: category.name, href: category.href };
      const ids = resolveSubcategory(sub, category, catalog);
      productIds = catalog.products.filter((p) => ids.has(p.id)).map((p) => p.id);
      break;
    }
  }
  const products = await getProductCards(productIds);
  const cta = {
    settings,
    label: page.cta_label,
    whatsappMessage: page.cta_whatsapp_message,
    emailSubject: page.cta_email_subject,
  };

  const form = parseFormConfig(page.form_config);
  const formProps = {
    whatsappNumber: settingString(settings, "whatsapp_number"),
    intro: page.cta_whatsapp_message ? renderTokensText(page.cta_whatsapp_message, settings) : "",
    ctaLabel: page.cta_label ?? "",
  };
  const email = settingString(settings, "contact_email");
  const mailto = `mailto:${email}${page.cta_email_subject ? `?subject=${encodeURIComponent(page.cta_email_subject)}` : ""}`;

  return (
    <>
      <ContentShell
        wide={Boolean(form?.gallery.length)}
        title={page.title}
        crumbs={[
          { label: "Home", href: "/" },
          ...(parent ? [{ label: titleCase(parent.name), href: parent.href }] : []),
          { label: page.title },
        ]}
      >
        {form ? (
          <>
            {form.gallery.length > 0 ? (
              // Write-up beside the photos (photos stay in view while reading); stacked on phones.
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
                <Prose html={renderTokens(page.body_html, settings)} className="[&>h2:first-child]:mt-0" />
                <ul className="grid grid-cols-2 gap-3 self-start md:gap-4 lg:sticky lg:top-36">
                  {form.gallery.map((img, i) => (
                    <li key={img.url} className={form.gallery.length % 2 === 1 && i === form.gallery.length - 1 ? "col-span-2" : undefined}>
                      <figure>
                        <div
                          className={
                            form.gallery.length % 2 === 1 && i === form.gallery.length - 1
                              ? "relative aspect-[16/10] overflow-hidden rounded-2xl bg-blush"
                              : "relative aspect-[4/5] overflow-hidden rounded-2xl bg-blush"
                          }
                        >
                          <Image src={img.url} alt={img.alt} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
                        </div>
                        {img.caption && <figcaption className="mt-2 text-sm font-medium">{img.caption}</figcaption>}
                      </figure>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Prose html={renderTokens(page.body_html, settings)} />
            )}
            <section id="quote" aria-label="Enquiry form" className="mt-12 scroll-mt-32 border border-taupe bg-white/70 p-5 md:p-8">
              {form.form === "custom_order" ? (
                <CustomOrderForm config={form} {...formProps} />
              ) : (
                <CorporateForm config={form} {...formProps} />
              )}
            </section>
            {email && (
              <p className="mt-6 text-sm text-ink-muted">
                Prefer email? Write to{" "}
                <a href={mailto} className="font-medium text-chilli underline underline-offset-4">
                  {email}
                </a>
                .
              </p>
            )}
          </>
        ) : (
          <>
            <EnquiryButtons {...cta} className="mb-10" />
            <Prose html={renderTokens(page.body_html, settings)} />
            <EnquiryButtons {...cta} className="mt-10 border-t border-taupe pt-8" />
          </>
        )}
      </ContentShell>

      {products.length > 0 && (
        <section aria-label="Products" className="mx-auto w-full max-w-[1440px] px-4 pb-20 md:px-6">
          <ProductGrid products={products} />
        </section>
      )}
    </>
  );
}
