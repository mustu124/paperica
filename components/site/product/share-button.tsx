"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

/** Native share sheet on mobile, otherwise copies the link. */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const { toast } = useToast();

  const share = async () => {
    // Native share sheet on touch devices; desktop browsers copy the link instead.
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url: url || window.location.href });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      toast("Link copied", "success");
    } catch {
      toast("Couldn't copy the link. Please copy it from the address bar.", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/25 bg-white px-5 text-sm hover:border-chilli hover:text-chilli"
    >
      <Share2 className="size-4" aria-hidden />
      Share this
    </button>
  );
}
