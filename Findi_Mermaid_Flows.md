# Findi Mermaid Flows

Generated from the Findi Feature Specification, updated 29 July 2026.

## 1. Findi Platform Ecosystem

One shared account system and backend serve the public website, customer app, supplier portal, fundraising portal and admin console.

```mermaid
flowchart LR
  G[Guest] --> WEB[www.findi.co.za]
  C[Customer] --> WEB
  C --> APP[Findi Mobile App]
  S[Supplier] --> PORTAL[portal.findi.co.za]
  F[Fundraising Organisation] --> PORTAL
  A[Findi Admin] --> PORTAL
  WEB --> API[Shared Backend / API]
  APP --> API
  PORTAL --> API
  API --> DB[(Findi Database)]
  API --> PAY[Payment Gateway]
  API --> MSG[Email / SMS / WhatsApp / Push]
```

## 2. Customer Discovery to Collection Journey

The customer makes one payment even when the basket contains products from several suppliers.

```mermaid
flowchart TD
  A[Open website or app] --> B[Choose location / suburb]
  B --> C[Browse deals, categories, Local Boxes and suppliers]
  C --> D[View named product and collection details]
  D --> E{Signed in?}
  E -- No --> F[Register / log in]
  E -- Yes --> G[Add item to basket]
  F --> G
  G --> H{Add more suppliers?}
  H -- Yes --> C
  H -- No --> I[Review multi-supplier basket]
  I --> J[Add fundraising code - optional]
  J --> K[Add Feed It Forward contribution - optional]
  K --> L[One secure payment]
  L --> M[Order split into supplier sub-orders]
  M --> N[Receive collection instructions]
  N --> O[Supplier marks Ready]
  O --> P[Collect using QR code or PIN]
  P --> Q[Order completed]
  Q --> R[Review supplier and view personal impact]
```

## 3. Community Seller Application and Category Gating

Approval is category-specific. Findi adds a professional storefront without replacing the seller’s existing WhatsApp or community network.

```mermaid
flowchart TD
  A[Community Seller starts application] --> B[Products, location, status, stock frequency, value to Findi]
  B --> C[Upload identity, banking and compliance documents]
  C --> D[Pending Review]
  D --> E[Admin checks seller quality and reliability]
  E --> F[Admin checks category capacity]
  F --> G{Category already well covered?}
  G -- No --> H[Approve seller]
  G -- Yes --> I{Product is genuinely different?}
  I -- Yes --> H
  I -- No --> J[Reject, waitlist or suggest another category]
  H --> K[Assign approved categories]
  K --> L[Activate portal login]
  L --> M[Seller creates listings only in approved categories]
  M --> N{Requests new category?}
  N -- Yes --> F
  N -- No --> O[Continue trading through Findi and own channels]
```

## 4. Supplier Listing and Order Fulfilment

Supplier actions remain simple while the platform handles payment, commission, refunds and reporting.

```mermaid
flowchart TD
  A[Supplier logs into portal] --> B[Create or duplicate listing]
  B --> C[Choose approved category]
  C --> D[Add photos, product, price, quantity, pickup window]
  D --> E[Publish listing]
  E --> F[Customer places paid order]
  F --> G[Supplier receives order notification]
  G --> H{Can fulfil?}
  H -- Yes --> I[Prepare order]
  I --> J[Mark Ready for Collection]
  J --> K[Verify customer QR / PIN]
  K --> L[Mark Collected]
  L --> M[Net sale credited to Findi Wallet]
  H -- No --> N[Cancel affected item with reason]
  N --> O[Automatic per-item refund]
```

## 5. Multi-Supplier Checkout and Payment Split

The architecture must split one transaction into supplier, commission, donation and fundraising ledger entries from day one.

```mermaid
flowchart TD
  A[Customer basket] --> B[Supplier A items]
  A --> C[Supplier B items]
  A --> D[Supplier C items]
  A --> E[Feed It Forward - optional]
  A --> F[Fundraising code - optional]
  B --> G[One checkout total]
  C --> G
  D --> G
  E --> G
  F --> G
  G --> H[Customer makes one payment to Findi]
  H --> I[Transaction and order created]
  I --> J[Supplier A gross allocation]
  I --> K[Supplier B gross allocation]
  I --> L[Supplier C gross allocation]
  I --> M[Feed It Forward ledger]
  I --> N[Fundraising ledger]
  J --> O[Deduct Findi commission]
  K --> P[Deduct Findi commission]
  L --> Q[Deduct Findi commission]
  O --> R[Supplier A Wallet]
  P --> S[Supplier B Wallet]
  Q --> T[Supplier C Wallet]
  O --> U[Findi revenue ledger]
  P --> U
  Q --> U
```

## 6. Weekly Supplier Payout Cycle

Weekly payouts reduce transaction-level administration while preserving transparent per-order statements and wallet balances.

```mermaid
flowchart TD
  A[Completed supplier sub-orders] --> B[Wallet available balance]
  B --> C[Commission and refunds reconciled]
  C --> D[Weekly payout run]
  D --> E{Bank details valid?}
  E -- Yes --> F[Send supplier net payout]
  F --> G[Record payment reference and status]
  G --> H[Generate supplier statement]
  H --> I[Email statement and update payout history]
  E -- No --> J[Hold payout and alert supplier/admin]
  J --> K[Correct banking details]
  K --> D
```

## 7. Feed It Forward Contribution and Disbursement

Feed It Forward must remain separate from Findi turnover and commission, with recipient, amount, date and approver recorded.

```mermaid
flowchart TD
  A[Customer checkout] --> B{Choose contribution?}
  B -- Round up --> C[Calculate round-up difference]
  B -- Fixed amount --> D[Add R1 / R5 / R10]
  B -- No --> E[No customer contribution]
  C --> F[Feed It Forward ledger]
  D --> F
  G[Supplier setting] --> H{Supplier contribution?}
  H -- R1 per order --> F
  H -- Donate surplus stock --> I[Record in-kind donation]
  F --> J[Ring-fenced cash balance]
  I --> K[Ring-fenced in-kind register]
  J --> L[Admin selects vetted recipient / cause]
  K --> L
  L --> M[Approval and disbursement record]
  M --> N[Recipient / family assisted]
  M --> O[Impact Dashboard updated]
```

## 8. Fundraising Organisation Flow

The supplier share is unaffected; the fundraising amount comes from Findi’s commission.

```mermaid
flowchart TD
  A[School, church, club or approved cause applies] --> B[Admin vets organisation]
  B --> C{Approved?}
  C -- No --> D[Reject or request more information]
  C -- Yes --> E[Create organisation account and unique code]
  E --> F[Organisation shares code with supporters]
  F --> G[Customer attaches code at checkout]
  G --> H[Order completes]
  H --> I[Allocate agreed share from Findi commission]
  I --> J[Organisation fundraising ledger]
  J --> K[Dashboard updates: raised, supporters, orders]
  K --> L[Monthly report]
  L --> M[Monthly payout]
  M --> N[Payout history and audit record]
```

## 9. Admin Operating Flow

A role-based admin console provides one operational view while keeping each financial ledger distinct.

```mermaid
flowchart LR
  A[Admin Dashboard] --> B[Supplier approvals]
  A --> C[Category capacity]
  A --> D[Listing moderation]
  A --> E[Orders and disputes]
  A --> F[Finance and commission]
  A --> G[Weekly payouts]
  A --> H[Feed It Forward ledger]
  A --> I[Fundraising administration]
  A --> J[Local Boxes]
  A --> K[Findi Points]
  A --> L[Analytics and Impact]
  A --> M[Content and users]
  B --> C
  C --> N[Approve tier and categories]
  E --> O[Refund or resolve issue]
  F --> P[Revenue reporting]
  G --> Q[Supplier statements]
  H --> R[Community disbursement]
  I --> S[Organisation payout]
```

## 10. Local Box Creation and Fulfilment

Local Boxes are a curated presentation layer built on the same multi-supplier basket and payment architecture.

```mermaid
flowchart TD
  A[Admin identifies Local Box theme] --> B[Select products from multiple suppliers]
  B --> C[Set box contents, quantity, price and refresh schedule]
  C --> D[Publish Local Box as one customer product]
  D --> E[Customer buys box in one tap]
  E --> F[System expands box into supplier line items]
  F --> G[One payment and automatic split]
  G --> H[Each supplier receives its sub-order]
  H --> I[Products collected through configured collection model]
  I --> J[Box order completed]
```

## 11. Exception, Cancellation and Partial Refund Flow

The platform must refund one supplier’s item without cancelling unrelated items from other suppliers.

```mermaid
flowchart TD
  A[Paid multi-supplier order] --> B{Issue occurs}
  B -- Supplier cannot fulfil item --> C[Supplier cancels affected line]
  B -- Customer cancels before cutoff --> D[Validate cancellation rule]
  B -- Customer reports problem --> E[Admin dispute queue]
  C --> F[Calculate item-level refund]
  D --> F
  E --> G{Resolution}
  G -- Refund --> F
  G -- Replacement / credit --> H[Record agreed remedy]
  F --> I[Reverse supplier allocation and commission as needed]
  I --> J[Refund customer]
  J --> K[Update supplier Wallet and financial ledgers]
  H --> K
  K --> L[Notify customer and supplier]
```

## 12. Architecture-First Roadmap

Build the relationships into the schema now, even when some customer-facing screens activate later.

```mermaid
flowchart LR
  A[Day-one data model] --> B[Supplier tiers and category approvals]
  A --> C[Multi-supplier orders and split ledgers]
  A --> D[Fundraising organisations and codes]
  A --> E[Feed It Forward ledger foundation]
  A --> F[Roles and permissions]
  B --> G[Phase 1: MVP Launch]
  C --> G
  D --> G
  E --> G
  F --> G
  G --> H[Phase 2: Growth]
  H --> I[Community Seller recruitment]
  H --> J[Feed It Forward rollout]
  H --> K[Local Boxes, Points, Insights, apps]
  H --> L[Phase 3: Expansion]
  L --> M[Delivery partners and collection hubs]
  L --> N[Corporate ordering and community projects]
  L --> O[Advanced reporting and recommendations]
```

