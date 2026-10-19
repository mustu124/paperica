import { contentMetadata, PolicyPage } from "@/components/site/content/policy-page";

export function generateMetadata() {
  return contentMetadata("terms-and-conditions");
}

export default function Page() {
  return <PolicyPage slug="terms-and-conditions" />;
}
