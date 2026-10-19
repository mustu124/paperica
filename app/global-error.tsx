"use client";

import "./globals.css";

/** Last-resort error page when the root layout itself fails (no header/footer available). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body className="flex min-h-screen items-center justify-center bg-white px-4 font-sans text-ink">
        <div className="max-w-md text-center">
          <p className="label-caps mb-3 text-chilli">Something went wrong</p>
          <h1 className="mb-4 font-serif text-3xl font-semibold">We couldn&apos;t load the site</h1>
          <p className="mb-6 text-ink-muted">
            Please try again in a moment.{error.digest ? ` (Ref: ${error.digest})` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            className="label-button h-11 bg-chilli px-6 text-white hover:bg-chilli-deep"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
