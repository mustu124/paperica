"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { StatusBadge, Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { whatsappUrl } from "@/lib/whatsapp";
import { setEnquiryHandled } from "./actions";

export function EnquiryActions({
  id,
  handled,
  name,
  email,
  phone,
  typeLabel,
}: {
  id: string;
  handled: boolean;
  name: string;
  email: string;
  phone: string | null;
  typeLabel: string;
}) {
  const { run } = useSave();
  const [isHandled, setIsHandled] = useState(handled);
  const first = name.split(" ")[0];
  const btn = "inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 text-xs font-medium lg:min-h-0 lg:py-1.5";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle
        checked={isHandled}
        onChange={(v) => {
          setIsHandled(v);
          void run(() => setEnquiryHandled(id, v), v ? "Marked as handled" : "Marked as new").then((r) => !r.ok && setIsHandled(!v));
        }}
        label={isHandled ? <StatusBadge status="closed" label="Handled" /> : <StatusBadge status="new" label="New" />}
      />
      {phone ? (
        <a
          href={whatsappUrl(`91${phone}`, `Hi ${first}! Thanks for your ${typeLabel.toLowerCase()} enquiry with Paperica.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border-stem-deep text-stem-deep hover:bg-stem-deep hover:text-white`}
        >
          <WhatsAppIcon className="size-4" /> Reply on WhatsApp
        </a>
      ) : (
        <span className="text-xs text-ink-muted">No mobile number given</span>
      )}
      <a
        href={`mailto:${email}?subject=${encodeURIComponent(`Re: your ${typeLabel.toLowerCase()} enquiry`)}`}
        className={`${btn} border-ink/25 hover:border-chilli hover:text-chilli`}
      >
        <Mail className="size-4" aria-hidden /> Reply by email
      </a>
    </div>
  );
}
