import type { NextConfig } from "next";

// Images uploaded through the admin live in the public Supabase Storage "media" bucket.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const isDev = process.env.NODE_ENV === "development";
// Vercel preview deployments load the Vercel comments toolbar.
const vercelLive = process.env.VERCEL_ENV === "preview" ? ["https://vercel.live"] : [];
const supabase = supabaseUrl ? [supabaseUrl.origin] : [];

/**
 * Content Security Policy without nonces: pages are statically prerendered (Cache Components /
 * PPR), which nonce-based CSP would disable, so inline scripts are allowed ('unsafe-inline').
 * Allowed third parties: Razorpay Checkout (checkout.js + its fraud-check script, iframe, API,
 * logos) and Supabase (Storage images, Auth/REST/Storage calls from the admin).
 */
const csp = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), "https://checkout.razorpay.com", "https://cdn.razorpay.com", ...vercelLive],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", ...supabase, "https://*.razorpay.com", ...vercelLive],
  "font-src": ["'self'", "data:", ...vercelLive],
  "connect-src": ["'self'", ...supabase, "https://*.razorpay.com", ...vercelLive],
  "frame-src": ["https://*.razorpay.com", ...vercelLive],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  // Skipped when Supabase itself is plain http (local development).
  ...(supabaseUrl?.protocol === "https:" ? { "upgrade-insecure-requests": [] } : {}),
};
const cspHeader = Object.entries(csp)
  .map(([directive, sources]) => [directive, ...sources].join(" "))
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      // Never index the admin panel or API responses (robots.txt disallows them too).
      { source: "/admin", headers: noindex },
      { source: "/admin/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
  // Short URLs for the NEW IN head (/new-in, /new-in/best-sellers); canonical URLs stay
  // under /collections.
  // Older /pages/<slug> links (e.g. in saved content) go to the top-level pages.
  async redirects() {
    return [
      { source: "/pages/help-centre", destination: "/faq", permanent: true },
      { source: "/pages/:slug", destination: "/:slug", permanent: true },
      { source: "/help-centre", destination: "/faq", permanent: true },
      // "View All" is the head page itself.
      { source: "/collections/:category/view-all", destination: "/collections/:category", permanent: true },
      { source: "/new-in/view-all", destination: "/collections/new-in", permanent: true },
      // Track Your Order was retired: order questions go through Contact (WhatsApp).
      { source: "/track-order", destination: "/contact", permanent: true },
      // NEW IN is the new collection: its "New Collection" link opens the NEW IN page itself.
      { source: "/collections/new-in/new-collection", destination: "/collections/new-in", permanent: false },
      { source: "/new-in/new-collection", destination: "/collections/new-in", permanent: false },
      // Product renamed (spelling fix); keeps links shared under the old address working.
      { source: "/products/unmatchaabl", destination: "/products/unmatchaable", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/new-in", destination: "/collections/new-in" },
      { source: "/new-in/:subcategory", destination: "/collections/new-in/:subcategory" },
    ];
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/media/**",
          },
        ]
      : [],
    // Local Supabase (supabase start) serves Storage from localhost.
    dangerouslyAllowLocalIP: supabaseUrl?.hostname === "localhost" || supabaseUrl?.hostname === "127.0.0.1",
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
