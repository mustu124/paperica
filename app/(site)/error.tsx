"use client";

import { useEffect } from "react";
import { StatusMessage } from "@/components/site/status-message";
import { Button, ButtonLink } from "@/components/ui/button";

/** Storefront error boundary (keeps the header/footer). */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusMessage
      eyebrow="Something went wrong"
      title="We couldn't load this page"
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
        </>
      }
    >
      <p>Please try again in a moment.{error.digest ? ` (Ref: ${error.digest})` : ""}</p>
    </StatusMessage>
  );
}
