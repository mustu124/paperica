import { ButtonLink } from "@/components/ui/button";
import { StatusMessage } from "./status-message";

export function NotFoundContent() {
  return (
    <StatusMessage
      eyebrow="404"
      title="This page has gone missing"
      actions={
        <>
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/search" variant="secondary">
            Search the shop
          </ButtonLink>
        </>
      }
    >
      <p>It may have moved, or the link might be mistyped.</p>
    </StatusMessage>
  );
}
