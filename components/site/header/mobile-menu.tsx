"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Drawer } from "@/components/ui/drawer";
import type { MenuCategory } from "@/lib/data/menu";
import type { NavLink, SocialLink } from "@/lib/settings";
import { SocialLinks } from "../social-icons";

/** Hamburger button + left slide-in drawer with the six heads as accordions. */
export function MobileMenu({
  menu,
  footerLinks,
  socials,
}: {
  menu: MenuCategory[];
  footerLinks: NavLink[];
  socials: SocialLink[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
        className="-ml-2 flex size-11 items-center justify-center hover:text-chilli"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      <Drawer open={open} onClose={close} title="Menu" side="left" className="bg-white">
        <nav aria-label="Main">
          <Accordion className="-mx-5 border-t-0 px-5">
            {menu.map((cat) => (
              <AccordionItem
                key={cat.id}
                name="mobile-menu"
                title={<span className="text-sm font-medium uppercase tracking-[0.12em]">{cat.name}</span>}
              >
                <ul className="pl-1">
                  {cat.subcategories.map((sub) => (
                    <li key={sub.id}>
                      <Link href={sub.href} onClick={close} className="block py-2.5 text-sm hover:text-chilli">
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionItem>
            ))}
          </Accordion>

          {footerLinks.length > 0 && (
            <ul className="mt-6">
              {footerLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={close} className="block py-2.5 text-sm text-ink-muted hover:text-chilli">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <SocialLinks links={socials} className="mt-6 -ml-1 text-chilli" iconClassName="size-5" />
        </nav>
      </Drawer>
    </>
  );
}
