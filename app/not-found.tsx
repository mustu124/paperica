import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";
import SiteLayout from "./(site)/layout";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** 404 for URLs that match no route at all — shown inside the normal storefront header/footer. */
export default function NotFound() {
  return (
    <SiteLayout params={Promise.resolve({})}>
      <NotFoundContent />
    </SiteLayout>
  );
}
