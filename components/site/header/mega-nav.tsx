"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuCategory } from "@/lib/data/menu";
import { cn } from "@/lib/cn";
import { titleCase } from "@/lib/format";

/**
 * Desktop nav (on the header's pink) with full-width mega-menu panels. The current section is
 * underlined in chilli; "Home" comes first.
 * Opens on hover (with a short intent delay) or on click/keyboard; Escape closes and
 * returns focus to the trigger; following any link closes the panel.
 */
export function MegaNav({ menu, pathname = null }: { menu: MenuCategory[]; pathname?: string | null }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isCurrent = (href: string) => pathname != null && (pathname === href || pathname.startsWith(`${href}/`));
  const item = "flex h-11 items-center border-b-2 text-[0.8125rem] font-medium uppercase tracking-[0.12em] transition-colors";

  const schedule = useCallback((id: string | null, delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenId(id), delay);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpenId(null);
  }, []);

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="relative hidden lg:block"
      onMouseLeave={() => schedule(null, 150)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && openId) {
          triggerRefs.current[openId]?.focus();
          close();
        }
      }}
      onBlur={(e) => {
        if (!navRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <ul className="mx-auto flex max-w-[1440px] items-center justify-center gap-x-8 px-6 xl:gap-x-14">
        <li onMouseEnter={() => schedule(null, 120)}>
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={cn(item, pathname === "/" ? "border-chilli text-chilli" : "border-transparent hover:text-chilli")}
          >
            Home
          </Link>
        </li>
        {menu.map((cat) => {
          const isOpen = openId === cat.id;
          return (
            <li key={cat.id} onMouseEnter={() => schedule(cat.id, openId ? 0 : 120)}>
              <button
                ref={(el) => {
                  triggerRefs.current[cat.id] = el;
                }}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`mega-${cat.id}`}
                onClick={() => (isOpen ? close() : setOpenId(cat.id))}
                className={cn(
                  item,
                  isOpen || isCurrent(cat.href) ? "border-chilli text-chilli" : "border-transparent hover:text-chilli",
                )}
              >
                {cat.name}
              </button>
            </li>
          );
        })}
      </ul>

      {menu.map((cat) => (
        <div
          key={cat.id}
          id={`mega-${cat.id}`}
          hidden={openId !== cat.id}
          onMouseEnter={() => schedule(cat.id, 0)}
          className="absolute inset-x-0 top-full z-40 border-t border-chilli/10 bg-cream shadow-[0_16px_28px_-14px_rgb(139_0_0/0.3)]"
        >
          <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-10 px-10 py-8">
            <div>
              <p className="mb-6 flex items-baseline gap-3">
                <span className="font-serif text-4xl font-bold text-chilli">{titleCase(cat.name)}</span>
                <Link
                  href={cat.href}
                  onClick={close}
                  className="text-xs text-chilli underline underline-offset-4 hover:text-chilli-deep"
                >
                  Shop All
                </Link>
              </p>
              <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em]">{cat.name}</p>
              <ul className="space-y-2">
                {cat.subcategories.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={sub.href}
                      onClick={close}
                      className="text-sm text-ink/80 hover:text-chilli hover:underline hover:underline-offset-4"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {cat.featureImages.length > 0 && (
              <div className="border-l border-taupe pl-10">
                <ul className="flex gap-6">
                  {cat.featureImages.map((img, i) => (
                    <li key={`${img.url}-${i}`} className="w-full max-w-64">
                      <Link href={img.link_url || cat.href} onClick={close} className="group block">
                        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-blush">
                          <Image
                            src={img.url}
                            alt={img.alt}
                            fill
                            sizes="256px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        {img.label && (
                          <p className="mt-2 text-sm group-hover:text-chilli">{img.label}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </nav>
  );
}

function MegaNavWithPath({ menu }: { menu: MenuCategory[] }) {
  return <MegaNav menu={menu} pathname={usePathname()} />;
}

/**
 * Nav with the current section underlined. Reading the URL is request-time data, so it sits in
 * Suspense: the prerendered shell shows the same nav without the underline (no layout shift).
 */
export function MainNav({ menu }: { menu: MenuCategory[] }) {
  return (
    <Suspense fallback={<MegaNav menu={menu} />}>
      <MegaNavWithPath menu={menu} />
    </Suspense>
  );
}
