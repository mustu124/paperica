import { contentMetadata, PolicyPage } from "@/components/site/content/policy-page";

export function generateMetadata() {
  return contentMetadata("cancellation-returns-refund-policy");
}

export default function Page() {
  return <PolicyPage slug="cancellation-returns-refund-policy" />;
}
