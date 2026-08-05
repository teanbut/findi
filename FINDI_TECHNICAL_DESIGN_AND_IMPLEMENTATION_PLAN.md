# Findi — Technical Design & Implementation Plan
Version 1.0 — 29 July 2026

Companion to `FINDI_FEATURE_SPECIFICATION.md` (v0.6). That document defines **what** Findi does; this one defines **how** to build it — architecture, data model, API surface, core workflows, infrastructure, and a phased implementation plan with concrete milestones. Section numbers below reference the feature spec where relevant (e.g. "§5" = feature spec section 5).

---

## 0. How this document is organised

1. System architecture
2. Recommended technology stack
3. Data model
4. Core workflows
5. API surface
6. Infrastructure & DevOps plan
7. Security & compliance checklist
8. Implementation plan — phased delivery
9. Technical decisions still open

---

## 1. System architecture

Three client surfaces share one backend and one database — this is the same principle as feature spec §1, made concrete:

```
        www.findi.co.za          portal.findi.co.za           Mobile app
     (customer web app)     (supplier / fundraising / admin)   (iOS & Android)
              │                          │                          │
              └──────────────────────────┼──────────────────────────┘
                                          │
                                   Findi API (REST)
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
              PostgreSQL            Background jobs        Object storage
           (single source          (payouts, emails,      (product photos,
             of truth)              image processing)      compliance docs)
                                          │
                              External services: payment
                              gateway, SMS/WhatsApp, email
```

**Hosting reality** (feature spec §15.1): this runs on the same Ubuntu server already hosting twelvewoodenspoons.co.za and torahcanvas.co.za (129.232.204.218). Findi gets its own Nginx server blocks for `www.findi.co.za` and `portal.findi.co.za`, its own Let's Encrypt certificates, and its own containerised process group — sharing only the physical box and Nginx with the other two sites, nothing else. A crash, a bad deploy, or a traffic spike on Findi should not be able to touch the other two sites, and vice versa.

---

## 2. Recommended technology stack

A concrete default, not a mandate — see §9 for what's still genuinely open. The point of naming a stack is to give a developer somewhere to start instead of relitigating every choice.

| Layer | Recommendation | Why |
|---|---|---|
| **Backend API** | Node.js + TypeScript (NestJS) | Matches the sole other realistic candidate (Laravel/PHP) in ease-of-hire terms for a small SA dev market, but TypeScript end-to-end (backend + web + mobile) means one language, one set of shared types for money/order logic — fewer places for a split-payment bug to hide. |
| **Database** | PostgreSQL | This is a relational-integrity-heavy domain — money splits, category-approval constraints, ledger balances that must never be wrong. Not a NoSQL fit. |
| **Customer web app** | Next.js (React) | Server-rendered product/category pages for SEO and fast first load on mobile data — matters given feature spec §15.4's mobile-first, data-conscious performance target. |
| **Supplier / Admin / Fundraising portal** | Same Next.js codebase, `portal.findi.co.za` as a separate route group, or a standalone React SPA sharing the component library | Role-based views (supplier / fundraising org / admin) off one login system, per feature spec §1. |
| **Mobile app** | React Native | Reuses the API client and business logic (especially the split-payment and category-approval logic, which must behave identically everywhere) across iOS and Android from one codebase — realistic for a small team hitting the pilot timeline. |
| **File storage** | S3-compatible object storage (self-hosted MinIO on the same server to start, or an external bucket) | Product photos and supplier compliance docs must survive redeploys and support CDN caching (feature spec §15.1) — never local disk. |
| **Background jobs** | Redis + BullMQ | Weekly payout runs, category-capacity checks, email/WhatsApp sends, image processing — all better as queued jobs than inline request work. |
| **Containerisation** | Docker Compose | One compose file for the whole Findi stack (API, web, worker, Redis) on an isolated Docker network — this is what makes the "isolated from the other two sites" requirement real rather than aspirational. |
| **Reverse proxy** | Nginx (already on the box) | New server blocks for the two Findi subdomains, proxying to the Findi containers; certbot for TLS. |

---

## 3. Data model

Entities grouped by domain, with the relationships that matter. This isn't full DDL — it's the shape a developer needs to start a migration file.

### Identity & suppliers
- **users** — id, email, phone, password_hash, role (`customer` / `supplier` / `fundraising_org` / `admin`), created_at
- **customer_profiles** — user_id, name, addresses[], saved payment method reference
- **supplier_profiles** — user_id, business_name, **tier** (`farmer` / `local_business` / `community_seller` / `rescue_partner` — feature spec §5.1), status (`pending` / `approved` / `rejected` / `suspended`), banking details, compliance docs[]
- **categories** — id, name, parent_id
- **supplier_categories** — supplier_id, category_id, status (`pending` / `approved`), approved_at — **this join table is the mechanism behind feature spec §5.3**: a supplier's listing-creation permission is checked against this table, category by category, not against their tier alone
- **fundraising_organisations** — id, name, type (`school` / `church` / `club` / `ngo`), unique code, status, banking details

### Catalogue
- **listings** — id, supplier_id, category_id, title, description, photos[], unit, original_price, discounted_price, quantity_available, collection_window_start/end, pickup_address, status (`draft` / `active` / `paused`), recurrence_rule
- **local_boxes** — id, name, description, refresh_schedule, active (feature spec §8)
- **local_box_items** — box_id, listing_id, quantity

### Orders & payments
- **orders** — id, customer_id, fundraising_org_id (nullable), status, subtotal, feed_it_forward_amount, total, placed_at
- **order_items** — id, order_id, listing_id, supplier_id, quantity, unit_price, line_total, collection_status — **one order can span multiple suppliers**, each order_item tracks its own collection/refund state independently (feature spec §6.4)
- **payment_splits** — id, order_id, recipient_type (`supplier` / `findi_commission` / `feed_it_forward` / `fundraising_org`), recipient_id, amount, status — this table is what makes the R380-basket worked example (feature spec §11) a real, queryable record rather than a narrative
- **supplier_wallets** — supplier_id, available_balance, pending_balance
- **wallet_transactions** — id, wallet_id, order_id (nullable), type (`sale` / `payout` / `adjustment`), amount, created_at

### Feed It Forward & Fundraising — deliberately separate ledgers
- **feed_it_forward_ledger** — id, source_type (`customer_order` / `supplier_donation`), order_id (nullable), supplier_id (nullable), amount, created_at
- **feed_it_forward_disbursements** — id, recipient, amount, note, approved_by, disbursed_at
- **fundraising_ledger** — id, org_id, order_id, amount, created_at
- **fundraising_payouts** — id, org_id, amount, period_start, period_end, paid_at

These four tables are intentionally never joined into commission/revenue reporting queries. That's the technical expression of feature spec §6.4 and §11.3's ring-fencing requirement — enforce it structurally (separate tables, a reporting layer that only reads `payment_splits.recipient_type = 'findi_commission'` for revenue), not just by convention or a comment in the code.

### Engagement
- **findi_points_transactions** — id, customer_id, type (`purchase` / `referral` / `review` / `redeem` / `donate`), points, order_id (nullable), created_at
- **reviews** — id, order_item_id, customer_id, supplier_id, rating, comment, supplier_reply
- **supplier_referrals** — id, referring_supplier_id, referred_supplier_id, status, reward_type, reward_applied_at (feature spec §5.10)
- **findi_approved_seller_scores** — supplier_id, product_quality, customer_service, fair_pricing, local_focus, reliability, badge_awarded_at (feature spec §5.6)

### Governance
- **audit_log** — id, actor_id, action, entity, entity_id, before, after, created_at — every approval, rejection, category grant, and manual admin intervention writes here. This is what makes "who approved this and when" answerable six months later.

---

## 4. Core workflows

Walking through the workflows that are easy to describe in a feature spec and easy to get subtly wrong in code.

### 4.1 Multi-supplier checkout & split payment (feature spec §11.2)
1. Customer's basket contains order_items from N suppliers.
2. On checkout, calculate: subtotal per supplier, Findi commission per supplier (rate from §7.4's tier table), any Feed It Forward contribution (customer-chosen), any Fundraising allocation (if a code is attached).
3. Single charge to the payment gateway for the full total.
4. On gateway confirmation (webhook, not just the client-side callback — never trust the browser alone for payment confirmation): create the order, order_items, and payment_splits rows in one database transaction. If any part fails, the whole order fails — there's no state where a customer paid but the split wasn't recorded.
5. Each supplier's wallet shows the pending balance immediately; it becomes available balance on the next payout run.

### 4.2 Supplier approval pipeline (feature spec §5.2)
`Application → Pending Review → Approved → Categories Assigned → Login Activated` maps directly to `supplier_profiles.status` plus per-row `supplier_categories.status`. Login/portal access is gated on **both** being true — approved status AND at least one approved category — not on status alone, otherwise an "approved" supplier with zero approved categories could still log in with nothing to do (or worse, a bug lets them list outside their approved categories).

### 4.3 Category-add request (feature spec §5.3, §11.2)
An active supplier requesting a new category creates a new `supplier_categories` row with status `pending` — it goes through the same admin review as a first-time applicant (checking category capacity, feature spec §5.5), not a self-service toggle.

### 4.4 Weekly payout run (feature spec §7.4, §11.2)
A scheduled background job (BullMQ, cron-triggered): for each supplier wallet with a positive pending balance older than the payout cutoff, move pending → available, generate a statement (line items from `wallet_transactions`), and trigger a bank transfer via whatever mechanism the payment gateway or banking integration supports. Same pattern reused for the Fundraising monthly payout (`fundraising_payouts`), on its own schedule.

### 4.5 Feed It Forward contribution
Captured as part of checkout (4.1), written to `feed_it_forward_ledger` with `source_type = 'customer_order'` in the same transaction as the order. Supplier-side donations ("donate R1/order" or "donate surplus stock") write their own `feed_it_forward_ledger` rows with `source_type = 'supplier_donation'`, either per completed order or when a supplier flags stock as donated instead of listing it for sale.

### 4.6 Fundraising code attribution
A code entered at checkout resolves to a `fundraising_organisations.id`, stored on the order. A percentage of Findi's commission (not the supplier's share — feature spec §7.1) on that order writes to `fundraising_ledger`. The org's dashboard totals are a read-only aggregate over this table plus a distinct-customer count for "supporters."

---

## 5. API surface

Grouped by domain rather than listing every route — the shape matters more than the exhaustive list at this stage.

| Group | Covers |
|---|---|
| `/auth` | Register, login, OTP verification, password reset, role-aware session/token issuance |
| `/categories` | Browse categories, admin capacity view |
| `/suppliers` | Application, profile, category-add requests, tier info |
| `/listings` | CRUD (scoped to the supplier's approved categories), search/filter for customers |
| `/local-boxes` | Browse (customer), curate (admin) |
| `/basket`, `/checkout` | Multi-supplier basket state, checkout (payment gateway handoff + webhook receiver) |
| `/orders` | Customer order history, supplier order queue, admin order oversight |
| `/wallet` | Supplier balance, statements, withdraw |
| `/feed-it-forward` | Contribution capture, customer "given back" total, admin ledger & disbursements |
| `/fundraising` | Code lookup/attach, org dashboard, admin org management & payouts |
| `/findi-points` | Balance, earning history, redemption (once live) |
| `/reviews` | Submit, respond, moderate |
| `/admin/*` | Approval queues, tier/category assignment, moderation, analytics, content management |
| `/admin/mail` | findi.co.za mailbox management — list/create/delete mailboxes, read/send within a mailbox (§5a) |

Auth: JWT access token (short-lived) + refresh token, role-based middleware guards on every route group above — a supplier token should be structurally incapable of hitting `/admin/*`, not just blocked by a UI that hides the button.

### 5a. Email hosting & portal-managed mailboxes

Findi's email (`info@findi.co.za`, `melanie@findi.co.za`, etc.) is hosted externally on **domains.co.za (cPanel)** — Findi doesn't run its own mail server. This was a deliberate choice over self-hosting: a self-hosted mail server on the same shared Ubuntu box as twelvewoodenspoons.co.za and torahcanvas.co.za would carry real deliverability risk (a fresh IP has no sending reputation) and a shared-blast-radius risk (a blacklisted IP hurts all three sites), for no real benefit at this scale.

The admin portal fronts two separate external systems, kept structurally distinct:
- **Provisioning** (create/delete a mailbox) — cPanel's UAPI (`Email::add_pop` / `Email::delete_pop`), authenticated with the cPanel hosting account's own credentials (`MAIL_CPANEL_*` env vars). This is a control-plane operation, not something IMAP/SMTP can do.
- **Read/send** (within an existing mailbox) — standard IMAP (read) and SMTP (send), authenticated with that mailbox's own credentials.

`MailAccount` (Prisma) is Findi's record of which mailboxes it manages — address, display name, and the mailbox password **encrypted at rest** (AES-256-GCM, `MAIL_ENCRYPTION_KEY`), decrypted only per-request to open an IMAP/SMTP connection, never logged or returned to the client. All of `/admin/mail/*` is `@Roles('admin')`-gated, same as the rest of the admin console.

---

## 6. Infrastructure & DevOps plan

- **Environments**: local dev → staging (e.g. `staging.findi.co.za`, same server, separate containers/DB) → production. Never test payment-split logic against production data.
- **CI/CD**: build Docker images on push, deploy via SSH + `docker compose pull && up` on the server. No need for Kubernetes at this scale — that's over-engineering for a single-server pilot.
- **Secrets**: `.env` per environment, never committed. Payment gateway keys live server-side only; the client never sees anything beyond a hosted-checkout token.
- **Monitoring**: an uptime check (even a free-tier one) on both subdomains, plus basic error tracking (e.g. Sentry's free tier) — cheap insurance for a server that now runs three commercial sites.
- **Backups**: nightly `pg_dump` to storage off the server itself (not just another folder on the same disk), retained on a rolling window (e.g. 30 days). A server-level failure shouldn't also be a data-loss event.

---

## 7. Security & compliance checklist

Ties directly to feature spec §15.3:

- **POPIA**: consent capture at signup, self-service data export/delete, collect only what's needed for the account/order/compliance purpose stated
- **PCI scope**: card data never touches Findi's own servers — gateway-hosted checkout or tokenisation only, enforced by never having a `card_number` column anywhere in the schema
- **Ledger integrity**: Feed It Forward and Fundraising tables are structurally excluded from revenue/commission reporting (§3 above) — verified with a test that asserts revenue reports sum only `payment_splits` rows where `recipient_type = 'findi_commission'`
- **Password/session hygiene**: bcrypt or argon2 hashing, short-lived access tokens, refresh-token rotation
- **Mailbox credentials** (§5a): mailbox passwords encrypted at rest (AES-256-GCM), never logged or returned in an API response; cPanel provisioning credentials live in server-side env only, never in the database

---

## 8. Implementation plan — phased delivery

### Phase 1 — MVP, broken into milestones

Each milestone assumes it's shippable to staging and reviewable before moving to the next — not a strict waterfall, but a sensible dependency order.

1. **Foundations** — auth & roles, core schema (users, categories, supplier_categories, listings), Dockerised skeleton deployed to staging, CI pipeline working end to end before any feature work
2. **Supplier onboarding & listings** — application flow, the five-stage approval pipeline (§4.2), category-level approval enforcement, listing CRUD scoped to approved categories
3. **Customer discovery & basket** — browse/search/filter, supplier storefronts, multi-supplier basket UI
4. **Checkout & payments** — payment gateway integration (see §9 — gateway choice is still open), split-payment logic (§4.1), Fundraising code attachment, Feed It Forward contribution capture
5. **Admin console** — approval queues, category capacity view, order oversight, commission configuration, dispute/refund tooling
6. **Wallet & payouts** — weekly payout job (§4.4), statements, Fundraising monthly payout
7. **Pilot hardening** — POPIA compliance pass, monitoring/backups live, load-test the checkout path specifically (it's the highest-stakes code path in the app), soft-launch in the Cape Town Northern Suburbs pilot area

### Phase 2 / Phase 3

Lighter-weight by design — these follow feature spec §17's roadmap and shouldn't be over-specified before Phase 1 ships and real usage data exists. Called out as follow-on epics: native mobile app polish, Findi Points earning + redemption, Local Boxes curation tooling, full Feed It Forward customer-facing UI, supplier referral programme, Community Seller active recruitment, Supplier Insights analytics (repeat customers, conversion rate).

### Team & testing

- **Minimum viable team**: one full-stack developer can get to a working pilot with this stack (shared TypeScript across backend/web/mobile reduces context-switching cost); two developers is a more comfortable pace against the pilot timeline.
- **Testing priority**: put automated test coverage first on payment-split math and category-approval logic specifically — these are the two places where a subtle bug either loses someone money or breaks the curation promise the whole positioning rests on. Everything else can lean more on manual QA for a pilot-scale launch.
- **Pre-launch checklist**: a full order end-to-end on staging with a real (test-mode) gateway transaction, a full supplier approval end-to-end, a full payout run end-to-end, before the pilot area goes live.

---

## 9. Technical decisions still open

Distinct from the 15 business decisions in the feature spec (§18) — these are for whoever builds it, though the business owner may want a say in a few:

1. **Backend framework confirmation** — NestJS is the recommendation above; confirm against whatever the actual developer's strongest existing skillset is, since that matters more than the specific framework for a small team hitting a pilot deadline.
2. **Payment gateway — technical validation, not just commercial choice**: feature spec decision #2 already flags that the gateway must support split payouts to multiple recipients. Peach Payments is the most likely fit for marketplace-style split payments among the common South African options, but this needs direct technical confirmation with the provider before it's assumed — don't build against it without a signed-off integration guide in hand.
3. **Mobile approach confirmation** — React Native recommended above; Flutter is a reasonable alternative if the developer already has that expertise.
4. **Object storage** — self-hosted MinIO (keeps everything on the existing server, no new vendor) vs. an external S3-compatible bucket (less ops burden, small recurring cost).
5. **CI/CD tooling access** — assumes GitHub Actions, which assumes the repo is hosted on GitHub; confirm.
6. **Staging environment** — confirm a staging subdomain is acceptable to provision alongside the two production subdomains from day one.
