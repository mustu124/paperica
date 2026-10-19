# Paperica — paperica.in

E-commerce site for Paperica, an Indian stationery brand ("All Things Paper").

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Storage, Auth) · Razorpay · Vercel

Customers check out as guests. The only login is the private admin panel at `/admin`.
For the shop owner: **[Owner's Guide](docs/owner-guide.md)** (plain-language admin how-tos).
All business data (contact details, shipping fee, timelines, copy, policies, FAQs, images)
is stored in Supabase and edited from the admin panel. Env files hold technical secrets only.

## Project structure

```
app/(site)/          public storefront
app/admin/           private admin panel (guarded by proxy.ts)
app/api/             Razorpay order, verification and webhook routes
components/site      storefront components
components/admin     admin components
components/ui        shared primitives
lib/supabase/        server.ts (user session), client.ts (browser), admin.ts (service role, server only)
lib/razorpay.ts      Razorpay client + signature verification (server only)
lib/whatsapp.ts      wa.me link builders
lib/format.ts        INR formatting (amounts stored in paise), slugs, dates
supabase/migrations  SQL migrations
supabase/seed.sql    seed data
types/db.ts          database types
proxy.ts             admin route guard (Next.js 16's replacement for middleware.ts)
next.config.ts       security headers (CSP etc.), redirects, image hosts
vercel.json          Vercel function region (bom1 = Mumbai)
app/api/health       uptime health check
brand/               source brand files (logo, copy handover, reference layout); not committed
public/brand/        logo files served by the site (see "Brand assets")
public/placeholders/ seeded sample images, all labelled "Replace me"
docs/owner-guide.md  plain-language guide for the shop owner
```

## Brand assets

Generated from `brand/Paperica logo (3).png` (transparent) and `brand/Paperica logo (1).pdf` (pink background):

| File | Use |
| --- | --- |
| `public/brand/paperica-logo-horizontal.png` | Header logo (default `logo_url`): chilli + “ALL THINGS PAPER” + PAPERICA, rendered from the logo PDF's own lettering (EFCO Brookshire / Canva Sans, logo red #BF0003). The fonts themselves are not shipped. |
| `public/brand/paperica-logo-trim.png` | Round logo: footer and Instagram avatar (default `footer_illustration_url`) |
| `public/brand/paperica-logo.png` | Full-size transparent logo (styleguide, print) |
| `public/brand/paperica-logo-pink.png` | Pink-background logo, 1600×1600, for social profiles |
| `public/brand/paperica-og.jpg` | Default link-preview (OpenGraph/Twitter) image, 1200×630 (default `og_image_url`) |
| `public/brand/paperica-chilli.png` | Chilli illustration (source of the icons) |
| `app/favicon.ico`, `app/icon.png` | Browser icons (chilli, transparent; 16/32/48 and 512px) |
| `app/apple-icon.png` | iOS home-screen icon (chilli on blush, 180px) |

The logos and preview image are site settings, so the owner can replace them in
Admin → Site Settings → Branding & sharing (uploads go to the `branding/` folder of the media bucket).
**Look & fonts:** pink header and announcement in chilli, cream page, pastel collection tiles, white rounded product cards and pill buttons (tokens in `app/globals.css`). Headings use Libre Caslon Condensed (SIL OFL, self-hosted in `app/fonts/`), hero headlines Fraunces with Sacramento for `*starred*` words, body Jost.

Pages that set their own `openGraph` spread in `shareImages()` from `lib/seo.ts`, because Next.js
replaces (doesn't merge) a parent's `openGraph`.

## Local setup

Requirements: Node.js 20+ (22 recommended) and a Supabase project (free tier is fine). Razorpay test keys for checkout.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, `https://paperica.in` in production |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key. **Server only — never prefix with `NEXT_PUBLIC_`.** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Dashboard → Account & Settings → API Keys → Key Id (public; used by Checkout in the browser) |
| `RAZORPAY_KEY_ID` | Optional: the same Key Id for server code (falls back to `NEXT_PUBLIC_RAZORPAY_KEY_ID`) |
| `RAZORPAY_KEY_SECRET` | Generated with the key ID. **Server only.** |
| `RAZORPAY_WEBHOOK_SECRET` | The secret you set when creating the webhook (see the deployment checklist) |

Do not add phone numbers, emails, shipping fees, copy or admin credentials to env files.

## Database migrations

Migrations live in `supabase/migrations` and run in filename order.

**Option A — Supabase CLI (recommended)**

```bash
npx supabase init            # first time only; keeps the existing migrations folder
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push         # applies new migrations to the linked project
```

To seed data on the remote project, run the contents of `supabase/seed.sql` in the
Supabase SQL editor (or use `npx supabase db reset` against a local stack, which runs migrations + seed).

Regenerate types after any schema change:

```bash
npx supabase gen types typescript --linked > types/db.ts
```

**Option B — SQL editor**

Open Supabase → SQL Editor, and run each file in `supabase/migrations` in order, then `supabase/seed.sql`.

### What the migrations create

| File | Contents |
| --- | --- |
| `…000000_admins.sql` | `admins` table, `is_admin()` helper used by every admin RLS policy |
| `…000100_catalog.sql` | `categories`, `subcategories`, `products`, `product_images`, `product_variants`, `product_subcategories`; `set_updated_at()` trigger; WhatsApp-mode enforcement |
| `…000200_content.sql` | `site_settings`, `pages`, `faqs`, `homepage_sections`, `homepage_assets` |
| `…000300_orders.sql` | `orders`, `order_items`, `razorpay_events`; `next_order_number()` → `PPR-000001`, `PPR-000002`, … |
| `…000400_storage.sql` | Public-read `media` bucket (folders `products/`, `homepage/`, `categories/`, `pages/`); admin-only writes; images only, 10 MB max |
| `20261019000500_branding.sql` | Adds the `branding/` upload folder, the `og_image_url` setting, and switches the footer image to the logo |

**Access rules (RLS):** the public can read active products (and their images, variants and
placements), categories, subcategories, settings, pages, active FAQs and active homepage
sections. The public cannot read or write `orders`, `order_items`, `admins` or
`razorpay_events`. Admins (`is_admin()`) have full access to every table. Storefront order
creation and payment updates run only in server code with the service-role key.

**PERSONALISED is always WhatsApp:** categories have a `default_mode`. Linking a product to a
subcategory of a `whatsapp` category (PERSONALISED) switches the product to WhatsApp mode, and
the database rejects switching it back to `buy` while it stays linked.

### Seed data

`supabase/seed.sql` adds the 6 categories and all subcategories, every `site_settings` key,
the policy/content pages, the FAQs (copy verbatim from the handover document) and
homepage sections with placeholder images, and **12 placeholder products**.

**Everything fake is marked "Replace me"** so nothing goes live by accident: product names start
with `[Replace me]`, and every placeholder image (products, homepage, categories, mega-menu) has
alt text starting `Replace me:`. The images are styled template illustrations (pastel stationery scenes) so the layout can be judged before real photos exist. Admin → Orders shows a
reminder with counts until all of them are replaced. Delete the sample products before launch
(Admin → Products, or):

```sql
delete from public.products where slug like 'placeholder-%';
```

The seed is safe to re-run: it never overwrites settings, pages, FAQs or products that already
exist. Re-running it also relabels anything left by older versions of the seed.

**Tokens in CMS text:** pages, FAQs, the announcement bar, cart message, footer links and the
info strip can reference any text/number setting as `{{setting_key}}` (e.g. `{{contact_email}}`,
`{{standard_shipping_fee_inr}}`, `{{ready_stock_dispatch_text}}`). Two computed tokens exist:
`{{whatsapp_number}}` (formatted, e.g. +91 98765 43210) and `{{whatsapp_url}}` (wa.me link).
They're replaced at render time (`lib/content.ts`), so updating a setting updates every page.

**Layout settings:** `logo_url`, `footer_illustration_url` (footer logo), `og_image_url` (link preview), `footer` (column headings + links,
"Follow Along" heading, bottom-row links), `mobile_menu_links`. The blush info strip above the
footer is the `info_strip` row in `homepage_sections` (three `homepage_assets`: `badge_text` =
small label, `heading` = serif headline, `subheading` = text that may contain
`[label](/link)` links; `config.icons` chooses each icon).

**Homepage:** `/` renders the active `homepage_sections` in `sort_order` (hero, collection
carousel, promo duo, product mosaic, promo trio, Instagram feed; the info strip renders in the
footer). Per-section asset conventions and `config` keys are documented at the top of the
homepage block in `supabase/seed.sql`. In short: `slot` = panel/tile, `sort_order` 0/1 = the
A/B images that alternate every `hero_rotation_ms` (default 1000 ms), and text fields live on
image A. Placeholder art is in `public/placeholders/homepage/`.

**Collections:** `/collections/[category]` (View All) and `/collections/[category]/[subcategory]`;
`/new-in` and `/new-in/*` are rewrites of the NEW IN collection. Subcategory `kind` decides the
contents (`lib/collections.ts`): manual/content_page = linked products, filter_new = `is_new`,
filter_best = `is_best_seller`, filter_under_1000 = products in that category priced under ₹1,000,
filter_personalised = WhatsApp-mode products in that category, view_all = union of the rest.
Filters, sort and "Load more" (24 per page) are URL parameters (`min`, `max`, `in_stock=1`,
`type=buy|whatsapp`, `sub=<slug>`, `sort`, `page`). Optional `description` on categories and
subcategories shows under the title and as the meta description. Customisable (WhatsApp)
products may leave the price empty ("Enquire for price"); buy-mode products must have one.

**Product page** (`/products/[slug]`): settings used — `delivery_badge_dispatch`,
`delivery_badge_delivery`, `low_stock_threshold` + `low_stock_message` (a product's own
`low_stock_message` overrides it; shown only when stock is tracked and at/below the threshold),
`product_price_note` (confirm GST wording before launch), `payment_note`,
`whatsapp_customise_template` (the whole "Customise on WhatsApp" message; `{product}` and `{url}`
are filled in by `lib/whatsapp.ts`), `personalised_info_text`, `returns_summary_text`.
"Buy now" links to `/checkout?buy=<productId>&variant=<variantId>&qty=<n>` (checkout re-prices
it server-side). Products have an optional `details_html` for "Details & Specifications".

**Caching:** public reads (settings, menu, homepage, products) are cached with `'use cache'`
and tagged (`lib/data/tags.ts`), refreshing at least hourly. Admin saves will invalidate these tags
so changes appear immediately (wired up with the admin panel).

**Social links** (`social_instagram`, `social_facebook`, `social_pinterest`) are seeded empty
because the handover doesn't list the URLs; empty links are hidden. Fill them in from the admin.

## Checkout & payments (Razorpay)

Guest checkout only (no accounts). Only `mode = "buy"` products can be bought; customisable
products are enquired on WhatsApp.

**Flow**
1. `/checkout` prices the cart via `POST /api/checkout/quote` (database prices, stock, `is_active`,
   mode; shipping from `standard_shipping_fee_inr` and optional `free_shipping_threshold_inr`).
   Stale carts are corrected automatically (prices updated, sold-out items removed).
2. `POST /api/checkout/create` re-prices everything server-side, saves a `pending` order with
   item snapshots, creates the Razorpay order (amount in paise, `receipt` = order number) and
   returns the details for Razorpay Checkout.
3. On success the browser calls `POST /api/checkout/verify` (HMAC SHA-256 signature check with
   `RAZORPAY_KEY_SECRET`); `mark_order_paid()` sets the order paid and decrements stock in one
   transaction. The buyer lands on `/order-confirmation/<number>?t=<private token>`.
4. `POST /api/razorpay/webhook` confirms the same order independently (`payment.captured`,
   `order.paid`), marks `payment.failed`, and records every event id in `razorpay_events` so
   retries are ignored. This covers buyers who close the tab after paying.
5. Cancelled or failed payments keep the order (pending/failed) and offer "Try payment again".

Only `payment_status = 'paid'` orders are confirmed orders; pending/failed ones are abandoned or
in-progress checkouts. Checkout, quote, verify and `/api/track-order` are rate-limited per IP
(`check_rate_limit()` in Postgres); checkout and tracking forms include a honeypot field.
`/track-order` shows payment/dispatch status, courier and tracking details (never the address)
for an order number + the mobile number or email used at checkout.

No marketing email/SMS is sent. To add a transactional order-confirmation email later, implement
`onOrderPaid()` in `lib/notifications.ts` (called exactly once per paid order).

**Test mode (development)**
- Razorpay Dashboard → switch to **Test Mode** → Account & Settings → API Keys → generate keys.
- `.env.local`: `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_…`, `RAZORPAY_KEY_SECRET=…`.
- Pay with Razorpay's test cards / test UPI (`success@razorpay`).
- Webhooks can't reach `localhost`; to test them locally, expose the dev server with a tunnel
  (e.g. `npx localtunnel --port 3000`) and add that URL as a test-mode webhook.
- Settings → Payment Capture: keep **automatic capture** on, so successful payments are captured.

**Going live:** follow step 4 of the [production deployment checklist](#production-deployment-checklist-vercel--supabase). Switch to live keys only after a full test payment.

## Content pages

All copy lives in Supabase (`pages`, `faqs`, `site_settings`); components contain no business copy.

| Route | Source |
| --- | --- |
| `/about` | title: `pages.about`; text: settings `about_intro_html`, `founder_story_html`, `mission_html` (each with its own heading) |
| `/contact` | `pages.contact` + enquiry form (saved to `enquiries`, listed at `/admin/enquiries`) |
| `/faq` | `pages.faq` (intro and "Need More Help?" split at the `<!-- FAQs render here -->` marker) + `faqs` grouped by `group_name` |
| `/shipping-policy`, `/cancellation-returns-refund-policy`, `/privacy-policy`, `/terms-and-conditions` | `pages.<slug>`; "Last updated" = `pages.effective_date` |
| `/corporate-gifting`, `/custom-orders` | `pages.<slug>` + CTA (`cta_label`, `cta_whatsapp_message`, `cta_email_subject`) + products tagged to the PERSONALISED subcategory with the same slug |

Old `/pages/<slug>` links redirect permanently. Timelines used across policies, FAQs and
settings are their own settings, referenced as tokens: `{{dispatch_days}}`, `{{delivery_days}}`,
`{{personalised_production_days}}`, `{{order_damage_report_window_text}}`,
`{{store_credit_validity}}`, `{{grievance_acknowledgement_time}}`; plus `{{shipping_fee}}`
(formatted fee, e.g. ₹100) and the contact tokens. Change one setting and every page that
mentions it updates. `/sitemap.xml` lists collections, products and content pages;
`robots.txt` points to it.

## Personalised products & enquiries

- **WhatsApp-mode products** (everything linked to PERSONALISED is forced into this mode by the
  database) show a "Customisable" badge and a "Customise" button, and only ever offer
  "Customise on WhatsApp". They can't be added to the cart, and `/api/checkout/create` rejects them.
- **Corporate Gifting / Custom Orders** (content subcategories) show "Enquire on WhatsApp" +
  "Email us". The pre-filled WhatsApp text and email subject are the page's
  `cta_whatsapp_message` / `cta_email_subject`.
- **Contact page** (`/contact`, optional `?type=corporate_gifting`): Customer Support messages are
  saved to `enquiries`; Personalised Orders open WhatsApp with the details pre-filled (not saved);
  Corporate Gifting can go to WhatsApp or be saved with the short form fields (in `details`).
  Submissions are rate-limited (5 per 10 minutes per IP) and honeypot-protected. The first line
  of enquiry WhatsApp messages is `whatsapp_enquiry_intro`; to email the owner on new enquiries,
  implement `onEnquiryReceived()` in `lib/notifications.ts`.

## Create the first admin user

There is no sign-up page. Admins are created manually:

1. **Turn off public sign-ups:** Supabase → Authentication → Sign In / Providers → disable
   "Allow new users to sign up". (Customers never need accounts.)
2. **Create the user:** Authentication → Users → Add user → Create new user. Enter the
   email and a strong password and tick "Auto Confirm User".
3. **Grant admin access** in the SQL editor:

   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'owner@example.com';
   ```

4. Visit `/admin/login` and sign in.

To remove access, delete the row from `public.admins` (and the auth user if no longer needed).

### How /admin is protected

`proxy.ts` runs on every `/admin/*` request. It validates the Supabase session with
`auth.getUser()` and then checks for a row in `public.admins` (RLS lets a user read only
their own row). Visitors who aren't signed in are sent to `/admin/login?next=…`; signed-in
users who aren't admins are sent to `/admin/login?error=not_authorised`. Admins visiting
`/admin/login` are sent straight to `/admin`. Database writes are additionally protected
by RLS policies that use `public.is_admin()`.

Every admin server action re-checks admin access (`requireAdmin()` in `lib/admin/auth.ts`)
because server actions are public endpoints. All admin reads and writes use the signed-in
user's Supabase session (RLS `is_admin()`); the service-role key is never used by the admin.
Images are resized in the browser (max 2000px wide, WebP) and uploaded to the `media`
Storage bucket with the same session.

**Forgot password:** the sign-in page sends Supabase's standard reset email. Add
`https://paperica.in/admin/auth/callback` (and `http://localhost:3000/admin/auth/callback`
for local use) under Supabase → Authentication → URL Configuration → Redirect URLs.
The link signs the owner in and opens **Set a new password**.

## Admin panel (`/admin`)

| Section | What the owner can do |
| --- | --- |
| Orders | Tabs for confirmed (paid) / pending / failed / refunded; search by order number, name or phone; filter by dispatch status; CSV export. Order page: customer & address (copy button), items, totals, Razorpay ids, dispatch status, courier & tracking (shown on Track Your Order), mark as refunded, **Open WhatsApp** with the `whatsapp_tracking_template` message, printable packing slip (no prices). |
| Products | Search, thumbnails, active toggle, bulk activate/deactivate/New/Best Seller. Add/edit: name, auto slug, descriptions (rich text), price & compare-at, SKU, stock, purchase mode, badge, flags, low-stock message, categories grouped by head, options (with their own price/stock), multi-image upload with drag-to-reorder and alt text, preview, duplicate, delete (products in past orders are deactivated instead). |
| Homepage | Sections in order: show/hide, move up/down, and a form per section (hero A/B images + text + swap speed; collection tiles; promo banners; product feature with up to 8 picked products; promo tiles with stickers; Instagram; info strip + footer blurb). |
| Categories & Menu | Rename, reorder, show/hide the six heads; description, collection image and the two mega-menu feature images; rename/reorder subcategories, add new ones (hand-picked products) and delete those added ones. Web addresses never change. |
| Pages & FAQs | Rich-text editing of About (intro, Our Story, Our Mission), the four policies (with "Last updated" date), Corporate Gifting and Custom Orders (with their enquiry button settings), plus a token reference. FAQs: add, edit, hide, delete, reorder within groups. |
| Site Settings | Branding & sharing (header logo, footer logo, link-preview image), announcement bar, contact (WhatsApp validated: digits with country code), shipping & delivery (fee, free-shipping threshold, timelines and texts), social links, grievance officer, hero speed, footer blurb, and the small messages/templates used around the shop. |
| Enquiries | Contact-form messages with a "handled" toggle, Reply on WhatsApp (when a number was given) and Reply by email. |

Every save shows a confirmation and refreshes the affected storefront pages immediately
(cache tags in `lib/data/tags.ts`, refreshed via `lib/revalidate.ts`).

## Production deployment checklist (Vercel + Supabase)

Work through the steps in order. Tick each box as you go.

### 0. Accounts: all owned by Paperica

Create every account with **Paperica's own business email** (not the developer's), with
two-factor authentication on. The developer is *invited* to each one, and can be removed at
handover without anything breaking.

| Account | What it's for | Create as | Developer access |
| --- | --- | --- | --- |
| Business email (e.g. Google Workspace or Gmail) | Login and recovery for everything below | Paperica | none |
| Domain registrar (`paperica.in`) | The domain and its DNS | Registrant: Paperica, owner's email. Turn on auto-renew and registrar lock | DNS access only if needed, or the owner makes the DNS changes |
| GitHub | The source code | Repo in the owner's account, or in an organisation the owner owns | Collaborator |
| Vercel | Hosting | Team owned by the owner. **Pro plan**: Vercel's free Hobby plan doesn't allow commercial sites | Team member |
| Supabase | Database, image storage, admin login | Organisation owned by the owner. Pro plan recommended (daily backups, no pausing) | Organisation member (Developer) |
| Razorpay | Payments and payouts | Merchant account and KYC in the business's name, owner's email, Paperica's bank account | Team member with a limited role, never the owner's login |
| Uptime monitor (optional, e.g. UptimeRobot or Better Stack) | Alerts if the site goes down | Owner's email | none |

**At handover:**
- Remove or downgrade the developer on each account.
- If the developer ever held the live keys, rotate them:
  - Supabase: Project Settings → API keys.
  - Razorpay: regenerate the API keys and the webhook secret.
  - Then update them in Vercel and redeploy.

### 1. Supabase

- [ ] **Create the project** in the owner's organisation:
  - Region: **Mumbai (`ap-south-1`)**, close to customers and to the Vercel functions (see `vercel.json`).
  - Save the database password in the owner's password manager.
- [ ] **Run the migrations** in filename order. Use either:
  - `npx supabase link --project-ref <ref>` then `npx supabase db push`, or
  - paste each file from `supabase/migrations/` into the SQL Editor, through `20261019000500_branding.sql`.
- [ ] **Run the seed:** paste `supabase/seed.sql` into the SQL Editor and run it. It's safe to re-run.
- [ ] **Check Storage.** The migrations create the public `media` bucket and its policies; nothing needs to be done by hand.
  - Storage → `media` should be **Public**.
  - `storage.objects` should have these 4 policies:
    - `public read media`
    - `admins upload media`
    - `admins update media`
    - `admins delete media`
  - Uploads are allowed only into `products/`, `homepage/`, `categories/`, `pages/` and `branding/`.
- [ ] **Turn off public sign-ups:** Authentication → Sign In / Providers → turn **off** "Allow new users to sign up".
  - Keep the Email provider enabled; the admin signs in with it.
- [ ] **Set the auth URLs:** Authentication → URL Configuration.
  - Site URL: `https://paperica.in`
  - Redirect URLs: `https://paperica.in/admin/auth/callback`
- [ ] **Create the one admin user:** Authentication → Users → Add user → Create new user.
  - Use the owner's email and a strong password, and tick **Auto Confirm User**.
- [ ] **Give that user admin access** in the SQL Editor:

  ```sql
  insert into public.admins (user_id, email)
  select id, email from auth.users where email = '<owner email>';
  ```

- [ ] **Copy the keys for Vercel** from Project Settings → API:
  - Project URL
  - anon (publishable) key
  - service_role (secret) key
- [ ] **Optional:** Supabase's built-in mailer only sends a few emails per hour. That's enough for
  password resets. For more, set up custom SMTP under Authentication → Emails → SMTP Settings.

### 2. Vercel

- [ ] Push the code to the owner's GitHub repo.
- [ ] Vercel → Add New → Project → import that repo into the owner's team. Leave the defaults as they are:
  - Framework preset: **Next.js** (detected automatically)
  - Build command: `next build`
  - Output: default
  - Node.js: 22.x
- [ ] Add **only these environment variables** under Settings → Environment Variables, for both **Production** and **Preview**:

  | Variable | Value | Notes |
  | --- | --- | --- |
  | `NEXT_PUBLIC_SITE_URL` | `https://paperica.in` | Used for absolute links: sitemap, link previews, password-reset emails |
  | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / publishable key | Safe in the browser; RLS protects the data |
  | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | **Secret. Server only** |
  | `RAZORPAY_KEY_ID` | Razorpay Key Id (`rzp_test_…` until go-live) | Optional; must equal `NEXT_PUBLIC_RAZORPAY_KEY_ID` |
  | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | The same Key Id | Public; Razorpay Checkout needs it in the browser |
  | `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | **Secret. Server only** |
  | `RAZORPAY_WEBHOOK_SECRET` | A long random string you choose | The same string goes into the Razorpay webhook (step 4) |

  Notes:
  - `NEXT_PUBLIC_*` values are built into the site. **Redeploy after changing any of them.**
  - Keep **test** Razorpay keys on Preview permanently, so test builds can never take real money.
  - Preview builds use the same Supabase project as production, so test orders appear in Admin → Orders as pending or failed. A separate Supabase project for previews avoids this.
  - Nothing business-related goes here (phone, email, fees, copy). That all lives in Supabase.
- [ ] **Deploy.** Then open `https://<project>.vercel.app/api/health`. It should return `{"status":"ok","database":"ok",…}`.

### 3. Domain

- [ ] In Vercel → Settings → Domains, add `paperica.in` and `www.paperica.in`. Set `www` to redirect to `paperica.in`.
- [ ] At the registrar, create the DNS records Vercel shows. Usually that's:
  - an **A** record for `@` → `76.76.21.21`
  - a **CNAME** for `www` → `cname.vercel-dns.com`
- [ ] Wait until Vercel shows both domains as **Valid Configuration**. The HTTPS certificate is issued automatically.
- [ ] Note: the site sends HSTS with `includeSubDomains`, so any future subdomain of `paperica.in` must also serve HTTPS.

### 4. Razorpay: test first, then live

Razorpay keeps separate keys and webhooks for Test Mode and Live Mode.

- [ ] **Test Mode:** generate API keys and put them in Vercel (step 2).
- [ ] **Test Mode webhook:** Account & Settings → Webhooks → Add New Webhook.
  - URL: `https://paperica.in/api/razorpay/webhook`
  - Secret: exactly the value of `RAZORPAY_WEBHOOK_SECRET`
  - Active events: `payment.captured`, `payment.failed`, `order.paid`
- [ ] Settings → Payment Capture: **automatic capture** on.
- [ ] **Full test payment on `https://paperica.in`**, using test card or UPI `success@razorpay`:
  - [ ] The order confirmation page shows the order number.
  - [ ] Admin → Orders → **Confirmed (paid)** lists it, and the product's stock went down.
  - [ ] The Razorpay dashboard → Webhooks shows deliveries with response **200**.
  - [ ] A failed payment (`failure@razorpay`) shows under **Failed**, and "Try payment again" works.
  - [ ] Track Your Order finds the order.
  - [ ] Dispatching it in the admin (courier and tracking) shows on Track Your Order.
- [ ] **Only after all of the above pass, go live:**
  1. Razorpay account activated (KYC done), with the policy pages live on the domain.
  2. Switch the dashboard to **Live Mode** and generate live keys.
  3. In Vercel, set **Production only**:
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = `rzp_live_…`
     - `RAZORPAY_KEY_ID` = the same value
     - `RAZORPAY_KEY_SECRET` = the live secret
  4. Create the **Live Mode** webhook: same URL and events, with a new secret. Put that secret in `RAZORPAY_WEBHOOK_SECRET` (Production).
  5. **Redeploy** production.
  6. Make one small real payment and check it appears as paid.
  7. Refund it in the Razorpay dashboard, then tick **Refunded** on the order.

### 5. Before announcing the launch

- [ ] Admin → Orders: the "replace the sample content" reminder is gone. Delete the sample products or replace them with real ones.
- [ ] Admin → Site Settings: check the contact email, WhatsApp number, shipping fee, social links and grievance officer.
- [ ] Admin → Pages & FAQs: set each policy's "Last updated" date.
- [ ] Share `https://paperica.in` in WhatsApp and check that the link preview shows the logo image.
- [ ] Google Search Console: verify the domain and submit `https://paperica.in/sitemap.xml`.
- [ ] Point an uptime monitor at `https://paperica.in/api/health`. Check every 5 minutes and alert the owner's email.

## Caching and how admin changes go live

Storefront pages are prerendered and cached. This uses Next.js 16 Cache Components: `'use cache'`
data functions in `lib/data/*` with `cacheLife` and `cacheTag`. That's the Next 16 replacement for
ISR's `export const revalidate`.

**Every admin save refreshes the affected pages immediately.** Server actions call `refreshTags()`
(`lib/revalidate.ts` → `updateTag`). This is the tag-based version of `revalidatePath`: one tag
refreshes every page that used that data, so changing the shipping fee updates all of these at
once: the announcement bar, cart, checkout, product pages, policies and FAQs.

| Admin save | Tags refreshed |
| --- | --- |
| Products (save, delete, duplicate, bulk edit) | `products`, `menu`, `homepage` |
| Categories & Menu | `menu`, `products`, `homepage` |
| Homepage sections | `homepage`, `settings` |
| Pages (policies, About) | `pages` (+ `settings` for About) |
| FAQs | `faqs` |
| Site Settings | `settings`, `pages`, `homepage`, `products` |
| Paid order (checkout verify / Razorpay webhook) | `products`, refreshed in the background, so stock and "Sold out" update |

- `revalidatePath` isn't used. A setting such as the WhatsApp number appears on dozens of URLs; tags cover them all precisely.
- When adding new cached data, give it a tag in `lib/data/tags.ts` and refresh that tag in the action that changes it.
- **No Vercel Cron is needed.** Nothing runs on a schedule.
- The time-based expiry is only a safety net, for rows edited directly in the Supabase dashboard rather than the admin. Those changes appear within a minute to an hour, depending on the data, or immediately after a redeploy.
- **Health check:** `GET /api/health` is never cached.
  - It returns **200** with `{"status":"ok","database":"ok",…}`.
  - It returns **503** if Supabase doesn't answer within 5 seconds or a required environment variable is missing. Only the variable *names* are listed.
  - Use an external uptime monitor for it. Vercel Cron on the Hobby plan runs at most once a day.

## Security

- **Response headers** (`next.config.ts`, all routes):
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security`
  - `Permissions-Policy` (camera, microphone, geolocation and topics off)
  - `X-Powered-By` is removed.
- **CSP:** allows the site itself, Razorpay Checkout and the Supabase project URL.
  - Razorpay: `checkout.razorpay.com` and `cdn.razorpay.com` scripts; `*.razorpay.com` iframe, API and images.
  - Supabase: Storage images, plus Auth, REST and Storage calls from the admin.
  - Inline scripts are allowed (`'unsafe-inline'`) because the pages are statically prerendered. Nonce-based CSP would force every page to render on each request.
  - Nothing else can load. **If you add a third-party script or embed** (analytics, YouTube, Instagram embeds), add its origin to `csp` in `next.config.ts`.
  - Preview deployments also allow `vercel.live` for Vercel's comment toolbar.
- **Kept out of search engines:**
  - `/admin` and `/api` send `X-Robots-Tag: noindex, nofollow`; admin pages also have `noindex` metadata.
  - `robots.txt` disallows `/admin`, `/api/`, `/checkout`, `/order-confirmation`, `/search` and `/styleguide`.
  - Preview deployments disallow everything.
  - `/styleguide` returns 404 on the production deployment.
- **Secrets stay on the server:**
  - `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` are read only in `server-only` modules: `lib/supabase/admin.ts` and `lib/razorpay.ts`.
  - Never give a secret a `NEXT_PUBLIC_` prefix.
- **No business data in env files or code.** Phone numbers, emails, fees, copy and images all live in Supabase (`site_settings`, pages, FAQs, products, homepage). `supabase/seed.sql` only loads the starting values. To re-check, run this; it should print nothing:

  ```bash
  grep -rnE "[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[a-z]{2,}|[6-9][0-9]{4} ?[0-9]{5}|₹ ?[0-9]+" app components lib proxy.ts next.config.ts .env.example | grep -v "example\|98765\|e\.g\.\|₹999\|₹799\|₹1,000"
  ```


## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```
