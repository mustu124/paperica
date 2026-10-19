import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, Prose } from "@/components/site/content/content-shell";
import { POLICY_SLUGS } from "@/components/site/content/policy-page";
import { EnquiryButtons } from "@/components/site/enquiry-buttons";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { renderTokens } from "@/lib/content";
import { excerpt, getAllPages, getFaqGroups, getPage } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/settings";

// The faq page body is split at this marker: intro above, "Need More Help?" below.
const FAQ_MARKER = /<!--\s*FAQs render here[^>]*-->/i;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage("faq"), getSiteSettings()]);
  return {
    title: page?.title || "FAQs",
    description: excerpt(renderTokens(page?.body_html ?? "", settings)) || undefined,
    alternates: { canonical: "/faq" },
  };
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Help Centre: grouped FAQ accordions, "Need More Help?" contacts and policy links. */
export default async function FaqPage() {
  const [page, settings, groups, pages] = await Promise.all([
    getPage("faq"),
    getSiteSettings(),
    getFaqGroups(),
    getAllPages(),
  ]);
  const body = renderTokens(page?.body_html ?? "", settings);
  const [intro, outro = ""] = body.split(FAQ_MARKER);
  const policies = POLICY_SLUGS.flatMap((slug) => {
    const p = pages.find((x) => x.slug === slug);
    return p ? [{ href: `/${slug}`, title: p.title }] : [];
  });
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) =>
      g.items.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: excerpt(renderTokens(f.answer_html, settings), 1000) },
      })),
    ),
  };

  return (
    <ContentShell title={page?.title || "FAQs"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      {intro.trim() && <Prose html={intro} />}

      {groups.length > 1 && (
        <nav aria-label="FAQ topics" className="mt-8 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a
              key={g.name}
              href={`#${slugify(g.name)}`}
              className="inline-flex min-h-11 items-center border border-ink/25 px-3 text-xs hover:border-chilli hover:text-chilli lg:min-h-0 lg:py-1.5"
            >
              {g.name}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-10 space-y-12">
        {groups.map((g) => (
          <section key={g.name} id={slugify(g.name)} className="scroll-mt-40">
            <h2 className="mb-3 font-serif text-2xl font-semibold">{g.name}</h2>
            <Accordion>
              {g.items.map((f) => (
                <AccordionItem key={f.id} title={f.question}>
                  <Prose html={renderTokens(f.answer_html, settings)} className="text-base [&_p:last-child]:mb-0" />
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>

      {outro.trim() && (
        <section className="mt-14 border-t border-taupe pt-8">
          <Prose html={outro} />
          <EnquiryButtons
            settings={settings}
            label="WhatsApp Us"
            emailLabel="Email Us"
            whatsappMessage={null}
            emailSubject={null}
            className="mt-6"
          />
        </section>
      )}

      {policies.length > 0 && (
        <nav aria-label="Policies" className="mt-12 bg-paper/50 p-6">
          <ul className="grid gap-x-3 text-sm sm:grid-cols-2 lg:gap-y-3">
            {policies.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="inline-flex min-h-11 items-center text-chilli underline-offset-4 hover:underline lg:min-h-0">
                  {p.title} →
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </ContentShell>
  );
}
