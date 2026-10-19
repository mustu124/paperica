import { MessageCircle } from "lucide-react";
import { settingString, type SiteSettings } from "@/lib/settings";
import { whatsappUrl } from "@/lib/whatsapp";

/** Round blush chat button, bottom-right (where the reference shows its chat bubble). */
export function FloatingWhatsApp({ settings }: { settings: SiteSettings }) {
  const number = settingString(settings, "whatsapp_number");
  if (!number) return null;
  const href = whatsappUrl(number, settingString(settings, "whatsapp_default_message") || undefined);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
      className="floating-wa fixed bottom-4 right-4 z-30 flex size-12 items-center justify-center rounded-full bg-blush text-chilli-deep shadow-[0_0_0_6px_rgb(255_209_209/0.45),0_4px_14px_rgb(43_26_26/0.2)] transition-transform hover:scale-105 md:bottom-6 md:right-6 md:size-14"
    >
      <MessageCircle className="size-6" strokeWidth={1.8} aria-hidden />
    </a>
  );
}
