import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/site/checkout/track-order-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getSiteSettings } from "@/lib/data/settings";
import { settingString } from "@/lib/settings";
import { formatWhatsAppDisplay, whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the status of your order with your order number and the mobile number or email used at checkout.",
};

export default async function TrackOrderPage() {
  const settings = await getSiteSettings();
  const email = settingString(settings, "contact_email");
  const wa = settingString(settings, "whatsapp_number");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6 md:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track Your Order" }]} className="mb-4" />
      <h1 className="mb-3 font-serif text-3xl font-semibold md:text-4xl">Track Your Order</h1>
      <p className="mb-8 text-ink/80">
        Enter your order number and the mobile number or email you used at checkout.
      </p>
      <TrackOrderForm />
      {(email || wa) && (
        <p className="mt-10 text-sm text-ink-muted">
          Need help?{" "}
          {email && (
            <a href={`mailto:${email}`} className="text-chilli underline underline-offset-4">
              {email}
            </a>
          )}
          {email && wa && " · "}
          {wa && (
            <a href={whatsappUrl(wa)} target="_blank" rel="noopener noreferrer" className="text-chilli underline underline-offset-4">
              WhatsApp {formatWhatsAppDisplay(wa)}
            </a>
          )}
        </p>
      )}
    </div>
  );
}
