import Link from "next/link";
import { Fragment } from "react";

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const SAFE_HREF = /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/;

/**
 * Renders plain CMS text that may contain markdown-style links, e.g.
 * "Try our [Help Centre](/faq) or [Contact us](/contact)".
 * Only internal paths, http(s), mailto: and tel: links are turned into anchors.
 */
export function InlineLinks({ text, linkClassName }: { text: string; linkClassName?: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    if (SAFE_HREF.test(href)) {
      parts.push(
        href.startsWith("/") ? (
          <Link key={start} href={href} className={linkClassName}>
            {label}
          </Link>
        ) : (
          <a key={start} href={href} className={linkClassName}>
            {label}
          </a>
        ),
      );
    } else {
      parts.push(label);
    }
    last = start + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
