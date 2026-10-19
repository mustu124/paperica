import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button, ButtonLink } from "@/components/ui/button";
import { Carousel } from "@/components/ui/carousel";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Price } from "@/components/ui/price";
import { ScribbleCircle } from "@/components/ui/scribble-circle";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductTileSkeleton, Skeleton } from "@/components/ui/skeleton";
import { StickerBadge } from "@/components/ui/sticker-badge";
import { DrawerDemo, ModalDemo, StepperDemo, ToastDemo } from "./demos";

// Internal review page: not linked from the site and excluded from search engines.
export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false, nocache: true },
};

const colours: { name: string; hex: string; usage: string }[] = [
  { name: "chilli", hex: "#C00000", usage: "Primary: buttons, wordmark, links" },
  { name: "chilli-deep", hex: "#8B0000", usage: "Hover, pressed, shadows" },
  { name: "chilli-soft", hex: "#D96060", usage: "Highlights, accents (large text only)" },
  { name: "blush", hex: "#FFD1D1", usage: "Nav bar, strips, tile backgrounds, tag buttons" },
  { name: "stem", hex: "#769B2F", usage: "Decorative green, icons (not small text)" },
  { name: "stem-deep", hex: "#5A7A22", usage: "NEW badges, in-stock/success text" },
  { name: "paper", hex: "#FDF5DC", usage: "Announcement bar, drawers, soft panels" },
  { name: "taupe", hex: "#D4CAB5", usage: "Dividers, muted panels (decorative)" },
  { name: "ink", hex: "#2B1A1A", usage: "Body text" },
  { name: "ink-muted", hex: "#6B5656", usage: "Secondary text, captions" },
  { name: "white", hex: "#FFFFFF", usage: "Page background" },
  { name: "tint-blue", hex: "#E4EEF6", usage: "Optional product-tile tint" },
];

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function Rating({ ratio }: { ratio: number }) {
  const grade = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large" : "decorative";
  return (
    <span className={ratio >= 4.5 ? "text-stem-deep" : ratio >= 3 ? "text-ink-muted" : "text-chilli"}>
      {ratio.toFixed(2)} {grade}
    </span>
  );
}

const sections = [
  ["colours", "Colours"],
  ["typography", "Typography"],
  ["buttons", "Buttons"],
  ["badges", "Badges & stickers"],
  ["headings", "Section heading"],
  ["price", "Price & quantity"],
  ["accordion", "Accordion"],
  ["overlays", "Drawer, modal, toast"],
  ["loading", "Skeleton"],
  ["navigation", "Breadcrumbs"],
  ["images", "Images"],
  ["carousel", "Carousel"],
  ["decoration", "Decoration"],
] as const;

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-taupe py-10 md:py-14">
      <h2 className="label-caps mb-6 text-chilli">{title}</h2>
      {children}
    </section>
  );
}

const productImages = [
  ["placeholder-spiral-notebook-a5", "Spiral Notebook A5"],
  ["placeholder-dot-grid-journal", "Dot Grid Journal"],
  ["placeholder-undated-planner", "Undated Planner"],
  ["placeholder-notepad-trio", "Notepad Trio"],
  ["placeholder-bookmark-set", "Bookmark Set"],
  ["placeholder-sticky-notes", "Sticky Notes"],
  ["placeholder-custom-name-notebook", "Custom Name Notebook"],
  ["placeholder-greeting-card-pack", "Greeting Card Pack"],
] as const;

const categoryTiles = [
  ["new-in", "New In"],
  ["notebooks-journals", "Notebooks & Journals"],
  ["planners", "Planners"],
  ["paper-edit", "Paper Edit"],
  ["gifts", "Gifts"],
  ["personalised", "Personalised"],
] as const;

export default function StyleguidePage() {
  // Design-system reference for developers: available locally and on preview deployments only.
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 md:px-8">
      {/* Masthead */}
      <header className="flex flex-col items-center gap-3 py-12 text-center">
        <Image src="/brand/paperica-logo.png" alt="Paperica logo" width={160} height={160} priority />
        <p className="font-display text-5xl text-chilli md:text-6xl">Paperica</p>
        <p className="label-caps text-chilli">All things paper</p>
        <p className="mt-4 max-w-xl text-sm text-ink-muted">
          Design system review page. Hidden from navigation and search engines.
        </p>
        <nav aria-label="Styleguide sections" className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="underline-offset-4 hover:text-chilli hover:underline">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Block id="colours" title="Colour tokens">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {colours.map((c) => (
            <li key={c.name} className="border border-taupe">
              <div className="h-20" style={{ backgroundColor: `var(--color-${c.name})` }} />
              <div className="space-y-1 p-3 text-xs">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="font-mono">{c.hex}</p>
                <p className="text-ink-muted">{c.usage}</p>
                <p>
                  vs white: <Rating ratio={contrast(c.hex, "#FFFFFF")} />
                </p>
                <p>
                  vs ink: <Rating ratio={contrast(c.hex, "#2B1A1A")} />
                </p>
              </div>
            </li>
          ))}
          <li className="border border-taupe">
            <div className="relative h-20 overflow-hidden bg-white">
              <ScribbleCircle className="absolute -top-6 left-1/2 size-32 -translate-x-1/2" />
            </div>
            <div className="space-y-1 p-3 text-xs">
              <p className="text-sm font-medium">scribble</p>
              <p className="font-mono">rgba(255, 90, 90, 0.5)</p>
              <p className="text-ink-muted">Thin decorative line-circles only</p>
            </div>
          </li>
        </ul>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <p className="bg-blush p-4 text-chilli">chilli on blush — <Rating ratio={contrast("#C00000", "#FFD1D1")} /></p>
          <p className="bg-paper p-4 text-chilli">chilli on paper — <Rating ratio={contrast("#C00000", "#FDF5DC")} /></p>
          <p className="bg-stem-deep p-4 text-white">white on stem-deep — {contrast("#FFFFFF", "#5A7A22").toFixed(2)} AA</p>
        </div>
      </Block>

      <Block id="typography" title="Typography">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <p className="label-caps text-ink-muted">Display · Marcellus SC</p>
            <p className="font-display text-6xl text-chilli">Paperica</p>
            <p className="font-display text-4xl">All Things Paper</p>
            <p className="font-display text-2xl">Thoughtful stationery, made for you</p>
          </div>
          <div className="space-y-4">
            <p className="label-caps text-ink-muted">Section headings · Playfair Display</p>
            <p className="font-serif text-4xl font-semibold">Shop By Collection</p>
            <p className="font-serif text-3xl font-semibold">Gifts for everyone</p>
            <p className="font-serif text-xl font-semibold">Your cart is empty</p>
          </div>
          <div className="space-y-3">
            <p className="label-caps text-ink-muted">Body & UI · Jost</p>
            <p className="text-lg">
              Welcome to a world where creativity meets colour, and everyday stationery becomes
              something worth looking forward to.
            </p>
            <p className="text-sm">
              Small text (14px) for product names, captions and form labels. <strong>Medium weight</strong>{" "}
              for emphasis.
            </p>
            <p className="text-xs text-ink-muted">Extra small (12px) for meta information.</p>
          </div>
          <div className="space-y-4">
            <p className="label-caps text-ink-muted">Labels · Jost uppercase, 0.35em tracking</p>
            <p className="label-caps text-chilli">All things paper</p>
            <p className="label-caps">Delivering across India</p>
            <p className="label-button">Button label · 0.14em</p>
          </div>
        </div>
        <div className="prose-paperica mt-10 max-w-2xl border-l-2 border-blush pl-6">
          <p className="label-caps not-italic text-ink-muted">Rich text (policies, descriptions)</p>
          <h2>1. Order Processing and Dispatch</h2>
          <p>
            Orders for ready-to-ship products are generally dispatched within{" "}
            <strong>4–6 business days after successful payment</strong>. See our{" "}
            <a href="#typography">Shipping Policy</a>.
          </p>
          <ul>
            <li>Company or organisation name.</li>
            <li>Estimated quantity.</li>
          </ul>
        </div>
      </Block>

      <Block id="buttons" title="Buttons">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Add to cart</Button>
            <Button variant="secondary">New in</Button>
            <Button variant="tag">Shop notebooks</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Text link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
            <ButtonLink href="#buttons" variant="secondary">
              Button as link
            </ButtonLink>
          </div>
          <div className="max-w-sm">
            <Button fullWidth size="lg">
              Customise on WhatsApp
            </Button>
          </div>
          <div className="relative aspect-[4/3] max-w-md overflow-hidden">
            <Image
              src="/placeholders/categories/gifts.svg"
              alt="Placeholder promo image"
              fill
              sizes="(min-width: 768px) 28rem, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <ButtonLink href="#buttons" variant="tag">
                Discover the gift shop
              </ButtonLink>
            </div>
          </div>
        </div>
      </Block>

      <Block id="badges" title="Badges & sticker badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="new">New</Badge>
          <Badge variant="offer">3 for ₹999</Badge>
          <Badge variant="sale">Sale</Badge>
          <Badge variant="soldout">Sold out</Badge>
          <Badge variant="neutral">Personalised</Badge>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-8">
          <StickerBadge size="sm">New!</StickerBadge>
          <StickerBadge>
            Notebooks
            <br />2 for ₹799
          </StickerBadge>
          <StickerBadge size="lg" tone="deep" tilt={8}>
            Gift
            <br />
            Sets
          </StickerBadge>
        </div>
        <div className="relative mt-8 aspect-[4/5] max-w-xs overflow-hidden bg-blush">
          <Image
            src="/placeholders/categories/notebooks-journals.svg"
            alt="Placeholder promo tile"
            fill
            sizes="20rem"
            className="object-cover"
          />
          <StickerBadge size="md" className="absolute left-4 top-1/3">
            Mix &amp;
            <br />
            match
          </StickerBadge>
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <ButtonLink href="#badges" variant="tag">
              Shop journals
            </ButtonLink>
          </div>
        </div>
      </Block>

      <Block id="headings" title="Section heading">
        <SectionHeading title="Shop By Collection" />
        <SectionHeading title="Best Sellers" eyebrow="Loved by our community" link={{ href: "#headings", label: "View all" }} />
        <SectionHeading title="Personalised for you" scribble />
      </Block>

      <Block id="price" title="Price & quantity stepper">
        <div className="flex flex-wrap items-end gap-10">
          <div>
            <p className="mb-1 text-xs text-ink-muted">Regular</p>
            <Price amount={449} />
          </div>
          <div>
            <p className="mb-1 text-xs text-ink-muted">On sale</p>
            <Price amount={699} compareAt={799} />
          </div>
          <div>
            <p className="mb-1 text-xs text-ink-muted">Product page</p>
            <Price amount={1199} compareAt={1399} size="lg" className="justify-start" />
          </div>
        </div>
        <div className="mt-8">
          <StepperDemo />
        </div>
      </Block>

      <Block id="accordion" title="Accordion">
        <div className="max-w-2xl">
          <h3 className="mb-3 font-serif text-xl font-semibold">Shipping &amp; Delivery</h3>
          <Accordion>
            <AccordionItem title="Sample question one?" defaultOpen>
              <p>Sample answer text. Real FAQs are edited in Admin → Pages &amp; FAQs.</p>
            </AccordionItem>
            <AccordionItem title="Sample question two?">
              <p>A second sample answer to show spacing between items.</p>
            </AccordionItem>
            <AccordionItem title="Sample question three?">
              <p>A third sample answer.</p>
            </AccordionItem>
          </Accordion>
        </div>
      </Block>

      <Block id="overlays" title="Drawer, modal & toast">
        <div className="space-y-6">
          <DrawerDemo />
          <ModalDemo />
          <ToastDemo />
        </div>
      </Block>

      <Block id="loading" title="Skeleton">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductTileSkeleton key={i} />
          ))}
        </div>
        <div className="mt-6 max-w-md space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Block>

      <Block id="navigation" title="Breadcrumbs">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Notebooks & Journals", href: "#navigation" },
            { label: "[Replace me] Dot Grid Journal" },
          ]}
        />
      </Block>

      <Block id="images" title="Image with fallback & tile backgrounds">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <figure>
            <div className="relative aspect-[4/5]">
              <ImageWithFallback
                src="/placeholders/products/placeholder-dot-grid-journal-1.svg"
                alt="Placeholder dot grid journal"
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-center text-xs text-ink-muted">Loaded image</figcaption>
          </figure>
          <figure>
            <div className="relative aspect-[4/5]">
              <ImageWithFallback
                src="/placeholders/products/does-not-exist.png"
                alt="Missing image"
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
              />
            </div>
            <figcaption className="mt-2 text-center text-xs text-ink-muted">Broken src → fallback</figcaption>
          </figure>
          <figure>
            <div className="relative aspect-[4/5]">
              <ImageWithFallback src={null} alt="No image yet" fill sizes="25vw" />
            </div>
            <figcaption className="mt-2 text-center text-xs text-ink-muted">No src → fallback</figcaption>
          </figure>
        </div>
        <p className="mb-3 mt-10 text-sm">Product tile backgrounds (default white / blush; paper and tint-blue only when photos suit):</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(["bg-white border border-taupe", "bg-blush", "bg-paper", "bg-tint-blue"] as const).map((bg) => (
            <div key={bg} className={`flex aspect-[4/5] items-center justify-center text-xs ${bg}`}>
              {bg.split(" ")[0].replace("bg-", "")}
            </div>
          ))}
        </div>
      </Block>

      <Block id="carousel" title="Carousel">
        <SectionHeading title="Shop By Collection" />
        <Carousel label="Shop by collection" slideClassName="basis-1/2 sm:basis-1/3 lg:basis-1/6">
          {categoryTiles.map(([slug, name]) => (
            <a key={slug} href="#carousel" className="group block text-center">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={`/placeholders/categories/${slug}.svg`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="mt-2 text-sm group-hover:text-chilli">{name}</p>
            </a>
          ))}
        </Carousel>

        <div className="mt-12">
          <SectionHeading title="Product carousel" />
          <Carousel label="Placeholder products" slideClassName="basis-1/2 md:basis-1/3 lg:basis-1/4" loop>
            {productImages.map(([slug, name], i) => (
              <div key={slug} className="text-center">
                <div className={`relative aspect-[4/5] overflow-hidden ${i % 2 ? "bg-blush" : "bg-white"}`}>
                  <Image
                    src={`/placeholders/products/${slug}-1.svg`}
                    alt={`[Replace me] ${name}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover"
                  />
                  {i < 3 && <Badge className="absolute left-2 top-2">New</Badge>}
                </div>
                <p className="mt-2 text-sm">[Replace me] {name}</p>
                <Price amount={299 + i * 100} />
              </div>
            ))}
          </Carousel>
        </div>

        <div className="mt-12 max-w-xl">
          <SectionHeading title="Autoplay (single slide)" />
          <Carousel label="Autoplay demo" autoplayMs={2500} loop arrows={false}>
            {categoryTiles.slice(0, 3).map(([slug, name]) => (
              <div key={slug} className="relative aspect-[16/9] overflow-hidden bg-blush">
                <Image src={`/placeholders/categories/${slug}.svg`} alt={`Replace me: placeholder ${name}`} fill sizes="36rem" className="object-cover" />
              </div>
            ))}
          </Carousel>
        </div>
      </Block>

      <Block id="decoration" title="Decoration">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative isolate flex min-h-64 flex-col items-center justify-center gap-2 bg-paper p-8 text-center">
            <ScribbleCircle className="absolute left-1/2 top-1/2 -z-10 size-56 -translate-x-1/2 -translate-y-1/2" />
            <p className="font-serif text-2xl font-semibold">Nothing here yet</p>
            <p className="text-sm text-ink-muted">Empty state with the scribble ring behind it.</p>
            <ButtonLink href="#decoration" variant="secondary" className="mt-3">
              Browse notebooks
            </ButtonLink>
          </div>
          <div className="flex min-h-64 items-center justify-center bg-blush">
            <SectionHeading title="Heading with scribble" scribble className="mb-0" />
          </div>
        </div>
      </Block>
    </div>
  );
}
