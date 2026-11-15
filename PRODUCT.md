# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three confirmed roles in one running system:

- **Shopper / PC builder** (Indonesian, online, comparing components). Arrives from a category, a brand, or a search term; needs to judge a part fast and get it into a cart without ceremony.
- **Store operator / admin.** Works a queue: confirm payment, move an order through its status, watch stock and revenue. Sits in front of the console for a session, not a glance.
- **Evaluator (dosen/penguji) and the operator's own portfolio audience.** Reads the console as proof that the system is real: real tables, real triggers, real procedures, real numbers.

## Product Purpose

An Indonesian computer-hardware and gear storefront plus the operations console that runs it. The two halves are one product: what a shopper does on the storefront becomes a row an operator acts on, and what the operator does becomes an auditable event.

Success means: a shopper finds and buys a component without friction, an operator clears a day's queue without hunting, and an evaluator can see within seconds that the data layer is genuinely doing work.

## Positioning

The database is the system of record, not the application. Inventory, orders, status transitions, and audit events live in MySQL tables, triggers, stored procedures, and backup tables (for example the `getcat(cid)` procedure, `tbl_logs` written by `after_orders_insert` / `after_orders_status_update` triggers, `user_info_backup`). The interface is a view onto that machinery rather than the place the truth is kept.

A neighboring store template could copy the layout; it could not truthfully claim the same mechanism.

## Operating Context

- Laravel + Inertia (React) + Tailwind, MySQL 8, running under Docker (nginx + php-fpm + MySQL + phpMyAdmin).
- Two access levels. The storefront is public; the operator console is not. An administrator is a signed-in user whose `users.role` is `admin`, and the whole console — including every route that writes catalogue rows and moves order statuses — requires both `auth` and `admin`. A signed-in customer who asks for it is refused with a 403 rather than redirected, because they have already passed the sign-in page and sending them back would be a lie about why they were stopped.
- A customer's own records are theirs: order history, the account portal, and each order receipt. A receipt is readable by the account that placed it, by the session that placed it as a guest, and by an administrator — and by nobody else.
- One rendering path: a single Inertia/React application. Every route is a page under `resources/js/Pages`; `resources/views` holds only the root template and the framework-rendered error sheets. Navigation is client-side, with each page delivered as its own lazily-loaded chunk.
- Product photography is placeholder. The images are third-party stock references matched to a product's group, not to the individual product, and the interface says so wherever a photograph could be mistaken for the item itself. Replacing them with owned catalogue photography is outstanding work.
- Indonesian language, Indonesian rupiah, Indonesian shipping and payment vocabulary (COD, transfer bank, QRIS, kartu kredit).
- Order lifecycle observed in live data: pending, processing, completed, cancelled.
- Cart lives in the database per user; checkout writes an order plus order items.
- Current catalogue in the dev database: roughly 185 products across 5 categories, 20 users, 60 orders, with a seeded brand list.

## Capabilities and Constraints

**Confirmed and working:** storefront with category / brand / search / sort / pagination, product detail, cart, checkout, order success, order history, user profile portal, newsletter subscribe, login / register / logout, admin console over dashboard / products / categories / orders / users, order status update, activity log reader.

**Constraints:**
- Existing stack and route names stay; the redesign is presentation and interaction, not a rewrite of the domain.
- Must keep running under the existing Docker setup and the existing build (`npm run build`).
- Rupiah amounts and Indonesian copy stay Indonesian.
- No new payment gateway, no real shipping integration, no invented commercial claims (no fake testimonials, certifications, or partner logos).

**Deliberately undecided:** whether any real-time or streaming behaviour is added to the console.

**Legacy, not part of the product:** the academic learning modules reachable at `/pyramid`, `/tps`, `/oas`, `/mis`, `/iss`, `/matrix`, `/quiz`, `/hardware`, `/software` and their quiz-result pages. They were built for an earlier assignment and are stated by the owner to be unused. They must keep working and must not look broken, but they are not where this product's value lives.

## Brand Commitments

- The owner has explicitly released the names: both "APEX" (store) and "MSI Portal" (learning modules) may be replaced.
- Indonesian is the product's language and is not negotiable.
- The owner's stated bar: **enterprise-ready, with a visual language and concept that is genuinely striking** — not a safe template.

## Evidence on Hand

Real, inspectable material already in the repository and database:

- `msi_db.sql` — the schema dump, including the trigger and procedure definitions.
- Live MySQL data: 185 products with images and specs, 5 categories, a brand table, 60 orders with items, 20 users, `tbl_logs` rows written by triggers.
- Real product photography is **not** on hand: product images are hotlinked from Unsplash. Treat every photograph as a placeholder to be replaced with owned assets. Do not present stock imagery as the store's own catalogue photography.

## Product Principles

1. **The operator's time is the design brief.** Density, scanning, and keyboard reach beat decoration on every console surface.
2. **Numbers must be comparable at a glance.** Money, quantity, status, and time get aligned columns, tabular figures, and one consistent unit treatment.
3. **Show the machinery.** Audit logs, triggers, and procedures are a feature, surfaced as evidence rather than hidden behind an "about" page.
4. **A shopper decides in one screen.** Specs and price carry the decision; nothing decorative delays it.
5. **One system, two temperatures.** Storefront and console are the same product and must read as one designed thing, not two templates that happen to share a domain.

## Accessibility & Inclusion

No product-specific accommodation was confirmed. Hold the standard floor: keyboard-reachable controls, visible focus, contrast that meets WCAG AA for body text, and layouts that survive a 390px viewport without horizontal scrolling.
