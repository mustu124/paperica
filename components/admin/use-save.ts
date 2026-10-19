"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";

type Result = { ok: true; data?: unknown } | { ok: false; error: string };

/**
 * Runs an admin server action with a pending state and a toast for the outcome,
 * then refreshes the current admin page so lists show the saved data.
 */
export function useSave() {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const run = (action: () => Promise<Result>, success = "Saved", { refresh = true } = {}) =>
    new Promise<Result>((resolve) => {
      startTransition(async () => {
        try {
          const result = await action();
          if (result.ok) {
            toast(success, "success");
            if (refresh) router.refresh();
          } else {
            toast(result.error, "error");
          }
          resolve(result);
        } catch (e) {
          console.error(e);
          toast("Something went wrong. Please try again.", "error");
          resolve({ ok: false, error: "Something went wrong" });
        }
      });
    });

  return { run, pending };
}
