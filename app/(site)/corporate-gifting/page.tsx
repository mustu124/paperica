import { EnquiryPage } from "@/components/site/content/enquiry-page";
import { contentMetadata } from "@/components/site/content/policy-page";

export function generateMetadata() {
  return contentMetadata("corporate-gifting");
}

export default function Page() {
  return <EnquiryPage slug="corporate-gifting" />;
}
