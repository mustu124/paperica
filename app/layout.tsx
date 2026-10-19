import type { Metadata } from "next";
import { Fraunces, Jost, Marcellus_SC, Sacramento } from "next/font/google";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

// Flared small-caps serif for wordmark-style titles (closest match to the logo).
const display = Marcellus_SC({
  variable: "--font-marcellus-sc",
  subsets: ["latin"],
  weight: "400",
});

// Tall, narrow serif for headings ("Shop by Collection"). Libre Caslon Condensed (SIL OFL),
// self-hosted because next/font/google doesn't list it.
const serif = localFont({
  src: "./fonts/libre-caslon-condensed-latin.woff2",
  weight: "400 700",
  variable: "--font-caslon",
  display: "swap",
});

// Soft serif for big hero headlines, and a handwritten script for *emphasised* words.
const headline = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});
const script = Sacramento({
  variable: "--font-sacramento",
  subsets: ["latin"],
  weight: "400",
});

// Geometric sans for body copy, UI and wide-tracked labels.
const sans = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Paperica", template: "%s | Paperica" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${display.variable} ${serif.variable} ${headline.variable} ${script.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
