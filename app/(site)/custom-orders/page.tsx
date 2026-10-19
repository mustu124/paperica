import { EnquiryPage } from "@/components/site/content/enquiry-page";
import { contentMetadata } from "@/components/site/content/policy-page";

export function generateMetadata() {
  return contentMetadata("custom-orders");
}

export default function Page() {
  return <EnquiryPage slug="custom-orders" />;
}
