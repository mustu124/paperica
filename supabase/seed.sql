-- Seed data for Paperica.
-- Run automatically by `supabase db reset`, or paste into the Supabase SQL editor after the migrations.
--
-- Safe to re-run: categories and subcategories are upserted; settings, pages, FAQs and
-- placeholder products are only inserted when missing, so admin edits are never overwritten.
--
-- Copy is taken verbatim from the Paperica Website Copy & Developer Handover.
-- Contact details inside page/FAQ HTML use {{tokens}} that the site replaces with
-- site_settings values at render time, so changing a setting updates every page:
--   {{contact_email}}  {{whatsapp_number}} (formatted, e.g. +91 97692 23863)  {{whatsapp_url}}
--   {{standard_shipping_fee_inr}}  {{grievance_officer_name}}  {{grievance_officer_designation}}
--
-- Admin users are NOT seeded. See "Create the first admin user" in README.md.

begin;

-- ===========================================================================
-- Categories
-- ===========================================================================

insert into public.categories (name, slug, sort_order, show_in_menu, image_url, default_mode, menu_feature_images) values
  ('NEW IN', 'new-in', 1, true, '/placeholders/categories/new-in.svg', 'buy',
   '[{"url":"/placeholders/products/placeholder-spiral-notebook-a5-1.svg","alt":"Replace me: placeholder spiral notebook","label":"New Collection","link_url":"/collections/new-in"},
     {"url":"/placeholders/products/placeholder-dot-grid-journal-1.svg","alt":"Replace me: placeholder dot grid journal","label":"Best Sellers","link_url":"/collections/new-in/best-sellers"}]'),
  ('NOTEBOOKS & JOURNALS', 'notebooks-journals', 2, true, '/placeholders/categories/notebooks-journals.svg', 'buy',
   '[{"url":"/placeholders/products/placeholder-dot-grid-journal-1.svg","alt":"Replace me: placeholder journal","label":"Journals","link_url":"/collections/notebooks-journals/journals"},
     {"url":"/placeholders/products/placeholder-spiral-notebook-a5-1.svg","alt":"Replace me: placeholder spiral notebook","label":"Spiral-Bound Notebooks","link_url":"/collections/notebooks-journals/spiral-bound-notebooks"}]'),
  ('PLANNERS', 'planners', 3, true, '/placeholders/categories/planners.svg', 'buy',
   '[{"url":"/placeholders/products/placeholder-undated-planner-1.svg","alt":"Replace me: placeholder undated planner","label":"Undated Planners","link_url":"/collections/planners/undated-planners"},
     {"url":"/placeholders/products/placeholder-weekly-planner-1.svg","alt":"Replace me: placeholder weekly planner","label":"Weekly Planners","link_url":"/collections/planners/weekly-planners"}]'),
  ('PAPER EDIT', 'paper-edit', 4, true, '/placeholders/categories/paper-edit.svg', 'buy',
   '[{"url":"/placeholders/products/placeholder-notepad-trio-1.svg","alt":"Replace me: placeholder notepads","label":"Notepads","link_url":"/collections/paper-edit/notepads"},
     {"url":"/placeholders/products/placeholder-sticky-notes-1.svg","alt":"Replace me: placeholder sticky notes","label":"Sticky Notes","link_url":"/collections/paper-edit/sticky-notes"}]'),
  ('GIFTS', 'gifts', 5, true, '/placeholders/categories/gifts.svg', 'buy',
   '[{"url":"/placeholders/products/placeholder-softcover-notebook-set-1.svg","alt":"Replace me: placeholder gift set","label":"Gift Sets","link_url":"/collections/gifts/gift-sets"},
     {"url":"/placeholders/products/placeholder-custom-name-notebook-1.svg","alt":"Replace me: placeholder personalised notebook","label":"Personalised Gifts","link_url":"/collections/gifts/personalised-gifts"}]'),
  ('PERSONALISED', 'personalised', 6, true, '/placeholders/categories/personalised.svg', 'whatsapp',
   '[{"url":"/placeholders/products/placeholder-custom-name-notebook-1.svg","alt":"Replace me: placeholder custom notebook","label":"Custom Notebooks","link_url":"/collections/personalised/custom-notebooks"},
     {"url":"/placeholders/products/placeholder-custom-planner-1.svg","alt":"Replace me: placeholder custom planner","label":"Corporate Gifting","link_url":"/collections/personalised/corporate-gifting"}]')
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  default_mode = excluded.default_mode;

-- ===========================================================================
-- Subcategories (exact labels and order from the master category structure, as revised by the
-- Website Catalogue V3: Snap-in Separators also under NEW IN; no Bookmarks or Cards at launch)
-- ===========================================================================

insert into public.subcategories (category_id, name, slug, sort_order, kind)
select c.id, v.name, v.slug, v.sort_order, v.kind
from (values
  ('new-in', 'View All',        'view-all',        1, 'view_all'),
  ('new-in', 'New Collection',  'new-collection',  2, 'filter_new'),
  ('new-in', 'Best Sellers',    'best-sellers',    3, 'filter_best'),

  ('notebooks-journals', 'View All',               'view-all',               1, 'view_all'),
  ('notebooks-journals', 'Spiral-Bound Notebooks', 'spiral-bound-notebooks', 2, 'manual'),
  ('notebooks-journals', 'Journals',               'journals',               3, 'manual'),
  ('notebooks-journals', 'Softcover Notebooks',    'softcover-notebooks',    4, 'manual'),

  ('planners', 'View All',         'view-all',         1, 'view_all'),
  ('planners', 'Undated Planners', 'undated-planners', 2, 'manual'),
  ('planners', 'Weekly Planners',  'weekly-planners',  3, 'manual'),

  ('paper-edit', 'View All',           'view-all',           1, 'view_all'),
  ('paper-edit', 'Notepads',           'notepads',           2, 'manual'),
  ('paper-edit', 'Snap-in Separators', 'snap-in-separators', 3, 'manual'),
  ('paper-edit', 'Sticky Notes',       'sticky-notes',       4, 'manual'),

  ('gifts', 'View All',           'view-all',           1, 'view_all'),
  ('gifts', 'Gifts for Her',      'gifts-for-her',      2, 'manual'),
  ('gifts', 'Gifts for Him',      'gifts-for-him',      3, 'manual'),
  ('gifts', 'Gift Sets',          'gift-sets',          4, 'manual'),
  ('gifts', 'Gifts Under ₹1,000', 'gifts-under-1000',   5, 'filter_under_1000'),
  ('gifts', 'Personalised Gifts', 'personalised-gifts', 6, 'filter_personalised'),

  ('personalised', 'Custom Notebooks',  'custom-notebooks',  1, 'manual'),
  ('personalised', 'Custom Planners',   'custom-planners',   2, 'manual'),
  ('personalised', 'Corporate Gifting', 'corporate-gifting', 3, 'content_page'),
  ('personalised', 'Custom Orders',     'custom-orders',     4, 'content_page')
) as v(category_slug, name, slug, sort_order, kind)
join public.categories c on c.slug = v.category_slug
on conflict (category_id, slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  kind = excluded.kind;

-- ===========================================================================
-- Site settings
-- ===========================================================================

insert into public.site_settings (key, value) values
  ('brand_name',                      to_jsonb('Paperica'::text)),
  ('tagline',                         to_jsonb('All Things Paper'::text)),
  ('announcement_bar_text',           to_jsonb('Buy any 2 from the New Collection, get Snap-in Separators free | Free shipping on orders above ₹{{free_shipping_threshold_inr}} | Delivering across India · Standard shipping ₹{{standard_shipping_fee_inr}} per order'::text)),
  ('announcement_bar_enabled',        'true'::jsonb),
  ('contact_email',                   to_jsonb('paperica26@gmail.com'::text)),
  ('whatsapp_number',                 to_jsonb('919769223863'::text)),
  ('whatsapp_default_message',        to_jsonb('Hi Paperica! I have a question.'::text)),
  ('standard_shipping_fee_inr',       '80'::jsonb),
  ('ready_stock_dispatch_text',       to_jsonb('Orders for ready-to-ship products are generally dispatched within {{dispatch_days}} after successful payment.'::text)),
  ('ready_stock_delivery_text',       to_jsonb('Ready-to-ship orders are generally expected to arrive within {{delivery_days}} after dispatch.'::text)),
  ('personalised_production_text',    to_jsonb('Standard personalised orders generally require {{personalised_production_days}} for production before dispatch.'::text)),
  ('same_day_mumbai_text',            to_jsonb('Same-day delivery may be available in selected areas. Contact us on WhatsApp before ordering to confirm availability and charges.'::text)),
  ('order_damage_report_window_text', to_jsonb('48 hours'::text)),
  -- Timelines referenced as {{tokens}} by policies, FAQs and the texts above/below.
  ('dispatch_days',                   to_jsonb('4–6 business days'::text)),
  ('delivery_days',                   to_jsonb('4–6 business days'::text)),
  ('personalised_production_days',    to_jsonb('7–10 business days'::text)),
  ('store_credit_validity',           to_jsonb('6 months'::text)),
  ('grievance_acknowledgement_time',  to_jsonb('48 hours'::text)),
  ('social_instagram',                to_jsonb(''::text)),
  ('social_facebook',                 to_jsonb(''::text)),
  ('social_pinterest',                to_jsonb(''::text)),
  ('grievance_officer_name',          to_jsonb('Sonia Shetty'::text)),
  ('grievance_officer_designation',   to_jsonb('Grievance Redressal Officer'::text)),
  ('footer_about_blurb',              to_jsonb('Welcome to a world where creativity meets colour, and everyday stationery becomes something worth looking forward to.'::text)),
  ('about_intro_html',                to_jsonb($h$<p>Welcome to a world where creativity meets colour, and everyday stationery becomes something worth looking forward to. At Paperica, we believe that the things we use every day can be both practical and full of personality. From thoughtfully designed notebooks and planners to little paper essentials, each piece is created to bring a fresh perspective to your plans, ideas and everyday rituals.</p>$h$::text)),
  ('founder_story_html',              to_jsonb($h$<h2>Our Story</h2>
<p>Founded in 2021, Paperica began with a love for colourful stationery and the desire to build something of my own. Over time, that love grew into a deeper appreciation for journalling, different kinds of paper and thoughtful design. The journey has taught me what goes into creating products and building a business, and Paperica continues to evolve with everything I learn and discover.</p>$h$::text)),
  ('mission_html',                    to_jsonb($h$<h2>Our Mission</h2>
<p>Our mission is to bring more creativity and colour into everyday life through thoughtfully designed stationery. We want to make planning, journalling and putting pen to paper feel more personal and enjoyable, one page at a time.</p>$h$::text)),
  ('free_shipping_threshold_inr',     '1500'::jsonb),
  ('hero_rotation_ms',                '3000'::jsonb),

  -- Free gift offer: buying this many products marked New adds the free product at checkout
  ('gift_offer_enabled',              'true'::jsonb),
  ('gift_offer_text',                 to_jsonb('Buy any 2 from the New Collection and get a set of Snap-in Separators free'::text)),
  ('gift_offer_min_qty',              '2'::jsonb),
  ('gift_offer_product_slug',         to_jsonb('snap-in-separators'::text)),
  ('cart_message',                    to_jsonb('Standard shipping of ₹{{standard_shipping_fee_inr}} per order is added at checkout.'::text)),

  -- Product page
  ('delivery_badge_dispatch',         to_jsonb('Dispatched within {{dispatch_days}}'::text)),
  ('delivery_badge_delivery',         to_jsonb('Delivery {{delivery_days}} after dispatch'::text)),
  ('low_stock_threshold',             '5'::jsonb),
  ('low_stock_message',               to_jsonb('Selling Fast: Only a few left in stock!'::text)),
  -- Shown under the price. Confirm GST treatment before launch. [label](/link) links allowed.
  ('product_price_note',              to_jsonb('Tax included. [Shipping](/shipping-policy) calculated at checkout.'::text)),
  ('payment_note',                    to_jsonb('Pay securely with Razorpay: UPI, cards, netbanking'::text)),
  -- "Customise on WhatsApp" message. {product} = product name (+ chosen option), {url} = product link.
  ('whatsapp_customise_template',     to_jsonb(E'Hi Paperica! I''d like to customise: {product} ({url}).
Here are my details:
Name: 
Quantity: 
Personalisation text/design: 
Preferred delivery date: '::text)),
  -- First line of messages sent from the Contact page enquiry form ({type} = enquiry type).
  -- Admin → Orders → Open WhatsApp. {name} {order_number} {status} {courier} {tracking}
  ('whatsapp_tracking_template',      to_jsonb(E'Hi {name}! Your Paperica order {order_number} is {status}.
Courier: {courier}
Tracking: {tracking}
Thank you for shopping with us!'::text)),
  ('whatsapp_enquiry_intro',          to_jsonb('Hi Paperica! I have a {type} enquiry.'::text)),
  ('personalised_info_text',          to_jsonb('Personalised orders: we''ll confirm design, price and timeline with you on WhatsApp before you pay. {{personalised_production_text}}'::text)),
  ('returns_summary_text',            to_jsonb('We do not accept routine returns or exchanges for products delivered in good condition that match the order placed. If your order arrives damaged, defective or incorrect, contact us within {{order_damage_report_window_text}} of delivery with your order number and clear photographs of the product and packaging.'::text)),

  -- Checkout & order pages
  ('checkout_serviceability_note',    to_jsonb('We deliver across India subject to courier serviceability at your PIN code.'::text)),
  ('checkout_same_day_note',          to_jsonb('Need same-day delivery in Mumbai? [Chat with us on WhatsApp]({{whatsapp_url}}) first.'::text)),
  ('order_thank_you_text',            to_jsonb('Thank you for your order! We have received it and will start preparing it with care.'::text)),

  -- Layout
  ('logo_url',                        to_jsonb('/brand/paperica-logo-trim.png'::text)),       -- header logo
  ('footer_illustration_url',         to_jsonb('/brand/paperica-logo-trim.png'::text)), -- footer logo
  ('og_image_url',                    to_jsonb('/brand/paperica-og.jpg'::text)),        -- link-preview image, 1200×630
  ('mobile_menu_links', $j$[
    {"label": "Contact", "href": "/contact"},
    {"label": "Track Your Order", "href": "/track-order"}
  ]$j$::jsonb),
  -- Footer columns. Link hrefs and labels may use {{tokens}} (e.g. mailto:{{contact_email}}).
  ('footer', $j${
    "about_heading": "About Paperica",
    "about_link_label": "Discover Our Story →",
    "about_link_href": "/about",
    "columns": [
      {"heading": "Help & Support", "links": [
        {"label": "Help Centre / FAQs", "href": "/faq"},
        {"label": "Track Your Order", "href": "/track-order"},
        {"label": "Shipping Policy", "href": "/shipping-policy"},
        {"label": "Cancellation, Returns & Refund Policy", "href": "/cancellation-returns-refund-policy"}
      ]},
      {"heading": "Contact Us", "links": [
        {"label": "Customer Support", "href": "mailto:{{contact_email}}"},
        {"label": "WhatsApp Us", "href": "{{whatsapp_url}}"},
        {"label": "Custom Orders & Corporate Gifting", "href": "/corporate-gifting"}
      ]},
      {"heading": "Information", "links": [
        {"label": "Privacy Policy", "href": "/privacy-policy"},
        {"label": "Terms & Conditions", "href": "/terms-and-conditions"}
      ]}
    ],
    "follow_heading": "Follow Along",
    "bottom_links": [
      {"label": "Privacy Policy", "href": "/privacy-policy"},
      {"label": "Terms & Conditions", "href": "/terms-and-conditions"}
    ]
  }$j$::jsonb)
on conflict (key) do nothing;

-- ===========================================================================
-- Pages
-- The About page copy lives in site_settings (about_intro_html, founder_story_html,
-- mission_html) so Our Story and Our Mission can sit side by side; this row holds its title.
-- ===========================================================================

insert into public.pages (slug, title, body_html) values

('about', 'A Little About Paperica', ''),

-- ---------------------------------------------------------------------------
('shipping-policy', 'Shipping Policy', $h$
<p>At Paperica, every order is carefully packed and prepared for its journey to you. We aim to make receiving your favourite stationery as smooth and convenient as possible.</p>

<h2>1. Order Processing and Dispatch</h2>
<p>Orders for ready-to-ship products are generally dispatched within <strong>{{dispatch_days}} after successful payment</strong>.</p>
<p>Personalised and customised orders require additional production time. Standard personalised orders generally require <strong>{{personalised_production_days}} for production before dispatch</strong>. Complex designs, bulk quantities and special requirements may require additional time. Any revised timeline will be communicated and agreed upon before the order is confirmed.</p>

<h2>2. Delivery Timelines</h2>
<p>Ready-to-ship orders are generally expected to arrive within <strong>{{delivery_days}} after dispatch</strong>.</p>
<p>For personalised and customised orders, production time must be added to delivery time. The estimated delivery timeline depends on customisation, quantity and delivery location and will be communicated before confirmation.</p>
<p>All timelines are estimates and may vary due to courier delays, weather, service disruptions or other circumstances beyond our control.</p>

<h2>3. Shipping Charges</h2>
<p>A standard shipping fee of <strong>₹{{standard_shipping_fee_inr}} per order</strong> applies to regular deliveries within India, subject to courier serviceability.</p>
<p>Same-day deliveries and other special delivery arrangements are charged separately. Any additional charges will be communicated and agreed upon before confirmation.</p>

<h2>4. Delivery Across India</h2>
<p>Paperica delivers across India, subject to courier serviceability at the customer's PIN code. Please ensure your shipping address, PIN code and contact number are accurate. Address changes may not be possible after dispatch.</p>

<h2>5. Same-Day Delivery in Mumbai</h2>
<p>Same-day delivery may be available in selected areas of Mumbai, depending on product availability, PIN code, order timing and local courier availability. Contact us on WhatsApp before placing an order. Deliveries may be arranged through Borzo or another available local courier. Charges depend on destination and courier and will be communicated separately. The order is confirmed only after availability, arrangements and payment have been agreed. Same-day delivery is not guaranteed until explicitly confirmed by Paperica.</p>

<h2>6. Personalised and Customised Orders</h2>
<p>Production begins after the required details and final design have been approved and payment has been received. Customers must carefully check names, spellings, text, artwork and other personalisation details. Changes after approval may not be possible and may involve additional costs or time.</p>
<p>Standard personalised orders generally require {{personalised_production_days}} for production before dispatch. Complex designs, bulk orders and special requirements may take longer. Estimated production and delivery timelines will be communicated before confirmation. Refer to our <a href="/cancellation-returns-refund-policy">Cancellation, Returns &amp; Refund Policy</a> for cancellations and damage-related requests.</p>

<h2>7. Order Tracking</h2>
<p>Once dispatched, tracking details will be shared through WhatsApp or another contact method provided at checkout, wherever tracking is available. Contact us with your order number if you have a tracking question.</p>

<h2>8. Delivery Issues</h2>
<p>If a shipment is delayed, appears undelivered or encounters a delivery issue, contact us so we can check available tracking information and assist. Final delivery times may depend on the courier service.</p>

<h2>9. Damaged Deliveries</h2>
<p>If your order arrives damaged, defective or incorrect, contact us within <strong>{{order_damage_report_window_text}} of delivery</strong> with your order number and clear photographs of the product and packaging. We will review the issue and arrange an appropriate resolution in accordance with our <a href="/cancellation-returns-refund-policy">Cancellation, Returns &amp; Refund Policy</a> and applicable law.</p>

<h2>10. Contact Us</h2>
<p><strong>Email:</strong> <a href="mailto:{{contact_email}}">{{contact_email}}</a><br>
<strong>WhatsApp:</strong> <a href="{{whatsapp_url}}">{{whatsapp_number}}</a><br>
Please include your order number in order-related communications.</p>
$h$),

-- ---------------------------------------------------------------------------
('cancellation-returns-refund-policy', 'Cancellation, Returns & Refund Policy', $h$
<p>At Paperica, we take care to ensure that every order is prepared and packed with attention to detail. Please read this policy before placing an order.</p>

<h2>1. Order Cancellations</h2>
<p>Orders can be cancelled only before they have been processed or dispatched. Contact <a href="mailto:{{contact_email}}">{{contact_email}}</a> or WhatsApp <a href="{{whatsapp_url}}">{{whatsapp_number}}</a> as soon as possible. Once dispatched, an order cannot be cancelled through our standard cancellation process. For personalised orders, cancellation may not be possible once production has begun or materials have been procured specifically for the order. Approved cancellations will be handled in accordance with applicable consumer protection laws.</p>

<h2>2. Returns and Exchanges</h2>
<p>We do not accept routine returns or exchanges for products delivered in good condition that match the order placed. This includes changes of mind, personal preference or an incorrect selection made by the customer. If a product arrives damaged, defective or incorrect due to an error on our part, contact us for review and resolution.</p>

<h2>3. Damaged, Defective or Incorrect Products</h2>
<p>Contact us within <strong>{{order_damage_report_window_text}} of delivery</strong>. Please provide your order number, clear photographs of the product and packaging, and an unboxing video if available. Once reviewed and verified, Paperica will offer a replacement wherever feasible. If a replacement is unavailable or unsuitable, we may offer store credit or another appropriate resolution, subject to applicable consumer protection laws. Where the damage, defect or error is attributable to Paperica, we will cover reasonable shipping costs associated with the agreed resolution. Retain the product and packaging until the request is resolved.</p>

<h2>4. Personalised and Customised Products</h2>
<p>Personalised products cannot be returned or exchanged simply because of a change of mind or because the customer approved incorrect names, spellings, text or design details. If a personalised product arrives damaged, defective or contains an error made by Paperica, contact us within {{order_damage_report_window_text}}. Customers must carefully review all personalisation details before production.</p>

<h2>5. Store Credit</h2>
<p>Where store credit is offered and accepted as a resolution, it can be used towards a future Paperica purchase, subject to the terms communicated when issued. Unless otherwise stated, store credit is valid for <strong>{{store_credit_validity}} from the date of issue</strong> and cannot be exchanged for cash. Store credit does not limit any refund or other remedy required by applicable law.</p>

<h2>6. Refunds</h2>
<p>Paperica does not offer monetary refunds for routine returns or changes of mind. For eligible issues, our preferred resolution is a replacement or store credit. Where a refund is required under applicable law, it will be processed accordingly.</p>

<h2>7. Contact Us</h2>
<p><strong>Email:</strong> <a href="mailto:{{contact_email}}">{{contact_email}}</a><br>
<strong>WhatsApp:</strong> <a href="{{whatsapp_url}}">{{whatsapp_number}}</a><br>
Please include your order number. Nothing in this policy excludes or limits rights available under applicable consumer protection laws in India.</p>
$h$),

-- ---------------------------------------------------------------------------
('privacy-policy', 'Privacy Policy', $h$
<p>At Paperica, we value your privacy and are committed to handling your personal information responsibly. This Privacy Policy explains what information we collect when you visit our website, place an order or contact us, and how that information is used and protected.</p>

<h2>1. Information We Collect</h2>
<p>Depending on how you interact with Paperica, we may collect:</p>
<ul>
  <li>Contact information: name, email and mobile number.</li>
  <li>Order information: products purchased, order history, order number and transaction status.</li>
  <li>Delivery information: shipping address, city, state and PIN code.</li>
  <li>Personalisation details: names, text, artwork, images or other information provided for customised stationery.</li>
  <li>Payment information: payment status and transaction references needed to manage your order. Payments are processed through our payment gateway; we do not intend to collect or store complete card details or payment passwords.</li>
  <li>Enquiry information: messages and details shared through email, WhatsApp or our website.</li>
</ul>

<h2>2. How We Use Your Information</h2>
<p>We use your information to process and fulfil orders; prepare personalised products; arrange shipping, delivery and tracking; process and verify payments; respond to enquiries; send order confirmations and dispatch updates; improve products, website and customer experience; and meet legal, accounting and regulatory requirements. We do not use customer information for promotional marketing messages. Information is used for the purposes explained in this policy and as otherwise permitted or required by law.</p>

<h2>3. Payment Security</h2>
<p>Online payments are processed through Razorpay, our third-party payment gateway, subject to the options available at checkout. Payment information is handled in accordance with the provider's processes and policies. Paperica does not intend to store complete payment card details, PINs or payment passwords. Do not share sensitive payment credentials through email or WhatsApp; complete online payments through the payment options provided at checkout.</p>

<h2>4. Sharing Your Information</h2>
<p>We do not sell personal information. We may share relevant information with payment providers, courier and delivery partners, website hosting and technology providers, communication services, professional advisers or authorities where necessary to operate our business, fulfil orders, comply with law or protect legitimate rights. Information should be limited to what is reasonably necessary for the relevant service, subject to applicable requirements.</p>

<h2>5. Cookies and Website Technologies</h2>
<p>Our website may use cookies or similar technologies to support essential website functions, maintain security, remember preferences and analyse website performance. The technologies used depend on the tools implemented on our website. Analytics, advertising or other non-essential tracking technologies will be handled in accordance with applicable consent and privacy requirements. Browser settings may also allow cookie management.</p>

<h2>6. Data Security</h2>
<p>We take reasonable steps to protect personal information against unauthorised access, misuse, loss or disclosure. No website or electronic transmission can be guaranteed completely secure. Use secure devices and avoid sharing sensitive payment credentials through email or messaging platforms.</p>

<h2>7. Data Retention</h2>
<p>We retain personal information only for as long as reasonably necessary to fulfil the purposes described in this policy, provide support, maintain business and accounting records, resolve disputes and meet legal obligations. When information is no longer required, we take appropriate steps to delete or dispose of it, subject to applicable law and legitimate retention requirements.</p>

<h2>8. Your Privacy Rights</h2>
<p>Subject to applicable law, you may request access to, correction of or deletion of your personal information, or raise concerns about its handling. Some information may need to be retained for legal, accounting, security or order-related purposes. Contact our designated privacy and grievance contact in Section 12. We may need to verify your identity before acting on your request.</p>

<h2>9. Third-Party Links</h2>
<p>Our website may contain links to third-party websites or services, including payment providers and social media platforms, which have their own privacy policies. Paperica is not responsible for third-party privacy practices. Review their policies before sharing personal information.</p>

<h2>10. Children’s Privacy</h2>
<p>Paperica’s website is intended for people who can legally place orders and enter into relevant transactions. We do not knowingly seek to collect children’s personal information in violation of applicable law. If you believe a child has provided personal information inappropriately, contact us.</p>

<h2>11. Changes to This Policy</h2>
<p>We may update this policy when our website, business practices or legal obligations change. The latest version will be published on our website with the revised update date.</p>

<h2>12. Contact Us and Grievance Redressal</h2>
<p><strong>Grievance Officer:</strong> {{grievance_officer_name}}<br>
<strong>Designation:</strong> {{grievance_officer_designation}}<br>
<strong>Email:</strong> <a href="mailto:{{contact_email}}">{{contact_email}}</a><br>
<strong>WhatsApp:</strong> <a href="{{whatsapp_url}}">{{whatsapp_number}}</a><br>
<strong>Website:</strong> paperica.in</p>
<p>Please include a description of your concern and sufficient information for us to understand your request. We aim to acknowledge consumer grievances within {{grievance_acknowledgement_time}} of receipt and respond to other enquiries within 2–3 working days, where practicable. Consumer grievances will be addressed within the applicable statutory timeframe, including the prescribed one-month period where the Consumer Protection (E-Commerce) Rules, 2020 apply. Personal data requests will be handled in accordance with data-protection requirements applicable at the time.</p>
$h$),

-- ---------------------------------------------------------------------------
('terms-and-conditions', 'Terms & Conditions', $h$
<p>Welcome to Paperica. These Terms &amp; Conditions govern your use of the Paperica website and the purchase of products through it. By accessing our website or placing an order, you agree to these terms, subject to applicable law. Please read them carefully before making a purchase.</p>

<h2>1. About Paperica</h2>
<p>Paperica is a stationery brand offering notebooks, journals, planners, paper accessories, personalised stationery and corporate gifting solutions. “Paperica”, “we”, “our” and “us” refer to the Paperica business. “You” and “your” refer to visitors and customers using our website.</p>

<h2>2. Use of Our Website</h2>
<p>Use our website lawfully and provide accurate information when placing an order or contacting us. Do not misuse the website, attempt unauthorised access, interfere with its operation or use it for fraudulent or unlawful purposes. We may update website content, features and services from time to time.</p>

<h2>3. Products and Product Descriptions</h2>
<p>We make reasonable efforts to display products, colours, materials, sizes and descriptions accurately. Colours may appear slightly different depending on your screen, device settings, lighting, and photography. Minor variations in appearance or materials may occur. Product images are intended to represent products as accurately as reasonably possible. Important specifications or limitations will be communicated in product descriptions.</p>

<h2>4. Prices and Availability</h2>
<p>All prices are in Indian Rupees (INR), unless stated otherwise. Prices, availability and offers may change without prior notice. Changes will not alter accepted orders except where permitted or required by law. Shipping and additional special-delivery charges will be displayed or communicated before confirmation. If a genuine pricing or listing error is identified, we will contact the customer to resolve it appropriately before proceeding, subject to law.</p>

<h2>5. Orders and Payments</h2>
<p>Orders are subject to product availability, successful payment and confirmation by Paperica. Review cart, delivery address, contact information and order details before checkout. Payments are processed through Razorpay or another method expressly made available at checkout. If payment is deducted but an order is not confirmed, contact us with transaction details. Paperica may review or decline an order for reasonable concerns involving fraud, payment irregularities or product availability, subject to law. If payment has been received for an order that cannot be fulfilled, an appropriate resolution will be provided in accordance with law.</p>

<h2>6. Personalised and Customised Orders</h2>
<p>Personalised products are prepared according to requirements agreed with the customer. Before production, customers must review and approve names, spelling, text, artwork, colours and other design specifications. Production begins once the final design is approved and payment has been received. Standard personalised orders generally require {{personalised_production_days}} for production before dispatch. Complex designs, bulk quantities and special requirements may require additional time. The estimated timeline will be communicated before confirmation. Changes after approval may not be possible and may involve additional charges or delays.</p>

<h2>7. Shipping and Delivery</h2>
<p>Shipping charges, dispatch timelines, delivery estimates and arrangements are described in our <a href="/shipping-policy">Shipping Policy</a>. Delivery timelines are estimates and may be affected by courier operations, weather, service disruptions and circumstances beyond our control. Customers must provide accurate delivery details. Address changes may not be possible after dispatch. Same-day deliveries in eligible areas of Mumbai require advance confirmation of availability, charges and arrangements.</p>

<h2>8. Cancellations, Returns and Refunds</h2>
<p>Order cancellations, damaged or defective products, incorrect orders, returns, replacements and store credit are governed by our <a href="/cancellation-returns-refund-policy"><strong>Cancellation, Returns &amp; Refund Policy</strong></a>. We do not offer routine returns for products delivered in good condition that match the order placed. Replacement or store credit may be offered for eligible issues, subject to our policy. Nothing in these terms excludes or limits consumer rights or remedies that apply under Indian law.</p>

<h2>9. Intellectual Property</h2>
<p>Unless otherwise stated, website content—including product designs, illustrations, photographs, text, graphics, logos and branding—is owned by Paperica or used with permission. Do not copy, reproduce, distribute, modify or commercially use content or designs without prior written permission, except where permitted by law.</p>

<h2>10. Customer-Submitted Content</h2>
<p>If you submit text, artwork, photographs or other material for a personalised product, you confirm that you have the necessary rights or permissions and authorise us to reproduce it to fulfil your order. Do not submit material that infringes another person’s rights or is unlawful. We may decline requests that reasonably appear to violate law or third-party rights.</p>

<h2>11. Privacy</h2>
<p>Personal information collected through our website is handled in accordance with our <a href="/privacy-policy">Privacy Policy</a>. Review that policy to understand how information may be collected, used, stored and shared.</p>

<h2>12. Third-Party Services and Links</h2>
<p>Our website may use third-party services for payments, shipping, communications or other functions and may contain external links. Those services may have their own terms and policies. Paperica is not responsible for independent third-party practices, subject to applicable law.</p>

<h2>13. Limitation of Liability</h2>
<p>To the extent permitted by law, Paperica will not be responsible for indirect or consequential losses arising from website use or delays caused by third-party services beyond our reasonable control. Nothing excludes liability that cannot legally be excluded, including applicable consumer rights and remedies.</p>

<h2>14. Changes to These Terms</h2>
<p>We may revise these terms when our website, business practices or legal obligations change. The latest version will be published with the updated date. Terms applicable to an order will be interpreted in accordance with applicable law.</p>

<h2>15. Governing Law and Disputes</h2>
<p>These Terms &amp; Conditions are governed by the laws of India. Subject to applicable law, the courts in Mumbai, Maharashtra, India, shall have jurisdiction over disputes arising from these terms. Nothing restricts a consumer’s right to approach any consumer commission, court or other forum with jurisdiction under applicable law.</p>

<h2>16. Contact Us</h2>
<p><strong>Email:</strong> <a href="mailto:{{contact_email}}">{{contact_email}}</a><br>
<strong>WhatsApp:</strong> <a href="{{whatsapp_url}}">{{whatsapp_number}}</a><br>
<strong>Website:</strong> paperica.in</p>
<p><strong>Grievance Officer:</strong> {{grievance_officer_name}}<br>
<strong>Designation:</strong> {{grievance_officer_designation}}</p>
<p>We aim to acknowledge consumer grievances within {{grievance_acknowledgement_time}} and redress them within the applicable statutory timeframe.</p>
$h$),

-- ---------------------------------------------------------------------------
('corporate-gifting', 'Corporate Gifting', $h$
<h2>Thoughtful gifts. Made for your brand.</h2>
<p>Make a lasting impression with corporate gifts customised around your brand. From branded stationery and everyday essentials to curated gift hampers, Paperica helps bring corporate gifting ideas to life for employee welcome kits, client appreciation, milestones, events and special occasions.</p>

<h2>Possible product categories</h2>
<h3>Branded stationery</h3>
<ul>
  <li>Notebooks and journals</li>
  <li>Pens</li>
  <li>Letterheads and envelopes</li>
  <li>Planners and notepads</li>
</ul>
<h3>Lifestyle and everyday essentials</h3>
<ul>
  <li>Candles with customised branding</li>
  <li>Metal and insulated drinkware, including metal bottles</li>
  <li>Other selected merchandise, subject to availability and feasibility</li>
</ul>
<h3>Curated corporate gift sets</h3>
<ul>
  <li>Employee welcome kits</li>
  <li>Client appreciation gifts</li>
  <li>Event and conference giveaways</li>
  <li>Festive and occasion-based hampers</li>
  <li>Bespoke gift boxes combining multiple products</li>
</ul>

<h2>Customised around your brand</h2>
<p>Depending on the selected products, customisation may include company logos, brand colours, personalised messaging and custom packaging. Product selection, branding, quantity and packaging are discussed individually.</p>

<h2>Tell us what you need</h2>
<p>Share a few details below and send them to us on WhatsApp. We’ll discuss feasibility, timelines and a quotation with you directly.</p>
$h$),

-- ---------------------------------------------------------------------------
('custom-orders', 'Custom Orders', $h$
<h2>Create Something That’s Yours</h2>
<p>Your ideas, your style, your Paperica. Create stationery that feels uniquely yours by choosing a binding, cover direction and inside-page layout to suit the way you plan, write and create.</p>

<h2>Base price includes</h2>
<ul>
  <li>Basic cover illustration.</li>
  <li>Selected binding: Golden Wiro for Wiro formats or Perfect Binding for Perfect Binding formats, with the chosen hardbound or softbound style.</li>
  <li>100 pages of 100 GSM paper.</li>
  <li>Choice of ruled, plain, dotted or grid pages.</li>
</ul>

<h2>Additional charges apply</h2>
<ul>
  <li>Gold foiling on the cover.</li>
  <li>More elaborate or complex cover illustrations beyond the basic illustration included.</li>
  <li>Colourful separators inside the notebook.</li>
  <li>Custom planner layouts or other specialised inside-page designs.</li>
</ul>

<h2>Get your quote</h2>
<p>Choose your format, cover preference, inside pages and any extras below, then send your brief to us on WhatsApp. We’ll confirm feasibility and your final price.</p>
$h$),

-- ---------------------------------------------------------------------------
('contact', 'Contact Us', $h$
<h2>We’re Here to Help</h2>
<p>Have a question about an order, need help choosing a notebook, or have an idea you’d like to bring to life? We’d love to hear from you.</p>
<p>Whether it’s a question about our products, a personalised stationery request or a corporate gifting enquiry, get in touch and we’ll be happy to assist.</p>

<h2>Customer Support</h2>
<p>For questions about existing orders, payments, shipping, delivery or products, reach out using the details below.<br>
<strong>Email:</strong> <a href="mailto:{{contact_email}}">{{contact_email}}</a><br>
<strong>WhatsApp:</strong> <a href="{{whatsapp_url}}">{{whatsapp_number}}</a></p>
<p>Please include your order number for existing orders.</p>

<h2>Personalised Orders</h2>
<p>Looking for a notebook or planner customised just for you? Contact us with your requirements, preferred design and personalisation details. We’ll discuss possibilities, pricing and the estimated timeline before confirming your order.<br>
<strong>For personalised order enquiries, contact us on WhatsApp.</strong></p>

<h2>Corporate Gifting</h2>
<p>Planning gifts for your team, clients or a special occasion? We offer customised stationery and corporate gifting options tailored to your requirements. Share your estimated quantity, budget, branding requirements and delivery timeline.<br>
<strong>For corporate gifting enquiries, contact us on WhatsApp or email us.</strong></p>

<h2>Get in Touch</h2>
<p><strong>Email:</strong> <a href="mailto:{{contact_email}}">{{contact_email}}</a><br>
<strong>WhatsApp:</strong> <a href="{{whatsapp_url}}">{{whatsapp_number}}</a></p>
<p>We look forward to hearing from you!</p>
$h$),

-- ---------------------------------------------------------------------------
('faq', 'Help Centre / FAQs', $h$
<p>Have a question about your Paperica order? Find answers to our most frequently asked questions below. If you need further assistance, you can always get in touch with us.</p>
<!-- FAQs render here from the faqs table -->
<h2>Need More Help?</h2>
<p>Email: <a href="mailto:{{contact_email}}">{{contact_email}}</a><br>
WhatsApp: <a href="{{whatsapp_url}}">{{whatsapp_number}}</a></p>
<p>Please include your order number for an existing order.</p>
$h$)

on conflict (slug) do nothing;

update public.pages set effective_date = '2026-10-15'
where slug in ('privacy-policy', 'terms-and-conditions') and effective_date is null;

-- WhatsApp quote forms on the custom order and corporate gifting pages (Catalogue V3 §6–7).
-- cta_whatsapp_message is the first line of the message; the form adds the customer's answers.
update public.pages set cta_label = 'Discuss Your Corporate Gifting Requirements' where slug = 'corporate-gifting' and cta_label is null;
update public.pages set cta_label = 'Get My Quote on WhatsApp' where slug = 'custom-orders' and cta_label is null;

update public.pages set
  cta_whatsapp_message = 'Hi Paperica! I’d like to discuss corporate gifting for our company.',
  cta_email_subject = 'Corporate gifting enquiry'
where slug = 'corporate-gifting' and cta_whatsapp_message is null;

update public.pages set
  cta_whatsapp_message = 'Hi Paperica! I’d like a quote for a custom order.',
  cta_email_subject = 'Custom order enquiry'
where slug = 'custom-orders' and cta_whatsapp_message is null;

-- Form choices and indicative prices (Admin → Pages & FAQs → the page → Form options).
update public.pages set form_config = '{"form": "custom_order", "formats": [{"label": "Softbound Wiro", "price": 899}, {"label": "Hardbound Wiro", "price": 1299}, {"label": "Softbound Perfect Binding", "price": 899}, {"label": "Hardbound Perfect Binding", "price": 2299}, {"label": "Custom Photo Book", "price": 2500, "photo_book": true}], "page_types": [{"label": "Ruled"}, {"label": "Plain"}, {"label": "Dotted"}, {"label": "Grid"}, {"label": "Planner layout", "extra": true}], "extras": [{"label": "Gold foiling on the cover", "extra": true}, {"label": "Colourful separators inside the notebook", "extra": true}], "extra_label": "Additional charges apply — final quote via WhatsApp", "note": "Sending this form isn’t an order confirmation. We’ll confirm feasibility and your final price on WhatsApp before anything is made."}'::jsonb
where slug = 'custom-orders' and form_config = '{}'::jsonb;

update public.pages set form_config = '{"form": "corporate", "gifting_types": [{"label": "Employee gifts"}, {"label": "Client gifts"}, {"label": "Events"}, {"label": "Festive gifting"}, {"label": "Welcome kits"}, {"label": "Other"}], "products": [{"label": "Notebooks"}, {"label": "Pens"}, {"label": "Candles"}, {"label": "Drinkware"}, {"label": "Letterheads / envelopes"}, {"label": "Gift hampers"}, {"label": "Other"}], "note": "The button opens WhatsApp with your enquiry filled in — just tap Send. We’ll discuss feasibility, timelines and a quotation with you directly."}'::jsonb
where slug = 'corporate-gifting' and form_config = '{}'::jsonb;

-- ===========================================================================
-- FAQs (grouped exactly as in the handover)
-- ===========================================================================

insert into public.faqs (group_name, question, answer_html, sort_order)
select v.group_name, v.question, v.answer_html, v.sort_order
from (values
  -- Orders & Payments
  ('Orders & Payments', 'How do I place an order?',
   '<p>Browse our collections, add products to your cart and proceed to checkout. Enter delivery details and complete payment to place your order.</p>', 101),
  ('Orders & Payments', 'What payment methods do you accept?',
   '<p>Payments are processed through Razorpay. Available payment methods are displayed at checkout.</p>', 102),
  ('Orders & Payments', 'What if payment is deducted but my order is not confirmed?',
   '<p>Contact us with your transaction details so we can check the payment status.</p>', 103),
  ('Orders & Payments', 'Can I cancel my order?',
   '<p>Orders may be cancelled only before processing or dispatch, subject to our <a href="/cancellation-returns-refund-policy">Cancellation, Returns &amp; Refund Policy</a>. Personalised orders may not be cancellable once production has begun.</p>', 104),

  -- Shipping & Delivery
  ('Shipping & Delivery', 'Do you deliver across India?',
   '<p>Yes, subject to courier serviceability at your PIN code.</p>', 201),
  ('Shipping & Delivery', 'How long will my order take to dispatch?',
   '<p>Ready-to-ship products are generally dispatched within {{dispatch_days}} after successful payment.</p>', 202),
  ('Shipping & Delivery', 'How long will delivery take?',
   '<p>Ready-to-ship orders are generally expected to arrive within {{delivery_days}} after dispatch. Timelines are estimates and may vary.</p>', 203),
  ('Shipping & Delivery', 'How much does shipping cost?',
   '<p>Standard shipping costs ₹{{standard_shipping_fee_inr}} per order. Additional charges may apply for same-day delivery or special arrangements.</p>', 204),
  ('Shipping & Delivery', 'Do you offer same-day delivery in Mumbai?',
   '<p>Same-day delivery may be available in selected areas. Contact us on <a href="{{whatsapp_url}}">WhatsApp</a> before ordering to confirm availability and charges.</p>', 205),
  ('Shipping & Delivery', 'How can I track my order?',
   '<p>Available tracking details will be shared through WhatsApp or another contact method provided at checkout.</p>', 206),
  ('Shipping & Delivery', 'What if my order is delayed?',
   '<p>Contact us with your order number so we can check available tracking information.</p>', 207),

  -- Personalised & Customised Products
  ('Personalised & Customised Products', 'Can I personalise a notebook or planner?',
   '<p>Yes, subject to design feasibility and availability. Contact us with your requirements.</p>', 301),
  ('Personalised & Customised Products', 'How long do personalised orders take?',
   '<p>Standard personalised orders generally require {{personalised_production_days}} for production before dispatch. Complex designs, bulk quantities and special requirements may take longer.</p>', 302),
  ('Personalised & Customised Products', 'Can I change my design after approval?',
   '<p>Changes may not be possible once production has begun. Accommodated changes may involve additional charges or time.</p>', 303),
  ('Personalised & Customised Products', 'Can I cancel a personalised order?',
   '<p>Cancellation may not be possible once production has begun or materials have been procured specifically for your order. See the <a href="/cancellation-returns-refund-policy">Cancellation, Returns &amp; Refund Policy</a>.</p>', 304),

  -- Returns, Replacements & Store Credit
  ('Returns, Replacements & Store Credit', 'Can I return a product if I change my mind?',
   '<p>Routine returns or exchanges are not accepted for products delivered in good condition that match the order.</p>', 401),
  ('Returns, Replacements & Store Credit', 'What if my order arrives damaged or defective?',
   '<p>Contact us within {{order_damage_report_window_text}} with your order number and clear photos of the product and packaging.</p>', 402),
  ('Returns, Replacements & Store Credit', 'Do you offer refunds?',
   '<p>Replacement or store credit is preferred for eligible issues. Where a refund or another remedy is required by law, it will be provided in accordance with law.</p>', 403),
  ('Returns, Replacements & Store Credit', 'What if a replacement is unavailable?',
   '<p>Depending on the circumstances, store credit or another appropriate resolution may be offered under our policy and applicable law.</p>', 404),

  -- Corporate Gifting
  ('Corporate Gifting', 'Do you offer corporate gifting?',
   '<p>Yes, we offer customised stationery and corporate gifting options for teams, clients, events and special occasions.</p>', 501),
  ('Corporate Gifting', 'Can products be customised with a company logo?',
   '<p>Options depend on the product, design requirements and order quantity. Contact us to discuss branding.</p>', 502),
  ('Corporate Gifting', 'How do I enquire?',
   '<p><a href="mailto:{{contact_email}}">Email us</a> or contact us on <a href="{{whatsapp_url}}">WhatsApp</a> with estimated quantity, budget, branding requirements and preferred delivery timeline.</p>', 503)
) as v(group_name, question, answer_html, sort_order)
where not exists (
  select 1 from public.faqs f where f.question = v.question
);

-- ===========================================================================
-- Homepage sections (in display order). Images are placeholders in /public/placeholders/homepage;
-- headings are starter copy for the admin to replace.
--
-- Asset conventions (homepage_assets):
--   slot        = panel / tile position within the section (0, 1, 2, ...)
--   sort_order  = 0 for image A (+ the text fields), 1 for image B (alternating images)
--   heading / subheading / button_label / link_url / badge_text as described per section
--
-- hero                 3 panels × (A, B). Text on any panel's A asset becomes that panel's overlay.
--                      config: { "heading_font": "script" | "serif" | "display" }
-- collection_carousel  one asset per tile: image + heading (caption) + link_url.
--                      config: { "heading": "..." }. No assets = the menu categories (with image_url).
-- promo_duo            2 tiles × (A, B); A carries heading, subheading, button_label, link_url.
-- product_mosaic       slot 0: two stacked lifestyle images (sort 0 and 1); heading on sort 0 = caption.
--                      config: { "product_slugs": [...] } (curated, in order) or empty = latest 8;
--                              "tile_tone": "blush" | "paper" | "tint-blue" | "white"
-- promo_trio           3 tiles: image + badge_text (sticker; "\n" = line break) + button_label + link_url.
-- instagram_feed       one asset per tile: image + link_url (post URL).
--                      config: { "heading": "...", "handle": "@...", "follower_text": "..." }
-- ===========================================================================

-- One statement (no temporary table), so it runs the same in the Supabase SQL editor, the CLI
-- or psql. Each section is created once (skipped if that type already exists), then its assets.
with hp as (
  select type, sort_order::int, config::jsonb, slot::int, a_sort::int, image_url, image_alt, link_url,
         heading, subheading, button_label, badge_text
  from (values
    -- HERO
    ('hero', 10, '{"heading_font": "playful", "text_tone": "dark"}', 0, 0, '/placeholders/homepage/hero/hero-1a.svg', 'Replace me: placeholder hero image, panel 1', null, null, null, null, null),
    ('hero', 10, null, 0, 1, '/placeholders/homepage/hero/hero-1b.svg', 'Replace me: placeholder hero image, panel 1 alternate', null, null, null, null, null),
    ('hero', 10, null, 1, 0, '/placeholders/homepage/hero/hero-2a.svg', 'Replace me: placeholder hero image, panel 2', '/collections/new-in',
       'Where creativity meets *colour*', 'Thoughtfully designed notebooks, planners and little paper essentials.', 'Shop now', null),
    ('hero', 10, null, 1, 1, '/placeholders/homepage/hero/hero-2b.svg', 'Replace me: placeholder hero image, panel 2 alternate', null, null, null, null, null),
    ('hero', 10, null, 2, 0, '/placeholders/homepage/hero/hero-3a.svg', 'Replace me: placeholder hero image, panel 3', null, null, null, null, null),
    ('hero', 10, null, 2, 1, '/placeholders/homepage/hero/hero-3b.svg', 'Replace me: placeholder hero image, panel 3 alternate', null, null, null, null, null),

    -- SHOP BY COLLECTION
    ('collection_carousel', 20, '{"heading": "Shop by Collection", "view_all_url": "/collections/new-in"}', 0, 0, '/placeholders/categories/new-in.svg', 'Replace me: placeholder New In image', '/collections/new-in', 'New In', 'Our latest designs', null, null),
    ('collection_carousel', 20, null, 1, 0, '/placeholders/categories/notebooks-journals.svg', 'Replace me: placeholder Notebooks & Journals image', '/collections/notebooks-journals', 'Notebooks & Journals', 'For every thought and idea', null, null),
    ('collection_carousel', 20, null, 2, 0, '/placeholders/categories/planners.svg', 'Replace me: placeholder Planners image', '/collections/planners', 'Planners', 'Make your days yours', null, null),
    ('collection_carousel', 20, null, 3, 0, '/placeholders/categories/paper-edit.svg', 'Replace me: placeholder Paper Edit image', '/collections/paper-edit', 'Paper Edit', 'Little things for your desk', null, null),
    ('collection_carousel', 20, null, 4, 0, '/placeholders/categories/gifts.svg', 'Replace me: placeholder Gifts image', '/collections/gifts', 'Gifts', 'Curated for paper lovers', null, null),
    ('collection_carousel', 20, null, 5, 0, '/placeholders/categories/personalised.svg', 'Replace me: placeholder Personalised image', '/collections/personalised', 'Personalised', 'Made just for you', null, null),

    -- PROMO DUO
    ('promo_duo', 30, '{}', 0, 0, '/placeholders/homepage/promo-duo/promo-duo-1a.svg', 'Replace me: placeholder promo image', '/collections/notebooks-journals',
       'Notebooks & Journals', 'Putting pen to paper, one page at a time.', 'Shop notebooks', null),
    ('promo_duo', 30, null, 0, 1, '/placeholders/homepage/promo-duo/promo-duo-1b.svg', 'Replace me: placeholder promo image alternate', null, null, null, null, null),
    ('promo_duo', 30, null, 1, 0, '/placeholders/homepage/promo-duo/promo-duo-2a.svg', 'Replace me: placeholder promo image', '/collections/gifts',
       'Gifts', 'Thoughtful stationery for every occasion.', 'Discover the gift shop', null),
    ('promo_duo', 30, null, 1, 1, '/placeholders/homepage/promo-duo/promo-duo-2b.svg', 'Replace me: placeholder promo image alternate', null, null, null, null, null),

    -- PRODUCT MOSAIC
    ('product_mosaic', 40, '{"heading": "The New Collection", "view_all_url": "/collections/new-in", "product_slugs": [], "tile_tone": "blush"}', 0, 0, '/placeholders/homepage/mosaic/mosaic-1a.svg', 'Replace me: placeholder lifestyle image', '/collections/notebooks-journals',
       'A notebook for every kind of day', null, null, null),
    ('product_mosaic', 40, null, 0, 1, '/placeholders/homepage/mosaic/mosaic-2a.svg', 'Replace me: placeholder lifestyle image', null, null, null, null, null),

    -- PROMO TRIO
    ('promo_trio', 50, '{}', 0, 0, '/placeholders/homepage/promo-trio/promo-trio-1a.svg', 'Replace me: placeholder promo tile', '/collections/paper-edit', null, null, 'Shop paper edit', E'Paper\nEdit'),
    ('promo_trio', 50, null, 1, 0, '/placeholders/homepage/promo-trio/promo-trio-2a.svg', 'Replace me: placeholder promo tile', '/collections/planners', null, null, 'Shop planners', E'Plan\nAhead'),
    ('promo_trio', 50, null, 2, 0, '/placeholders/homepage/promo-trio/promo-trio-3a.svg', 'Replace me: placeholder promo tile', '/collections/personalised', null, null, 'Shop personalised', E'Made\nfor you'),

    -- INSTAGRAM
    ('instagram_feed', 60, '{"heading": "Join the community on Instagram", "handle": "", "follower_text": ""}',
       0, 0, '/placeholders/homepage/instagram/instagram-1a.svg', 'Replace me: placeholder Instagram post', null, null, null, null, null),
    ('instagram_feed', 60, null, 1, 0, '/placeholders/homepage/instagram/instagram-2a.svg', 'Replace me: placeholder Instagram post', null, null, null, null, null),
    ('instagram_feed', 60, null, 2, 0, '/placeholders/homepage/instagram/instagram-3a.svg', 'Replace me: placeholder Instagram post', null, null, null, null, null),
    ('instagram_feed', 60, null, 3, 0, '/placeholders/homepage/instagram/instagram-4a.svg', 'Replace me: placeholder Instagram post', null, null, null, null, null),
    ('instagram_feed', 60, null, 4, 0, '/placeholders/homepage/instagram/instagram-5a.svg', 'Replace me: placeholder Instagram post', null, null, null, null, null),
    ('instagram_feed', 60, null, 5, 0, '/placeholders/homepage/instagram/instagram-6a.svg', 'Replace me: placeholder Instagram post', null, null, null, null, null)
  ) as v(type, sort_order, config, slot, a_sort, image_url, image_alt, link_url, heading, subheading, button_label, badge_text)
),
new_sections as (
  insert into public.homepage_sections (type, sort_order, is_active, config)
  select h.type, h.sort_order, true, h.config
  from hp h
  where h.config is not null
    and not exists (select 1 from public.homepage_sections s where s.type = h.type)
  returning id, type
)
insert into public.homepage_assets
  (section_id, slot, sort_order, image_url, image_alt, link_url, heading, subheading, button_label, badge_text)
select ns.id, h.slot, h.a_sort, h.image_url, h.image_alt, h.link_url, h.heading, h.subheading, h.button_label, h.badge_text
from hp h
join new_sections ns on ns.type = h.type;

-- ===========================================================================
-- Homepage: info strip shown above the footer (three columns).
-- badge_text = tiny label, heading = serif headline, subheading = text ([label](href) links allowed).
-- config.icons picks an icon per slot: truck, package, help, gift, heart, sparkles, chat.
-- ===========================================================================

with strip as (
  insert into public.homepage_sections (type, sort_order, is_active, config)
  select 'info_strip', 100, true, '{"icons": ["truck", "package", "help"]}'::jsonb
  where not exists (select 1 from public.homepage_sections where type = 'info_strip')
  returning id
)
insert into public.homepage_assets (section_id, slot, badge_text, heading, subheading, sort_order)
select strip.id, v.slot, v.badge_text, v.heading, v.subheading, 0
from strip
cross join (values
  (0, 'Standard shipping ₹{{standard_shipping_fee_inr}}', 'Delivery Across India', '{{ready_stock_dispatch_text}}'),
  (1, 'Packed with care', 'Carefully Packed', 'Every order is carefully packed and prepared for its journey to you.'),
  (2, 'Have a question?', 'We’re Here to Help', 'Try our [Help Centre](/faq) or [Contact us](/contact)')
) as v(slot, badge_text, heading, subheading);

-- ===========================================================================
-- Placeholder products for layout testing (only added when the shop has no real products).
-- Every name starts with "[Replace me]" and every image lives in /public/placeholders.
-- Delete these before launch (Admin → Products, or:
--   delete from public.products where slug like 'placeholder-%';)
-- ===========================================================================

insert into public.products
  (name, slug, short_description, description_html, price_inr, compare_at_price_inr, sku,
   stock_qty, track_stock, mode, badge_text, is_new, is_best_seller, low_stock_message, sort_order)
select * from (values
  ('[Replace me] Spiral Notebook A5', 'placeholder-spiral-notebook-a5',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   449, null, 'PH-001', 40, true, 'buy', null, true, false, null, 1),
  ('[Replace me] Dot Grid Journal', 'placeholder-dot-grid-journal',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   699, 799, 'PH-002', 25, true, 'buy', 'BESTSELLER', false, true, null, 2),
  ('[Replace me] Softcover Notebook Set', 'placeholder-softcover-notebook-set',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   549, null, 'PH-003', 30, true, 'buy', null, false, false, null, 3),
  ('[Replace me] Undated Planner', 'placeholder-undated-planner',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   899, null, 'PH-004', 20, true, 'buy', null, true, true, null, 4),
  ('[Replace me] Weekly Planner', 'placeholder-weekly-planner',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   1199, 1399, 'PH-005', 15, true, 'buy', null, false, false, null, 5),
  ('[Replace me] Notepad Trio', 'placeholder-notepad-trio',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   299, null, 'PH-006', 50, true, 'buy', null, false, false, null, 6),
  ('[Replace me] Bookmark Set', 'placeholder-bookmark-set',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   199, null, 'PH-007', 3, true, 'buy', null, false, false, 'Selling fast — only a few left in stock!', 7),
  ('[Replace me] Snap-in Separators', 'placeholder-snap-in-separators',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   249, null, 'PH-008', 35, true, 'buy', null, false, false, null, 8),
  ('[Replace me] Greeting Card Pack', 'placeholder-greeting-card-pack',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   349, null, 'PH-009', 0, true, 'buy', null, true, false, null, 9),
  ('[Replace me] Sticky Notes', 'placeholder-sticky-notes',
   'Replace me: placeholder product for layout testing.', '<p>Replace me: placeholder product for layout testing. Replace with real product copy.</p>',
   179, null, 'PH-010', null, false, 'buy', null, false, true, null, 10),
  ('[Replace me] Custom Name Notebook', 'placeholder-custom-name-notebook',
   'Replace me: placeholder personalised product for layout testing.', '<p>Replace me: placeholder personalised product. Customised via WhatsApp — no cart or checkout.</p>',
   799, null, 'PH-011', null, false, 'whatsapp', null, true, false, null, 11),
  ('[Replace me] Custom Planner', 'placeholder-custom-planner',
   'Replace me: placeholder personalised product for layout testing.', '<p>Replace me: placeholder personalised product. Customised via WhatsApp — no cart or checkout.</p>',
   null, null, 'PH-012', null, false, 'whatsapp', null, false, false, null, 12)
) as v
-- Samples are only for an empty shop: once real products exist, re-running never adds them back.
where not exists (select 1 from public.products where slug not like 'placeholder-%')
on conflict (slug) do nothing;

update public.products
set details_html = '<ul><li>Replace me: size, page count, paper weight and binding.</li><li>Replace me: ruling / layout.</li></ul>'
where slug like 'placeholder-%' and details_html is null;

-- Two images per product (front + alternate) for hover swaps and galleries.
insert into public.product_images (product_id, url, alt, sort_order)
select p.id, '/placeholders/products/' || p.slug || '-' || n || '.svg',
       p.name || case when n = 1 then '' else ' — alternate view' end, n
from public.products p
cross join generate_series(1, 2) as n
where p.slug like 'placeholder-%'
  and not exists (select 1 from public.product_images i where i.product_id = p.id);

-- Variants (option groups) on two products.
insert into public.product_variants (product_id, label, option_group, price_override, stock_qty, sort_order)
select p.id, v.label, v.option_group, v.price_override, v.stock_qty, v.sort_order
from (values
  ('placeholder-spiral-notebook-a5', 'Ruled',       'Ruling', null::numeric, 15, 1),
  ('placeholder-spiral-notebook-a5', 'Dotted',      'Ruling', null::numeric, 15, 2),
  ('placeholder-spiral-notebook-a5', 'Plain',       'Ruling', null::numeric, 0,  3),
  ('placeholder-undated-planner',    'Chilli Red',  'Colour', null::numeric, 8,  1),
  ('placeholder-undated-planner',    'Blush Pink',  'Colour', null::numeric, 8,  2),
  ('placeholder-undated-planner',    'Sage Green',  'Colour', 949::numeric,  4,  3)
) as v(product_slug, label, option_group, price_override, stock_qty, sort_order)
join public.products p on p.slug = v.product_slug
where not exists (select 1 from public.product_variants x where x.product_id = p.id);

-- Placements. NEW IN / Best Sellers / Under ₹1,000 / Personalised Gifts are automatic
-- filters, so products only need linking to the manual subcategories.
insert into public.product_subcategories (product_id, subcategory_id)
select p.id, s.id
from (values
  ('placeholder-spiral-notebook-a5',     'notebooks-journals', 'spiral-bound-notebooks'),
  ('placeholder-dot-grid-journal',       'notebooks-journals', 'journals'),
  ('placeholder-softcover-notebook-set', 'notebooks-journals', 'softcover-notebooks'),
  ('placeholder-softcover-notebook-set', 'gifts',              'gifts-for-her'),
  ('placeholder-softcover-notebook-set', 'gifts',              'gift-sets'),
  ('placeholder-undated-planner',        'planners',           'undated-planners'),
  ('placeholder-weekly-planner',         'planners',           'weekly-planners'),
  ('placeholder-weekly-planner',         'gifts',              'gift-sets'),
  ('placeholder-notepad-trio',           'paper-edit',         'notepads'),
  ('placeholder-notepad-trio',           'gifts',              'gifts-for-her'),
  ('placeholder-bookmark-set',           'paper-edit',         'bookmarks'),
  ('placeholder-bookmark-set',           'gifts',              'gifts-for-him'),
  ('placeholder-snap-in-separators',     'paper-edit',         'snap-in-separators'),
  ('placeholder-greeting-card-pack',     'paper-edit',         'cards'),
  ('placeholder-sticky-notes',           'paper-edit',         'sticky-notes'),
  ('placeholder-custom-name-notebook',   'personalised',       'custom-notebooks'),
  ('placeholder-custom-name-notebook',   'gifts',              'gifts-for-her'),
  ('placeholder-custom-planner',         'personalised',       'custom-planners'),
  ('placeholder-custom-planner',         'personalised',       'corporate-gifting'),
  ('placeholder-custom-planner',         'gifts',              'gifts-for-him')
) as v(product_slug, category_slug, subcategory_slug)
join public.products p      on p.slug = v.product_slug
join public.categories c    on c.slug = v.category_slug
join public.subcategories s on s.category_id = c.id and s.slug = v.subcategory_slug
on conflict do nothing;

-- ===========================================================================
-- Safety net: anything still using a bundled placeholder image is labelled "Replace me",
-- including rows left by older versions of this seed. Admin → Orders shows a reminder
-- while any of these remain.
-- ===========================================================================

update public.products
set name = regexp_replace(name, '^PLACEHOLDER\s+', '[Replace me] ')
where name like 'PLACEHOLDER %';

update public.product_images i
set alt = p.name || case when i.sort_order = 1 then '' else ' — alternate view' end
from public.products p
where p.id = i.product_id
  and i.url like '/placeholders/%'
  and coalesce(i.alt, '') not ilike '%replace me%';

update public.homepage_assets
set image_alt = 'Replace me: ' || coalesce(nullif(image_alt, ''), 'placeholder image')
where image_url like '/placeholders/%'
  and coalesce(image_alt, '') not ilike '%replace me%';

update public.categories c
set menu_feature_images = (
  select jsonb_agg(
           case when f->>'url' like '/placeholders/%' and coalesce(f->>'alt', '') not ilike '%replace me%'
                then jsonb_set(f, '{alt}', to_jsonb('Replace me: ' || coalesce(nullif(f->>'alt', ''), 'placeholder image')))
                else f end
           order by ord)
  from jsonb_array_elements(c.menu_feature_images) with ordinality as t(f, ord)
)
where jsonb_typeof(c.menu_feature_images) = 'array'
  and jsonb_array_length(c.menu_feature_images) > 0;

commit;
