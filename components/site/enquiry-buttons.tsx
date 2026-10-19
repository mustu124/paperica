import { Mail } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { renderTokensText } from "@/lib/content";
import { settingString, type SiteSettings } from "@/lib/settings";
import { cn } from "@/lib/cn";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * "Enquire on WhatsApp" (primary) + "Email us" (secondary) for enquiry pages.
 * The pre-filled WhatsApp message and email subject come from the page row
 * (pages.cta_whatsapp_message / cta_email_subject); the number and address from settings.
 */
export function EnquiryButtons({
  settings,
  label,
  emailLabel,
  whatsappMessage,
  emailSubject,
  className,
}: {
  settings: SiteSettings;
  /** WhatsApp button text, e.g. "Enquire About Corporate Gifting" (pages.cta_label). */
  label?: string | null;
  emailLabel?: string;
  whatsappMessage: string | null;
  emailSubject: string | null;
  className?: string;
}) {
  const number = settingString(settings, "whatsapp_number");
  const email = settingString(settings, "contact_email");
  if (!number && !email) return null;

  const message = whatsappMessage ? renderTokensText(whatsappMessage, settings) : undefined;
  const mailto = email
    ? `mailto:${email}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ""}`
    : null;

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      {number && (
        <a
          href={whatsappUrl(number, message)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ size: "lg", className: "sm:min-w-64" })}
        >
          <WhatsAppIcon />
          {label || "Enquire on WhatsApp"}
        </a>
      )}
      {mailto && (
        <a href={mailto} className={buttonClasses({ variant: "secondary", size: "lg", className: "sm:min-w-48" })}>
          <Mail className="size-4" aria-hidden />
          {emailLabel || "Email us"}
        </a>
      )}
    </div>
  );
}
