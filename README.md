# Findi

*Find local. Save more.*

A curated South African local-food marketplace — see the two planning documents in this repo for the full picture before touching code:

- **`FINDI_FEATURE_SPECIFICATION.md`** (v0.6) — what Findi does: the four-pillar framework, curated marketplace model, Feed It Forward, Fundraising Module, Local Boxes, Findi Points, and the full feature set by audience.
- **`FINDI_TECHNICAL_DESIGN_AND_IMPLEMENTATION_PLAN.md`** (v1.0) — how it's built: architecture, data model, API surface, core workflows, infra plan, and the phased implementation plan this codebase follows.

## Repo layout

```
apps/
  api/      NestJS + TypeScript backend, Prisma/PostgreSQL
  web/      Next.js — one codebase serves both www.findi.co.za (customer
            site) and portal.findi.co.za (supplier/fundraising/admin),
            split by host-based middleware, not a second app
packages/
  shared/   TypeScript types shared between api and web — order shapes,
            checkout DTOs, supplier tiers — so a split-payment or
            category-approval bug can't hide behind two slightly
            different definitions of the same concept
```

## Local development

Prerequisites: Node 20+, Docker (for Postgres + Redis — or point `DATABASE_URL` at a local Postgres install instead).

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

docker compose up -d postgres redis
npm run prisma:migrate   # creates the schema from apps/api/prisma/schema.prisma

npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000 (also serves the portal locally —
                   # see apps/web/middleware.ts for the host-based split)
```

## Where things stand

This is a **foundational scaffold**, not a finished app — see the task list for the honest current state. What's real and working end-to-end in the API:

- Auth (register/login)
- Supplier application → approval pipeline, with **category-level approval enforced at the database and service layer** (not just a UI check) — a supplier cannot list outside categories they're explicitly approved for
- Listing creation (blocked unless the category is approved)
- **Checkout with multi-supplier split-payment logic** — one basket, one payment, split automatically across suppliers, Findi's commission, an optional Feed It Forward contribution, and an optional Fundraising organisation allocation, all written in a single database transaction
- Wallet balances, a weekly-payout method, Feed It Forward and Fundraising ledgers (kept structurally separate from commission revenue), Findi Points, reviews, and an admin read layer

What's stubbed / TODO, deliberately, because it depends on decisions not yet made or work not yet started:

- **Payment gateway integration itself** — checkout assumes payment is already authorised; the actual gateway handoff is open (feature spec §18, decision #2)
- Auth guards / role-based route protection (structure is there, the guard itself isn't wired in yet)
- The web app's actual UI — pages exist as typed shells with TODOs pointing at the API endpoint they call
- Everything server-deployment-related — this repo has never been deployed; see the implementation plan §6 for the intended approach on the shared Ubuntu server, but that needs SSH/DNS access confirmed first

## Commission rates, Fundraising split, Findi Points rates

All placeholder defaults, clearly marked in code (`apps/api/src/orders/commission.service.ts`, `orders.service.ts`, `findi-points.service.ts`) — these are open business decisions (feature spec §18) and must be confirmed before this goes anywhere near real money.
