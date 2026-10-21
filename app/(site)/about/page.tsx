import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Prose } from "@/components/site/content/content-shell";
import { ButtonLink } from "@/components/ui/button";
import { DoodleDashes, DoodleHeart, DoodleSquiggle, DoodleStar } from "@/components/ui/doodles";
import { ScribbleCircle } from "@/components/ui/scribble-circle";
import { renderTokens } from "@/lib/content";
import { getMenu } from "@/lib/data/menu";
import { excerpt, getPage } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/settings";
import { BUNDLED_ROUND_LOGO, settingString } from "@/lib/settings";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage("about"), getSiteSettings()]);
  const description = excerpt(settingString(settings, "about_intro_html"));
  return {
    title: page?.title || settingString(settings, "brand_name"),
    description: description || undefined,
    alternates: { canonical: "/about" },
  };
}

/** Story/mission HTML may start with its own <h2>: that becomes the card's heading. */
function splitHeading(html: string, fallback: string) {
  const m = html.match(/^\s*<h2[^>]*>([\s\S]*?)<\/h2>\s*/i);
  return m ? { title: m[1].replace(/<[^>]+>/g, "").trim() || fallback, body: html.slice(m[0].length) } : { title: fallback, body: html };
}

/** Paper card with a strip of tape, slightly tilted, for Our Story / Our Mission. */
function NoteCard({ title, html, tone, tilt, doodle }: { title: string; html: string; tone: string; tilt: string; doodle: React.ReactNode }) {
  return (
    <section className={cn("relative rounded-[2rem] px-6 pb-8 pt-10 shadow-[0_10px_30px_-12px_rgb(139_0_0/0.25)] md:px-9", tone, tilt)}>
      {/* tape */}
      <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[-4deg] rounded-sm bg-white/70 shadow-sm" />
      <h2 className="flex items-center gap-2 font-script text-5xl leading-none text-chilli md:text-6xl">
        {title}
        {doodle}
      </h2>
      <Prose html={html} className="mt-4 text-[1.0625rem] [&_p]:my-3" />
    </section>
  );
}

/**
 * About: a playful split hero in the logo's colours (intro + signature beside an arched photo
 * with stickers), then Our Story and Our Mission as paper notes. Text comes from site settings
 * (about_intro_html, founder_story_html, mission_html), the photo from about_image_url.
 */
export default async function AboutPage() {
  const [page, settings, menu] = await Promise.all([getPage("about"), getSiteSettings(), getMenu()]);
  const html = (key: string) => renderTokens(settingString(settings, key), settings);
  const intro = html("about_intro_html");
  const story = splitHeading(html("founder_story_html"), "Our Story");
  const mission = splitHeading(html("mission_html"), "Our Mission");
  const brand = settingString(settings, "brand_name") || "Paperica";
  const tagline = settingString(settings, "tagline");
  const photo = settingString(settings, "about_image_url");
  const title = page?.title || brand;
  const shop = menu[0];

  return (
    <div className="overflow-x-clip">
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative bg-butter/70">
        <DoodleSquiggle className="absolute left-4 top-6 w-28 text-chilli/40 md:left-10 md:w-40" />
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-12 md:grid-cols-[1.1fr_1fr] md:gap-10 md:px-8 md:pb-24 md:pt-20">
          <div className="relative text-center md:order-1">
            <p className="label-caps inline-block border-b-2 border-chilli pb-1 text-chilli">About us</p>
            <h1 className="mt-5 font-headline text-4xl font-semibold leading-[1.05] text-chilli md:text-6xl">{title}</h1>
            {intro && <Prose html={intro} className="mx-auto mt-6 max-w-xl text-lg italic text-ink/85 md:text-xl" />}
            <p className="mt-8 font-script text-6xl leading-none text-chilli md:text-7xl" aria-label={`— ${brand}`}>
              {brand} <DoodleHeart className="size-8 -translate-y-2 text-chilli" />
            </p>
          </div>

          {/* Arched photo with stickers */}
          <div className="relative mx-auto w-full max-w-[420px] md:order-2">
            <ScribbleCircle className="absolute -right-10 -top-10 size-44 text-chilli/45 md:-right-14 md:-top-12 md:size-56" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-b-[2rem] rounded-t-full border-[6px] border-white bg-blush shadow-[0_20px_45px_-20px_rgb(139_0_0/0.45)]">
              <Image
                src={photo || BUNDLED_ROUND_LOGO}
                alt={photo ? `${brand} stationery` : `${brand} logo`}
                fill
                priority
                sizes="(min-width: 768px) 420px, 90vw"
                className={photo ? "object-cover" : "object-contain p-10"}
              />
            </div>
            {tagline && (
              <p
                aria-hidden
                className="absolute -left-4 bottom-16 rotate-[-8deg] rounded-xl bg-blush px-4 py-2 font-headline text-2xl font-black uppercase leading-[0.95] text-chilli shadow-[4px_4px_0_0_var(--color-chilli)] md:-left-14 md:text-3xl"
              >
                {tagline.split(" ").slice(0, Math.ceil(tagline.split(" ").length / 2)).join(" ")}
                <br />
                {tagline.split(" ").slice(Math.ceil(tagline.split(" ").length / 2)).join(" ")}
              </p>
            )}
            <Image
              src="/brand/paperica-chilli.png"
              alt=""
              width={512}
              height={512}
              className="absolute -bottom-8 -right-6 w-24 rotate-[18deg] drop-shadow-md md:-right-10 md:w-32"
            />
            <DoodleStar className="absolute -left-2 top-6 size-8 rotate-12 text-chilli md:-left-8 md:size-10" />
            <DoodleDashes className="absolute right-6 top-2 size-8 text-chilli" />
          </div>
        </div>
        {/* wavy edge into the page */}
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden className="block h-6 w-full text-cream md:h-8">
          <path d="M0 22C120 8 240 8 360 18s240 22 360 12 240-28 360-22 240 22 360 14V40H0Z" fill="currentColor" />
        </svg>
      </section>

      {/* ------------------------------------------------------- story + mission */}
      {(story.body || mission.body) && (
        <section className="mx-auto grid max-w-[1100px] gap-12 px-4 py-16 md:grid-cols-2 md:gap-10 md:px-8 md:py-20">
          {story.body && (
            <NoteCard title={story.title} html={story.body} tone="bg-blush/80" tilt="md:-rotate-1" doodle={<DoodleStar className="size-7 text-chilli" />} />
          )}
          {mission.body && (
            <NoteCard title={mission.title} html={mission.body} tone="bg-sage/80" tilt="md:rotate-1 md:translate-y-8" doodle={<DoodleHeart className="size-7 text-chilli" />} />
          )}
        </section>
      )}

      {page?.body_html && (
        <div className="mx-auto max-w-[760px] px-4 pb-10 md:px-6">
          <Prose html={renderTokens(page.body_html, settings)} />
        </div>
      )}

      {/* --------------------------------------------------------------- outro */}
      {shop && (
        <section className="px-4 pb-20 text-center md:pt-6">
          <ButtonLink href={shop.href} size="lg">
            Shop {shop.name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </section>
      )}
    </div>
  );
}
