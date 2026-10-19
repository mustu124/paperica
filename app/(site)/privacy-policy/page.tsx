import { contentMetadata, PolicyPage } from "@/components/site/content/policy-page";

export function generateMetadata() {
  return contentMetadata("privacy-policy");
}

export default function Page() {
  return <PolicyPage slug="privacy-policy" />;
}
