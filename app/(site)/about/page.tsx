import type { Metadata } from "next";
import { ContentShell, Prose } from "@/components/site/content/content-shell";
import { renderTokens } from "@/lib/content";
import { excerpt, getPage } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/settings";
import { settingString } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage("about"), getSiteSettings()]);
  const description = excerpt(settingString(settings, "about_intro_html"));
  return {
    title: page?.title || settingString(settings, "brand_name"),
    description: description || undefined,
    alternates: { canonical: "/about" },
  };
}

/**
 * About: intro on top, then Our Story and Our Mission side by side (stacked on mobile).
 * All three blocks are site_settings HTML (about_intro_html, founder_story_html, mission_html),
 * each carrying its own heading; the page title comes from pages.about.
 */
export default async function AboutPage() {
  const [page, settings] = await Promise.all([getPage("about"), getSiteSettings()]);
  const html = (key: string) => renderTokens(settingString(settings, key), settings);
  const intro = html("about_intro_html");
  const story = html("founder_story_html");
  const mission = html("mission_html");

  return (
    <ContentShell title={page?.title || settingString(settings, "brand_name")} wide>
      {intro && <Prose html={intro} className="max-w-[760px] text-lg md:text-xl" />}
      {(story || mission) && (
        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-14">
          {story && (
            <section className="border-t-2 border-chilli bg-paper/40 p-6 md:p-8">
              <Prose html={story} className="[&_h2]:mt-0" />
            </section>
          )}
          {mission && (
            <section className="border-t-2 border-chilli bg-paper/40 p-6 md:p-8">
              <Prose html={mission} className="[&_h2]:mt-0" />
            </section>
          )}
        </div>
      )}
      {page?.body_html && <Prose html={renderTokens(page.body_html, settings)} className="mt-14 max-w-[760px]" />}
    </ContentShell>
  );
}
