import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** 404 for storefront routes that call notFound() (unknown product, collection, ...). */
export default function NotFound() {
  return <NotFoundContent />;
}
