import { contentMetadata, PolicyPage } from "@/components/site/content/policy-page";

export function generateMetadata() {
  return contentMetadata("shipping-policy");
}

export default function Page() {
  return <PolicyPage slug="shipping-policy" />;
}
