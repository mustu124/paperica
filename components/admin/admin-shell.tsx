"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  FileText,
  LayoutTemplate,
  ListTree,
  LogOut,
  Menu,
  Package,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/cn";

const NAV: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/admin/orders", label: "Orders", Icon: ClipboardList },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/homepage", label: "Homepage", Icon: LayoutTemplate },
  { href: "/admin/categories", label: "Categories & Menu", Icon: ListTree },
  { href: "/admin/pages", label: "Pages & FAQs", Icon: FileText },
  { href: "/admin/settings", label: "Site Settings", Icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <ul className="space-y-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.95rem] transition-colors",
                  active ? "bg-chilli text-white" : "text-ink hover:bg-blush/60",
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={1.7} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-1 border-t border-taupe pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.95rem] text-ink-muted hover:bg-blush/60 hover:text-ink"
        >
          <ExternalLink className="size-5" strokeWidth={1.7} aria-hidden />
          View shop
        </a>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[0.95rem] text-ink-muted hover:bg-blush/60 hover:text-chilli"
          >
            <LogOut className="size-5" strokeWidth={1.7} aria-hidden />
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}

export function AdminShell({ brand, email, children }: { brand: string; email: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-paper/30">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-taupe bg-white px-4 py-6 lg:flex print:hidden">
        <Link href="/admin/orders" className="mb-1 px-3 font-display text-2xl text-chilli">
          {brand}
        </Link>
        <p className="mb-6 truncate px-3 text-xs text-ink-muted">{email}</p>
        <NavList />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-taupe bg-white px-4 py-3 lg:hidden print:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="-ml-2 flex size-11 items-center justify-center">
            <Menu className="size-6" aria-hidden />
          </button>
          <span className="font-display text-xl text-chilli">{brand}</span>
        </header>
        <Drawer open={open} onClose={() => setOpen(false)} title={`${brand} admin`} side="left" className="max-w-xs bg-white">
          <NavList onNavigate={() => setOpen(false)} />
        </Drawer>

        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 md:px-8 md:py-10 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
