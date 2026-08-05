# Findi — Feature Specification
*Find local. Save more.*

Version 0.6 — Draft for review
Prepared: 26 July 2026 · Updated: 29 July 2026 (Impact Dashboard, supplier referral programme, refined four-pillar copy, and roadmap/wording polish)

Findi is a curated marketplace that helps households save money, helps local businesses grow, and creates sustainable fundraising opportunities for schools and community organisations. This revision folds in the business owner's consolidated direction after several weeks of discussion: Findi is no longer just a marketplace — it's a platform built around four pillars (§4), with the underlying data model designed on day one to support supplier tiers, fundraising organisations, community giving, curated categories, and multi-supplier orders, even where the customer-facing feature activates later.

---

## 0. How this document is organised

1. Platform map (what lives where)
2. User roles
3. Reference model — what we're borrowing from Refreshi, and where Findi deliberately diverges
4. The Findi framework — four pillars
5. Curated marketplace model — supplier tiers, approval workflow, category gating
6. Feed It Forward — giving back to the community
7. Fundraising Module — schools, churches, clubs
8. Local Boxes
9. Findi Points
10. Customer-facing features — website (www.findi.co.za) + mobile app
11. Supplier features — portal.findi.co.za
12. Admin features — portal.findi.co.za
13. Content, legal & trust pages
14. Notifications & communications
15. Non-functional requirements (hosting, payments, compliance, performance)
16. Information architecture / screen inventory
17. Roadmap
18. Open questions for the business to decide

---

## 1. Platform map

| Property | Purpose | Users |
|---|---|---|
| **www.findi.co.za** | Public marketing site + customer web app (browse, order, pay, track) | Consumers, prospective suppliers, fundraising organisations, press |
| **portal.findi.co.za** | Supplier dashboard + Fundraising Organisation dashboard + Findi Admin console (role-based, same login system, different views) | Suppliers, fundraising organisations, Findi staff |
| **Findi mobile app** (iOS + Android) | Primary customer shopping experience; mirrors the web app functionally | Consumers |
| **Server** | Shared Ubuntu box already hosting twelvewoodenspoons.co.za and torahcanvas.co.za (129.232.204.218) | — |

All three surfaces share one backend/API and one account system — a customer who signs up on the app can log into the website with the same credentials, and vice versa.

---

## 2. User roles

- **Guest** — anyone browsing before registering. Can view deals, categories and suppliers by area but cannot check out.
- **Customer** — registered shopper. Browses, orders, pays, tracks orders, manages profile, earns Findi Points, can attach a Fundraising code to support a school/church/club.
- **Supplier** — onboarded under one of four tiers (see §5): Findi Farmer, Findi Local Business, Findi Community Seller, or Findi Rescue Partner. Approved for specific product categories, not just a tier. Manages listings, stock, orders and Findi Wallet inside portal.findi.co.za.
- **Supplier Staff** *(Phase 2)* — a supplier can invite limited-access staff (e.g. to only mark orders as collected).
- **Fundraising Organisation** *(new role)* — a school, church, sports club or similar cause with its own fundraising code and a read-only reporting dashboard in portal.findi.co.za (see §7).
- **Findi Admin** — internal team. Approves suppliers, assigns tiers and approved categories, reviews category capacity, moderates listings, manages orders/disputes, tracks commission, administers Feed It Forward and Fundraising, views analytics.
- **Findi Super Admin** — admin-user management, financial settings, commission-rate configuration, platform-wide settings.
- **Collection Point Staff** *(Phase 3, future)* — staff at a Findi-operated hub who hand over multi-supplier orders.

---

## 3. Reference model: Refreshi, and how Findi differs

Refreshi (refreshi.co.za / app.refreshi.co.za / store.refreshi.co.za) is the functional template requested, so the pattern below was reviewed directly: public marketing site with Our Story / Surplus Food / User FAQs / Blog / Contact, a separate ordering web-app subdomain, a `MyStore Login` merchant portal, and native iOS/Android apps. Its core mechanic is the **blind "Surprise Bag"**: a merchant lists a mystery bag at a fixed discounted price, available only inside a tight end-of-day collection window (typically the last 30–60 minutes before closing), paid for in-app via a card gateway, and released to the customer after an in-app "swipe to verify" at the till.

**Findi keeps** the parts of that model that work well for a waste-reduction marketplace:
- Location-based discovery of nearby deals
- A short, defined collection window per listing
- In-app/in-browser payment before collection, with a verification step at pickup
- A single account working across app and web
- A separate merchant portal for listing management, distinct from the admin console
- A trust layer of FAQs, food-safety guidance, and a public impact report

**Findi deliberately diverges** from Refreshi — and from other surplus-food apps such as Still Good — in ways that follow from the brief and from the decisions in §4–§9:

| Refreshi (and similar apps) | Findi |
|---|---|
| Blind "Surprise Bag" — contents unknown until pickup | **Named, photographed products** with visible quantity and price — the customer chooses *what* and *how much* |
| Single fixed bag price per merchant per day | **Per-item pricing set by the supplier**, a basket that can hold items from one or more suppliers |
| Merchants = cafés/restaurants/grocers selling one bag type | **Four supplier tiers** — Farmers, Local Businesses, Community Sellers, Rescue Partners — each approved down to specific product categories |
| Not a general marketplace — purely surplus/waste | Findi is waste-reduction **plus** everyday affordable local produce discovery **plus** community fundraising |
| Open marketplace — most applicants accepted | **Curated marketplace** — sellers accepted by category, not just approved individually (§5) |
| No community-giving mechanic | **Feed It Forward** — a checkout contribution ring-fenced from Findi's own revenue (§6) |
| No cause-marketing mechanic | **Fundraising Module** — schools, churches and clubs raise money through their community's everyday shopping (§7) |

This is also the basis for the "must be unique in design" requirement: Findi should not visually or structurally read as a Refreshi clone. Recommend a distinct visual identity (see §15.5) built around the product-forward "browse a real product, not a mystery bag" experience.

---

## 4. The Findi framework — four pillars

Findi's identity, per the business owner: *"A trusted, curated marketplace that helps families save money, helps local businesses grow, reduces food waste and creates sustainable fundraising opportunities for communities."* Four pillars carry that identity through every part of the app, not just the marketing copy:

| Pillar | What it means | Where it lives |
|---|---|---|
| **Find** | Discover trusted local suppliers | Curated marketplace, seller tiers (§5) |
| **Save** | Access affordable prices and reduce food waste | Core deal/checkout experience, waste-reduction pricing |
| **Support** | Help local farmers, businesses and carefully selected Community Sellers grow | Supplier tiers, category gating, Findi Approved Seller (§5) |
| **Give** | Every purchase can contribute to schools, community projects and families in need | Feed It Forward (§6) and the Fundraising Module (§7) |

### 4.1 Impact Dashboard

Rather than a narrow "money saved" counter, the homepage "Why Buy From Findi?" section — and a fuller public Impact Dashboard page — should tell the whole four-pillar story visually, with six live figures:

- Local suppliers supported
- Food rescued
- Money saved
- Families helped
- Schools supported
- Money raised for communities

These are illustrative categories, not real figures yet — the dashboard populates from data the platform already tracks: Admin analytics, the Feed It Forward ledger, and Fundraising dashboards (§6, §7, §13), so no separate reporting system is needed to power it.

---

## 5. Curated marketplace model

This is a deliberate positioning decision, not just an operating policy: **Findi optimises for the right sellers, not the most sellers.** It's the mechanism behind the trust promise "if it's on Findi, it's been vetted," and it underpins the *Find Local* and *Support Local* pillars.

### 5.1 Supplier tiers

Four tiers, built into the data model from day one so permissions and reporting never need a redesign later:

| Tier | Who | Examples |
|---|---|---|
| **Findi Farmers** | Growers selling fresh produce direct to households | Fruit, vegetables, herbs |
| **Findi Local Businesses** | Established local businesses with a proven product | Bakeries, butchers, farm stalls, honey & olive oil producers, delis |
| **Findi Community Sellers** | Carefully selected individuals who fill a gap rather than compete with existing partners | Bulk pantry staples, homemade rusks, traditional foods, meal packs, seasonal hampers |
| **Findi Rescue Partners** | Suppliers whose listings are specifically surplus/near-expiry/excess stock, in any category | End-of-day bakery, short-dated produce, cancelled orders, seasonal oversupply |

Many realistic Community Sellers are already running an informal resale side-income of their own — a personal network built on word of mouth and WhatsApp. Findi isn't meant to replace that channel; it adds a more professional storefront alongside it, which is exactly why the tier exists rather than asking them to compete head-on with established Local Businesses.

### 5.2 Supplier approval workflow

A single, explicit pipeline for every tier:

**Application → Pending Review → Approved → Categories Assigned → Login Activated**

A supplier isn't just "approved" in the abstract — approval is granted for specific product categories, and portal access only activates once both steps are done. This is what makes §5.3 enforceable rather than aspirational.

### 5.3 Approved product categories, not blanket approval

A supplier is approved for the specific categories they applied under — not free to list anything. Example: Sarah is approved for Flour, Rice and Sugar; she cannot suddenly start selling honey or olive oil without a separate approval. This protects existing supplier relationships and is the mechanism that makes the category-gating policy below actually stick, rather than relying on after-the-fact moderation.

This rule applies to every tier, but it matters most for **Community Sellers** specifically — that's the tier explicitly designed to fill gaps rather than compete, so category creep is the exact failure mode it exists to prevent.

### 5.4 The policy, in one sentence

> Findi accepts Community Sellers whose products complement — not compete with — existing Findi partners.

In practice: **not** selling exactly the same raw honey as an existing honey producer, **not** undercutting a bakery already on Findi with the same products, **not** duplicating another supplier's core offering.

### 5.5 Category gating — think in categories, not applicants

The approval question isn't *"can another seller join?"* — it's *"does this category already have enough quality suppliers?"*

- **When a category is full** — e.g. honey, already covered well by two producers — a third seller is only approved if they bring something genuinely different (organic certified, creamed honey, gift packs, bee pollen).
- **When a category has a gap** — e.g. nobody offers bulk pantry staples like flour — a Community Seller filling that gap should be approved on sight.

### 5.6 Findi Approved Seller

Every seller earns the badge on the same five criteria, shown on their storefront so customers know exactly what it means: **product quality, customer service, fair pricing, local focus, reliability.** This is the customer-facing expression of "if it's on Findi, it's been vetted" — see §10.2.

### 5.6b Verified Findi Partner (proposed — relationship to §5.6 badge open, see §18 decision 16)

A second, stricter badge requested by the business owner (2026-08-04), earned after the following are all in place — track-record criteria, not application-time criteria:
- Verified identity
- Verified banking details
- Consistent order fulfilment
- Good customer ratings
- Reliable service

*(Open question: does this replace Findi Approved Seller, or sit above it as a second tier a seller graduates into after time on the platform? If both badges exist, storefronts need visually distinct treatment so the two don't read as the same thing to customers — see §18 decision 16.)*

### 5.7 Supplier agreement protection clause

> Findi reserves the right to limit the number of suppliers within a product category to maintain a healthy marketplace and ensure value for both customers and suppliers.

This tells suppliers up front: Findi won't sign up ten businesses selling exactly the same thing — protecting the value of every existing listing.

### 5.8 Community Seller application

Applicants answer five questions before Findi decides (not an automatic accept):
1. What products do you sell?
2. Where are you based?
3. Are you a registered business or an individual?
4. How often do you have stock available?
5. Why would your products add value to Findi?

### 5.9 The philosophy, and a line for the website

> Quality over quantity. Every Findi seller is carefully selected to offer something valuable to our community.

### 5.10 Supplier referral programme

Suppliers know suppliers — a low-cost growth channel that doesn't rely on Findi's own outreach. Example: Raw Cape Honey refers an olive oil producer; if that supplier is approved and goes live, Raw Cape Honey earns a reward — a free featured listing, or reduced commission for one month. Referred suppliers still go through the full approval pipeline in §5.2; the referral only affects who applies, not who gets approved.

---

## 6. Feed It Forward — giving back to the community

Personal to the founder, not a bolt-on growth feature. Feed It Forward is Findi's own general community fund — distinct from the Fundraising Module (§7), which raises money for specific named organisations. Feed It Forward is Findi's, disbursed at Findi's discretion to families in need; Fundraising is the customer's chosen school/church/club, tracked to that organisation specifically.

### 6.1 The idea

A ring-fenced community fund, built into checkout, that channels a small contribution from orders toward helping people in need in the local community — the same spirit as a charity shop: people nearby, in the community Findi already serves.

### 6.2 How customers contribute

- **Round-up** — an order totalling R287.50 rounds up to R290; the R2.50 difference goes to Feed It Forward.
- **Fixed amounts** — R1, R5 or R10, selectable at checkout.

*(Whether round-up should default to on with an easy opt-out, rather than opt-in, is an open decision — see §18.)*

### 6.3 How suppliers contribute

Suppliers can opt into their own contribution, independent of the customer's:
- **"Donate R1 per order"** — a flat per-order amount the supplier chooses to give
- **"Donate surplus stock"** — a supplier can flag unsold stock as a direct in-kind Feed It Forward donation instead of relisting it as a paid deal

### 6.4 Ring-fenced, not revenue

Feed It Forward contributions — customer and supplier — are tracked completely separately from Findi's commission and revenue, never rolled into turnover, from collection through to disbursement. This mirrors a general principle worth confirming with an accountant before launch: funds explicitly collected as donations typically need to be clearly earmarked as such, rather than commingled with ordinary business income. Treated here as a compliance item to validate, not an assumption (§18).

### 6.5 Where it shows up

- **Checkout** — contribution toggle/line item alongside the order total; a supplier's own contribution choice lives in their listing settings
- **Customer profile** — a running personal "given back" total, and community impact visible at a glance
- **Admin** — a separate Feed It Forward ledger, distinct from commission/revenue reporting, with disbursement tracking to recipients
- **Public site** — a page in the spirit of the Impact Report, showing cumulative community impact, feeding the homepage counters in §4

### 6.6 Governance

Who the fund actually helps, and how often it pays out, is a decision for the business rather than something to assume — see §18. At minimum, disbursement needs a record: recipient/cause, amount, date, approved by whom.

---

## 7. Fundraising Module

A core feature, not an add-on — this is one of the things that makes Findi distinct from Refreshi, Still Good, or a generic marketplace. Schools, churches, sports clubs and similar causes register as a **Fundraising Organisation** and get:

- A **unique fundraising code**, entered or linked at checkout by a supporting customer
- Their **own dashboard** in portal.findi.co.za (read-only reporting, not a selling account)
- **Total money raised**, running and historical
- **Monthly reports**, exportable
- **Number of supporters** (unique customers who've used the code)
- **Total orders generated**

### 7.1 How it works

A percentage of a supporting customer's order is credited to the organisation's running total — funded from Findi's own commission on that order, not from the supplier's share, so suppliers are unaffected either way. Findi disburses to the organisation on a set cycle (proposed: monthly, matching the reporting cadence above).

### 7.2 Why it's foundational, not bolted on

Even though the full customer-facing experience phases in over time (§17), the underlying data model — organisations as a first-class entity, codes attachable to an order, a running ledger per organisation — needs to exist from the first version of the schema. Retrofitting a fundraising-code relationship onto an order model that wasn't built for it is exactly the kind of rework this document is trying to avoid (see §17's architecture-first principle).

---

## 8. Local Boxes

A flagship offering in its own right: Findi-curated bundles sold as a single purchasable box rather than a shelf of individual listings. Examples:

- **Cape Town Local Box** — a general local-favourites bundle
- **Farm Fresh Box** — seasonal produce, curated weekly
- **Pantry Box** — bulk staples bundled together

A Local Box can draw from multiple suppliers behind the scenes — it's a curated presentation layer on top of the same multi-supplier basket and split-payment architecture already required for the everyday shopping flow (§15.2), not a separate system.

- **Admin**: curate box contents, pricing and refresh cadence (e.g. weekly for Farm Fresh Box)
- **Customer**: browse and buy a Local Box as a single one-tap purchase, with the same collection/split-payment mechanics as a manually built basket underneath

---

## 9. Findi Points

Kept deliberately simple at launch rather than building a complex loyalty programme up front.

- Customers earn points for **purchases**, **referrals**, and **reviews**
- Points can later be **redeemed** or **donated** (e.g. converted into a Feed It Forward contribution) — this redemption/donation layer is a Growth-phase feature (§17), earning points is available sooner
- No tiers, badges or complex multipliers at launch — that's explicitly deferred (§17)

---

## 10. Customer-facing features (website + mobile app, same functional scope)

### 10.1 Onboarding & account
- Sign up via email/password, and social/phone options (Google, Apple, OTP via SMS)
- Location permission / manual suburb-area selection (pilot: Cape Town Northern Suburbs)
- Guest browsing with a login gate at checkout
- Profile management: name, contact number, delivery/collection address book, saved payment methods
- Password reset, account deletion (self-service, POPIA-aligned)
- Email/phone verification

### 10.2 Discovery & browsing
- Home feed of deals near the user, sorted by distance / expiry / newest
- **"Why Buy From Findi?" homepage counters** — suppliers, Rand raised, families supported, kg of food saved (§4)
- Category browse: Fresh fruit & veg, Bakery rescue, Local pantry products *(MVP)*; Butcher specials, Restaurant meals, Household, Handmade *(future)*
- **Local Boxes** as a distinct, featured browse section (§8)
- Supplier storefront pages — photo, bio, location, seller tier, all active listings, ratings
- **"Findi Approved Seller" badge** shown on every storefront and listing (§5.6)
- Search with filters: category, price range, distance, collection window, dietary tags, "collecting today"
- Map view + list view toggle
- Deal detail page: photos, description, original vs. discounted price, quantity available, collection window, supplier info, pickup address, cancellation policy
- Favourites/wishlist (save suppliers or recurring deal types)
- "Notify me" opt-in per supplier or category *(Phase 2)*

### 10.3 Basket & checkout
- **Basket spanning multiple suppliers, one checkout** — grouped by supplier since each has its own collection window/address (see §15.2)
- Quantity adjustment, remove item, live stock-availability check before payment
- **Fundraising code** field — attach a supporting organisation to the order (§7)
- **Feed It Forward contribution toggle** — round-up or R1/R5/R10, shown as its own line item (§6.2)
- Order summary with itemised price per supplier, Feed It Forward contribution, Findi service fee (if applicable), total
- Secure online payment (South African gateway — PayFast, Yoco, or Peach Payments; see §15.2), **split automatically across every supplier in the basket**
- Time-boxed checkout (reserved stock held for a short window during payment) to prevent overselling
- Order confirmation screen + emailed/WhatsApp receipt
- Collection instructions per supplier: address, map pin, window, any supplier notes

### 10.4 Order management
- Order history with status (Placed → Ready for collection → Collected/Completed → Cancelled/Refunded), tracked per supplier within a multi-supplier order
- **Automatic, per-item refund** if one supplier in a multi-supplier order can't fulfil their part
- Order cancellation within a defined cutoff with automatic refund
- In-app/in-browser collection verification (QR code or one-time PIN)
- Re-order shortcut (repeat a previous basket)
- Digital receipt / order invoice download

### 10.5 Trust & engagement
- Ratings & review of supplier after collection
- Supplier response to reviews (portal-side)
- **Referral codes** — invite a friend, both earn Findi Points (§9)
- **Findi Points** balance, earning history, and (later) redemption/donation
- **"My Impact" personal dashboard** — the customer's cumulative footprint on Findi, shown on their profile: money saved, local businesses supported, food rescued, families helped (via Feed It Forward), schools/organisations supported (via Fundraising) — the personal counterpart to the platform-wide figures in §4
- Push notifications (app) / email notifications (web): order status changes, new deals near me, collection window reminders, expiring favourites

### 10.6 Support
- In-app/site help centre & FAQ
- Contact/support form, WhatsApp community links
- Order-specific "Report an issue" flow feeding into Admin's dispute queue

---

## 11. Supplier features (portal.findi.co.za)

### 11.1 Onboarding
- Supplier applies under a tier — Farmer, Local Business, Community Seller, or Rescue Partner — with tier-specific application questions (Community Sellers answer the five questions in §5.8)
- Supplier sign-up: business name, registration/ID details, categories applied for, location(s), banking details for payout, proof of address/food-handling compliance docs
- **Community Seller applications are reviewed against existing category coverage** (§5.5), not auto-approved
- Status tracking follows the pipeline in §5.2: Application → Pending Review → Approved → Categories Assigned → Login Activated
- Onboarding checklist/wizard, extended to collect banking + compliance info Findi needs for payouts

### 11.2 Listing management
- Create/edit a deal: name, category (must be within the supplier's approved categories, §5.3), photos (multiple), description, unit, original price, discounted price, quantity available, collection window, pickup address, recurrence
- **Request approval for an additional category** — a supplier already active in Flour/Rice/Sugar can ask to add, say, Honey; goes back through category-capacity review (§5.5), not an automatic self-service add
- Duplicate a listing / bulk-relist previous deals
- Pause/unpublish a listing instantly
- Low-stock and expiring-window indicators
- **Feed It Forward settings** — opt into "donate R1 per order" or flag surplus stock as a direct donation (§6.3)

### 11.3 Order handling
- Live incoming-order queue with sound/push notification
- Mark order Ready / Collected / No-show
- View customer collection code/QR to verify at handover
- Cancel an order with reason (auto-refunds the customer for that item only)

### 11.4 Supplier Insights — sales &amp; payouts, Findi Wallet
Suppliers love data — this isn't a bare "supplier dashboard," it's real insight into their own business on Findi. Findi collects the customer's payment for the whole basket, splits it automatically by supplier the moment the order is placed, and pays out on a **weekly** cycle (see §15.2). Feed It Forward and Fundraising contributions are never part of this split — they route to their own ring-fenced ledgers, not to any supplier's Wallet.

- Sales trends and best-selling products, by day/week/month
- **Repeat customers** and **conversion rate**, alongside the basics
- **Findi Wallet** — running available balance, withdraw, view sales, download statement
- Commission breakdown per order (transparent: gross sale, Findi commission %, net payout)
- Suggested starting commission by tier — see §18 decision 5 for sign-off:

  | Seller type | Suggested commission |
  |---|---:|
  | Findi Farmers | 8–10% |
  | Findi Local Businesses | 10–15% |
  | Findi Community Sellers | 10–12% |
  | Findi Rescue Partners | Negotiated |

- Payout history / statements, downloadable for accounting
- Bank detail management

### 11.5 Reputation
- View and respond to customer reviews
- Rating summary (average, trend) — feeds the Findi Approved Seller criteria (§5.6)

### 11.6 Team & settings *(Phase 2)*
- Invite staff with limited roles (listings-only, orders-only)
- Multi-branch/location support for suppliers with more than one site

---

## 12. Admin features (portal.findi.co.za)

- **Supplier approval queue**: review submitted documents, approve/reject/suspend, message supplier — enforces the pipeline in §5.2
- **Category capacity view**: coverage per category before approving a new seller or a category-add request (§5.3, §5.5)
- **Tier assignment & Findi Approved Seller badge management**
- **Listing moderation**: flag/remove non-compliant listings, enforce category & photo guidelines
- **Order oversight**: search any order, view full timeline across every supplier in a multi-supplier order, manually intervene
- **Dispute/support queue**: with resolution notes and refund authority
- **Commission & finance**: configure commission % by tier/category/supplier, view platform revenue, trigger weekly payout runs to supplier Findi Wallets, export financial reports
- **Feed It Forward ledger**: contributions collected (customer and supplier), ring-fenced balance, disbursement records — kept entirely apart from commission/revenue reporting (§6.4–§6.6)
- **Fundraising administration**: approve fundraising organisations, issue codes, view per-organisation totals/supporters/orders, trigger organisation payouts, generate monthly reports (§7)
- **Local Boxes curation**: build/edit box contents, pricing, refresh schedule (§8)
- **Findi Points administration**: point-earning rules, and later, redemption/donation rules (§9)
- **Analytics & Impact**: customer growth, order volume, GMV, area/heatmap of demand vs. supply, repeat-purchase and conversion trends, **supplier growth**, **category health** (coverage/performance per category, feeds §5.5), **collection performance** (on-time collection / no-show rates), **most popular products**, **top fundraising organisations** (by amount raised), **food saved this month**
- **Content management**: homepage counters (§4), featured suppliers/categories, blog posts, FAQ entries, banners/promos
- **User management**: customer accounts, supplier/fundraising-organisation accounts, Findi staff accounts and role-based permissions
- **Notification/campaign tools** *(Phase 2)*: push a promo or announcement to a segment

---

## 13. Content, legal & trust pages
(mirroring Refreshi's public-site structure, adapted to Findi)

- Home / landing — carries the "Why Buy From Findi?" impact counters (§4) and the "Quality over quantity" line (§5.9)
- Our Story / About Findi
- How It Works (for customers)
- Become a Supplier (explains the four tiers, the category-gating policy, and the application flow)
- Become a Fundraising Partner (explains the code, dashboard, and payout cycle — §7)
- Feed It Forward — the community-giving page (§6), in the spirit of an Impact Report
- Local Boxes overview (§8)
- Categories overview
- FAQs (customer, supplier, and fundraising-organisation sections)
- Blog / news
- Contact us
- Terms & Conditions (customer), Supplier Agreement (includes the category-limit clause, §5.7), and Fundraising Partner Agreement
- Privacy Policy — **POPIA-compliant**
- Cookie Policy
- Food Safety Guidelines — one version for suppliers, one for consumers
- Community Impact / Impact Report page (food saved, CO₂ avoided, meals rescued, money saved, Feed It Forward and Fundraising totals)
- App download links (App Store / Google Play) — persistent header/footer CTA

---

## 14. Notifications & communications

| Channel | Used for |
|---|---|
| Push (mobile app) | Order status, collection reminders, new nearby deals, favourites restocked |
| Email | Order confirmation/receipt, password reset, weekly digest, supplier payout statements, fundraising monthly reports |
| SMS/WhatsApp | OTP verification, collection window reminders, WhatsApp community groups by area |
| In-app/web banner | Admin announcements, promos |

**Findi's WhatsApp Business number: 071 352 4407.** Confirmed by the business owner (2026-08-04) as the number to build all WhatsApp touchpoints above around. Full WhatsApp Business API integration (beyond OTP/notifications) is scoped as an open decision — see §18 decision 17.

---

## 15. Non-functional requirements

### 15.1 Hosting & infrastructure
- Deployed on the existing Ubuntu server (129.232.204.218) alongside twelvewoodenspoons.co.za and torahcanvas.co.za — needs virtual-host/Nginx server-block separation, its own SSL certs, and isolated app processes/ports
- Recommend containerising (Docker) or at minimum separate systemd services + a reverse proxy
- Separate database from the other two sites; regular automated backups
- CDN/image optimisation for product photos

### 15.2 Payments — Findi Payments model
Findi collects the customer's payment (marketplace-escrow model), rather than customers paying each supplier directly. **A single checkout must be able to span multiple suppliers and split the payment automatically from day one** — the same architectural principle extends to Feed It Forward and Fundraising contributions, which must post to their own ledgers from the same transaction.

**Flow:** customer shops across suppliers (optionally attaching a Fundraising code, optionally adding a Feed It Forward contribution) → one payment to Findi → system splits the order by supplier and routes Feed It Forward / Fundraising shares to their own ledgers → supplier Findi Wallet updates instantly → weekly payout run → Findi retains its commission automatically.

**Gateway requirement**: must support split payouts to multiple recipients per order, not just simple card capture (§18 decision 2). A single gateway is the right scope for launch — supporting multiple gateways simultaneously is explicitly deferred (§17).

### 15.3 Compliance
- POPIA (data protection), Consumer Protection Act considerations, food-safety disclaimers (Findi is a facilitator, not the food handler)
- Feed It Forward and Fundraising accounting treatment — confirm with an accountant that both are structured/earmarked so they aren't treated as ordinary business income (§18)

### 15.4 Performance & reliability
- Mobile-first responsive web app, lightweight image delivery, sub-3s load target on 4G
- Uptime monitoring, since this shares infrastructure with two live commercial sites

### 15.5 Design differentiation
- Distinct visual identity — photo-real product cards, a warm "local market" tone, South African-local visual cues
- Original component library/design system — not a reskin of a template

---

## 16. Information architecture — screen inventory (MVP)

**Public site / app (unauthenticated)**
Landing (incl. impact counters) → How It Works → Become a Supplier → Become a Fundraising Partner → Feed It Forward → Local Boxes → Categories → Deal detail (preview) → FAQ → Blog → Contact → Sign up / Log in

**Customer (authenticated)**
Home feed → Search/filter → Category browse → Local Boxes → Supplier storefront → Deal detail → Multi-supplier basket → Checkout (Fundraising code, Feed It Forward toggle) → Payment → Order confirmation → Order history → Collection verification → Profile & settings → Findi Points → Favourites → Reviews given → Personal impact

**Supplier portal**
Login → Tiered onboarding wizard → Dashboard (orders, sales, Wallet balance) → Listings (incl. category-add requests) → Orders queue → Sales & payouts → Findi Wallet → Feed It Forward settings → Reviews → Settings/profile

**Fundraising Organisation portal**
Login → Dashboard (total raised, supporters, orders generated) → Monthly reports → Payout history → Settings/profile

**Admin portal**
Login → Dashboard (platform KPIs) → Supplier approvals, tiers & category assignment → Category capacity view → Listings moderation → Orders/disputes → Finance/commission → Payout runs → Feed It Forward ledger → Fundraising administration → Local Boxes curation → Findi Points rules → Analytics → Content/CMS → User management → Staff/roles

---

## 17. Roadmap

**Architecture-first principle** (from the business owner directly): don't ask the developer to "build an app" — ask them to build a scalable marketplace platform. That means the database and user roles are designed from day one to support different supplier types, fundraising organisations, community giving, curated categories, and multi-supplier orders — **even where a feature's UI only activates in a later phase.** Retrofitting these relationships onto a schema that wasn't built for them is far more expensive than designing them in from the start.

### Phase 1 — MVP (Launch)
- Customer accounts
- Supplier applications and approval (four tiers, category-level approval)
- **Community Sellers actively recruited and onboarded alongside the other three tiers** (moved up from Growth phase per the business owner, 2026-08-04 — was previously schema-only at launch, marketed from Phase 2)
- Products (named, priced, photographed listings)
- Shopping cart (multi-supplier, split payment)
- Payments
- Orders
- **Fundraising codes** (the Fundraising Module ships at launch — see §7)
- Admin dashboard
- Plus, already established as essential: customer/supplier registration, product categories, secure payments, order tracking, supplier dashboards, notifications, reviews & ratings, referral codes

### Phase 2 — Growth
- Supplier referral programme (§5.10)
- Findi Points (earning)
- Feed It Forward — full customer + supplier-facing rollout (ledger foundation is Phase 1, per the architecture-first principle above)
- Featured suppliers
- Local Boxes — even at Phase 2, worth building toward as one of Findi's signature offerings
- Supplier Insights (repeat customers, conversion rate)
- Native mobile apps at full parity
- Butcher category; multi-branch supplier support; supplier staff roles
- Public Impact Dashboard page (§4.1)

### Phase 3 — Expansion
- Corporate ordering
- Community projects
- Delivery partnerships
- Featured supplier subscriptions
- Advanced reporting
- Community events
- AI recommendations
- Findi collection hubs
- Restaurant, household & handmade categories

### Deferred beyond MVP (explicit, to keep costs down and launch sooner)
- Live chat
- AI recommendations *(Phase 3)*
- Complex loyalty tiers *(Findi Points stays simple — earn only — through Phase 2)*
- Auctions
- In-app messaging between customers and suppliers
- Multiple payment gateways *(single gateway for launch — §15.2)*
- Home delivery routing *(Phase 3 covers delivery **partnerships**; building Findi's own routing engine is further out)*
- Advanced advertising management *(Phase 3's "sponsored campaigns" is the simpler version of this)*

---

## 18. Open questions for the business

1. **Blind bag vs. named product** — confirm Findi should be fully named/priced products rather than any mystery-bag option.
2. **Payment gateway** — PayFast / Yoco / Peach Payments / other — must support split payouts to multiple suppliers per order (§15.2).
3. **Collection windows** — fixed daily windows per supplier or supplier-defined flexible windows per listing?
4. **App-first or web-first launch** — sequencing for the pilot timeline.
5. **Confirm the suggested commission tiers** — 8–10% Farmers, 10–15% Local Businesses, 10–12% Community Sellers, negotiated for Rescue Partners (§11.4).
6. **Domain/DNS & SSL** — confirm access to DNS management for findi.co.za.
7. **Category capacity thresholds** — roughly how many quality suppliers is "enough" per category (§5.5).
8. **Who reviews Community Seller applications and category-add requests** — approval criteria weighting, and who makes the call day to day.
9. **Feed It Forward mechanic** — round-up, fixed amounts, or both; opt-in by default, or default-on with an easy opt-out? (§6.2)
10. **Feed It Forward governance** — how recipients/causes are chosen and vetted, how often disbursements happen, and who signs off.
11. **Feed It Forward accounting treatment** — confirm with an accountant how contributions should be earmarked.
12. **Fundraising commission split** — confirm the percentage of Findi's commission allocated to a supporting organisation, and the payout cycle (proposed: monthly).
13. **Fundraising organisation vetting** — who qualifies (schools/churches/clubs only, or broader causes), and who approves new organisations.
14. **Findi Points earning rates** — how many points per Rand spent, per referral, per review — and the eventual redemption/donation exchange rate.
16. **Verified Findi Partner vs. Findi Approved Seller** — are these the same badge (renamed, with updated criteria), or two distinct trust tiers a seller progresses through — Approved Seller at application, Verified Partner after a track record? Affects the data model and storefront UI (§5.6b).
17. **WhatsApp Business API integration scope** — "fully integrate Findi with the WhatsApp API" (business owner, 2026-08-04) needs scoping: OTP/notifications are already planned (§14) — does "fully" mean conversational ordering, customer support over WhatsApp, or something narrower?

*(Resolved: multi-supplier basket + split payment is a firm MVP requirement, not optional — see §15.2. The Fundraising Module ships at MVP per the business owner's explicit Phase 1 list, with its data model designed to scale per the architecture-first principle in §17. Supplier referral reward (decision 15, formerly open) — the business owner's preference (2026-08-04) is a featured listing, confirming the primary option already in §5.10; trigger remains the referred supplier going live, not just applying.)*
