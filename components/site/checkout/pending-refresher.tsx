"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-checks a pending order every 5s for up to 2 minutes (the webhook may confirm it). */
export function PendingRefresher() {
  const router = useRouter();
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (tries > 24) clearInterval(id);
      else router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
