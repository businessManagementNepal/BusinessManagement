# Design Document: Next Structural Wave

## Version 2.0: Revised with Current Refactor Progress

## One Workspace · One Shared Catalog · One Order Core · Type-Specific Behaviors · Atomic Workflows

**Status**: Target structural design. Foundation work completed; major modules in progress; UI/specialization work future.  
**Date**: April 12, 2026 (Revised)  
**Based on**: Current SOURCE_OF_TRUTH_DECISION_DOCUMENT, real codebase state (as of April 2026), and completed refactor progress.

---

## Changes from Version 1.0

### What Was Kept

- One business = one workspace model (structural direction sound)
- One shared catalog core with type-specific behaviors (direction valid)
- One order core with channel/fulfillment metadata (direction valid)
- Clear role split: Orders/Billing/Ledger/Transactions/POS (direction valid)
- Inventory as movement-owned truth goal (direction valid)
- Restaurant/service specialization strategy (direction valid)
- Context-aware SMB UX approach (direction valid)

### What Was Corrected

- **Money posting phase**: Was described as future work. Actually `PostMoneyMovementUseCase` already exists; `PostBusinessTransactionUseCase` now wraps it.
- **Money account balance**: Described as future guardrail work. Already implemented: direct editing blocked for normal balance; only opening balance and adjustments allowed.
- **Opening balance**: Described as future feature. Already posting as money movement via `saveMoneyAccount`.
- **Balance adjustment/reconciliation**: Described as future. `AdjustMoneyAccountBalanceUseCase` already exists.
- **Ledger settlement**: Already posting Transactions and managing Billing allocations (current, not future).
- **Implementation phase sequence**: Was wrong; canonical posting and balance work already complete. Next phases reordered.

### What Was Softened

- **Schema details for future item types**: Converted from tight schema spec to required concepts + candidate fields.
- **Order schema specificity**: Changed from exact future schema to key fields + implementation candidates.
- **Workspace capability model**: Converted from rigid enable/disable model to flexible capability hints.
- **Restaurant/Service UX details**: From exact workflows to design principles + examples.

### What Was Updated

- **Current reality sections**: Now accurate to April 2026 codebase state.
- **Future target sections**: Clearly marked as "Not yet implemented" or "Future phase".
- **Implementation timeline**: Reflects actual completed phases; starts from current state, not from scratch.
- **Phase numbering**: Reordered to match real refactor dependency graph.

---

## 1. Executive Summary

This design describes the target structural model for the next wave of the eLekha app, grounded in completed refactor work and the locked source-of-truth decisions.

**What is already done:**

- **Canonical money posting foundation**: `PostMoneyMovementUseCase` exists; all posting paths route through it.
- **Money account balance guardrails**: Direct balance edits blocked; opening balance posts as money movement; reconciliation/adjustment flows exist.
- **Ledger settlement to Transaction linkage**: Ledger settlements post money and create Billing allocations.
- **Billing payment integration**: Billing payments post money and link to Ledger.
- **Boundary between personal/business posting**: One canonical path; both personal and business transactions supported.

**What remains in this wave:**

- **Contact linkage expansion**: Transactions need `contactRemoteId` field; contact detail needs history hub.
- **Catalog item type model**: One catalog with type-aware behaviors (Product/Service/MenuItem/Package).
- **Order core redesign**: Unify POS, Online, Phone, Booking into one Order with channel/fulfillment metadata and durable persistence.
- **POS durable sale**: Persist POS sale entity; fix settlement account bug; make checkout atomic.
- **Inventory movement truth**: Stop Product stock edits; make stock projection derived-only.
- **Workspace capability model**: Enable/disable capabilities per workspace; context-aware UX.
- **Restaurant/Service specialization**: Native menu/modifiers, booking calendar, fulfillment types.
- **Reporting consolidation**: Centralized domain read models replacing independent screen formulas.

**This design is NOT:**

- A claim that everything described is finished.
- A final locked schema for every module (some details will evolve during implementation).
- A marketing roadmap or user-facing announcement.
- A refactor start-from-zero document (builds on completed work).

**This design IS:**

- A structural direction grounded in current codebase and decisions.
- A dependency graph for the next phases.
- A separation of current reality from target design.
- A guide for product vision, system architecture, and module workflow docs.

---

## 2. Current App Reality

### 2.1 Workspace / Account Structure

**Current state**:

- One `Account` entity per user: type is "Personal" or "Business".
- Business accounts have `businessType` (retail, services, restaurant, online, mixed) but this is metadata only, not a structural constraint.
- One account = one workspace; all modules are user-scoped by account.
- No notion of multiple workspaces per user or multiple businesses per account.
- All features are either Business or Personal, not mixed.
- Multi-member access is planned but not yet implemented (user management UI exists).

**Problem**:

- App treats all business types the same structurally; no way to enable/disable capabilities by business type inside one workspace.
- Retail store should not show "Book Service" actions; services business should not show "Online Channel" POS settings; restaurant should not show inventory.
- User confusion: is this a retail system with service features bolted on, or a true multi-capability platform?

### 2.2 Catalog Structure

**Current state**:

- One `Product` table with `kind: "item" | "service"`.
- Products have: `name`, `kind`, `salePrice`, `costPrice`, `stockQuantity`, `categoryName` (string, not ID), `unitLabel`, `skuOrBarcode`, `taxRateLabel`, `description`.
- Product stock can be directly edited AND mutated through Inventory movements.
- No distinction between sellable item types (Product, Service, MenuItem, Package/Combo).
- No fields for: modifiers, duration/booking, channel restrictions, fulfillment type, package contents.
- Products link directly to Orders (via `productRemoteId` in OrderLine) but Orders store no price/tax/name snapshots.

**Problem**:

- Cannot model a food menu item with modifiers (e.g., "Coffee" + size + temperature).
- Cannot model a package/combo (e.g., "Salon Package" = Haircut + Styling + Conditioning) without hacking it into one "service item".
- Cannot distinguish whether an item is physical stock or a service booking.
- Product edits mutate historical order line prices; no price-at-time-of-order snapshot exists.

### 2.3 Order Lifecycle

**Current state**:

- `Order` entity with status: Draft, Pending, Confirmed, Processing, Ready, Shipped, Delivered, Cancelled, Returned.
- `OrderLine` stores `productRemoteId` and `quantity` only; no price, tax, or product name snapshot.
- Orders can link to a customer via `customerRemoteId` (Contact link).
- No distinction between order source (walk-in POS, online, phone, dine-in, takeaway, delivery, service booking).
- No fulfillment type metadata (pickup, delivery, dine-in, service-at-home).
- No payment/due lifecycle: Orders call `AddTransactionUseCase` for payment but do not create Ledger due entries or durable payment allocations.
- No inventory reservation or fulfillment workflow.

**Problem**:

- Walk-in POS uses `completePosCheckout` separately; online orders use Orders module separately. No single order core.
- Cannot represent a dine-in order held for table service separate from a takeaway order.
- Cannot represent a service booking with a scheduled appointment time separate from a one-time order.
- Orders have no built-in payment lifecycle; payments are standalone Transactions.
- No way to track which inventory was allocated to which order.

### 2.4 POS Workflow

**Current state**:

- POS cart held in memory (`PosCartLine[]` in datasource).
- `PosSlot[]` array for quick-access slots.
- `completePosCheckout` creates:
  - Billing document (Invoice or Receipt).
  - Transaction for paid amount.
  - Billing allocation.
  - Ledger due entry for unpaid amount.
  - Inventory sale-out movements.
- No durable POS sale table in database.
- Settlement account wired at route level (bug: uses business account ID, not Money Account ID).
- Posting sync can fail after inventory mutation is committed → inconsistent state possible.

**Problem**:

- No durable receipt truth. If app crashes, in-memory cart is lost.
- Inventory mutated before financial settlement complete; inconsistent state if sync fails.
- No POS sale history, revisit, or reprint.
- POS cannot be used for dine-in or phone orders; separate Order workflow required.

### 2.5 Inventory Behavior

**Current state**:

- `InventoryMovement` table with types: StockIn, SaleOut, Adjustment, plus optional reason (damage, expired, lost, etc.).
- Product has `stockQuantity` field (intended as cached projection, but still directly editable via Product editor - **not yet gated**).
- Movements can be manually created in Inventory UI.
- POS checkout creates SaleOut movements.
- Orders do not create movements (future integration).
- Manual Transactions do not trigger inventory movements (expected - money and stock are separate).
- No concept of: opening stock, stock reservation, stock allocation by order, low-stock rules, expiry, batch tracking.
- No distinction between retail item stock vs service availability vs menu item stock.

**Current problem**:

- **Stock truth is dual**: Product.stockQuantity can be directly edited AND changed through movements. No enforcement that movements are authoritative.
- No durable link between Order and inventory movements.
- No low-stock warnings or automated reorder suggestions.
- Cannot prevent overselling cleanly.
- No way to track "which order consumed which stock batch".

**Target** (Not yet implemented):

- Remove direct Product stock editing; only movements can change stock.
- Stock projection recalculated from movements only.
- Product.stockQuantity becomes a cached/computed field, not editable.
- Movements link to Orders and POS sales for traceability.
- Low-stock alerts trigger based on projected stock vs threshold.
- Restaurant/Service items have different stock semantics (availability vs quantity).

### 2.6 Ledger vs Billing Outstanding

**Current state**:

- `BillingDocument` has `status: draft | paid | partially_paid | pending | overdue` and computes `outstandingAmount` from `totalAmount - paidAmount`.
- `BillingDocumentAllocation` records settlements.
- `LedgerEntry` has type: Sale, Purchase, Collection, PaymentOut, Refund, Advance, Adjustment. Can link to `contactRemoteId`, Billing documents, and Transactions.
- **Ledger settlement workflow** (Completed): Ledger settlement creates a Transaction through canonical posting path, maintains Billing allocations per settlement.
- **Billing payment workflow** (Completed): Billing payment posts money through canonical posting path, links to Ledger settlement.
- Ledger entries still group by party name/phone for balance queries; not yet stable contact ID grouping.
- Billing document creation can exist without Ledger due entry (not yet enforced).
- POS checkout creates both Billing and Ledger entries for unpaid/partial sales.
- Orders do not yet create Ledger due entries.

**Current problem** (Partially addressed):

- Billing outstanding and Ledger outstanding still can diverge for cases where Billing exists without Ledger due entry.
- Ledger party balance computation uses name/phone, not stable contact ID.
- No "statement of account" derived cleanly from Ledger.
- Reports still sometimes read Billing totals and Ledger collections independently instead of from centered read models.

**Target** (Not yet implemented):

- Enforced: Every Billing document that creates receivable/payable exposure must feed Ledger due entry.
- Ledger is the canonical AR/AP due source; Billing outstanding is a document projection only.
- Ledger grouping by `contactRemoteId` when available, not by name/phone.

### 2.7 Transaction Posting and Money Account Balance

**Current state (Completed)**:

- `PostMoneyMovementUseCase` exists as the canonical posting path.
- `PostBusinessTransactionUseCase` is now a factory wrapper around `PostMoneyMovementUseCase`.
- Transactions store `sourceModule`, `sourceRemoteId`, `sourceAction`, `idempotencyKey`, `postingStatus` (Posted | Voided), settlement money account fields.
- Manual, Ledger settlement, Billing payment, EMI, POS, and Orders all route through the same use case.
- **Balance guardrails**: Direct `Money Account` balance edits are restricted. Balance can only change via:
  - Opening balance posting (at account creation)
  - Canonical money posting (Transactions)
  - Audited balance adjustment (`AdjustMoneyAccountBalanceUseCase`)
- Opening balance posts as a money movement with source metadata.
- Balance reconciliation/adjustment use case exists with reason and audit trail.
- Transactions still have NO `contactRemoteId` field (next phase).

**Current problem** (To be addressed):

- Transactions not party-linked; cannot answer "what transactions does customer X have?"
- Ledger grouping still uses party name/phone, not `contactRemoteId`.
- Contact history cannot consistently show all linked money movements.

**Target** (Next phase: Contact linkage):

- Add `contactRemoteId` field to Transaction when party-linked.
- Transactions created with party context carry stable contact link.
- Free-text names used only for walk-in/anonymous transactions.

### 2.8 POS/Orders/Billing/Ledger/Transactions Status

**Current state**:

- **POS**: Checkout for walk-in retail, creates Billing + Transaction (via canonical posting) + Ledger (for unpaid) + Inventory effects, cart in memory, completed checkout returns receipt in memory.
- **Orders**: Customer order lifecycle, tracks status, no inventory integration yet, no durable POS sale, payments create standalone Transactions without Ledger due entries.
- **Billing**: Formal documents (Invoice, Receipt), tracks allocation and outstanding, links to Ledger entries and Transactions.
- **Ledger**: Business AR/AP due, settlements create Transactions, links to Billing documents, party grouping by name/phone.
- **Transactions**: Money movements, route through canonical `PostMoneyMovementUseCase`, carry source metadata and settlement account info.

**Current problem**:

- Billing and Ledger both show "outstanding" but source of truth unclear for integrated workflows.
- Orders and POS both represent sales but persistence depth and financial integration differ.
- Transactions created without party linkage (next phase fix).
- Reports cannot distinguish operational sales (POS/Orders) from financial sales (Billing/Ledger) cleanly.
- No durable POS sale record (only in-memory, returned after checkout).

**Target** (Not yet implemented):

- One Order core unifies POS, Online, Phone orders with channel/fulfillment metadata.
- Durable POS sale entity persists checkout record with full lifecycle links.
- Orders link to Ledger due entries when payment required.
- Transactions carry `contactRemoteId` for party history.
- Ledger is canonical AR/AP source; Billing is formal document projection.

### 2.9 Restaurant / Service Specialization

**Current state**:

- Products can be tagged `kind: "service"` but service and retail products live in same table.
- No duration/booking fields.
- No modifier/addon fields.
- No concept of dine-in, takeaway, delivery, service-at-home fulfillment types.
- No appointment scheduling.
- Orders support status but not fulfillment type.
- Inventory applies to all products equally; no "service availability" concept.

**Problem**:

- Restaurant and service businesses cannot use the app natively.
- Cannot distinguish a dine-in order (reserved table, service-at-location) from a retail order (pickup/delivery).
- Cannot book a service appointment with duration and modifiers.
- Cannot model online food ordering with delivery channel and fulfillment tracking.

### 2.10 SMB UX / Setup Model

**Current state**:

- Account creation asks: account type (Personal | Business), business type (if Business) from a list.
- No guided setup to enable capabilities based on business type.
- No capability flags (enableRetail, enableServices, enableRestaurant, enableOnline).
- Home actions are generic; not customized by business type.
- Users see POS button on all screens regardless of business model; no context menu per business type.

**Problem**:

- Retail store sees "Add Service" action but doesn't sell services.
- Restaurant sees Inventory management but doesn't track stock.
- Online seller doesn't know how to set up online channels; no setup UI.

---

## 3. Workspace Decision

### Problem Statement

One business might sell retail items, services, and possibly online. Should each capability use:

- A separate "account" per capability (Retail Account, Service Account, Online Account)?
- One workspace with modes/capabilities enabled/disabled?
- Different business accounts altogether?

Current app: One account = one workspace, no mode/capability distinction.

### Final Decision

**One business = One workspace + One shared catalog + One order core, with capabilities (Retail, Service, Restaurant, Online) enabled/disabled as workspace settings, not separate accounts.**

#### Reasoning

1. **Business coherence**: A local restaurant does retail counter sales, dine-in service, and online delivery. These are one business, not three.
2. **Shared truth**: One contact list, one inventory pool, one ledger for all channels is the user expectation.
3. **Simpler UX**: User logs into one workspace, not multiple accounts for one business.
4. **Shared catalog**: One Product table with type-specific behavior is cleaner than three Product tables.
5. **Reports clarity**: One business dashboard, not three separate dashboards.

#### What is shared across the workspace

- **Contacts**: One customer/supplier list for all channels.
- **Catalog**: One product/service/menu-item/package list.
- **Inventory**: One stock pool (unless explicitly channeled later, e.g., store vs online warehouse).
- **Transactions/Ledger/Money Accounts**: One cash book and one AR/AP ledger for all channels.
- **Users/Permissions**: One permission model for all channels.
- **Reports/Dashboard**: One business dashboard summarizing all channels.

#### What varies by capability

- **Enabled capabilities**: Retail ✓, Services ✓, Restaurant ✓, Online ✗ (user-selected).
- **Home actions**: Retail: [Pos, Orders, Inventory]. Services: [Bookings, Orders, Invoices]. Restaurant: [Pos, Orders, Delivery]. Online: [Orders, Catalog, Shipping].
- **Order channels**: Enabled by capability (POS for Retail/Restaurant, Booking for Services, Online for Online).
- **Fulfillment types**: Enabled by capability (Pickup for Retail, Service-at-Location for Services, Dine-in/Takeaway for Restaurant, Delivery for Online).
- **Inventory visibility**: Retail/Restaurant show inventory; Services/Online show availability calendar.
- **Fields shown**: Create Order, Edit Product, etc. show only fields relevant to enabled capabilities.

#### Workspace onboarding

1. User creates Business account → enters business name, location, currency, tax settings.
2. User selects capabilities: "What do you sell?" → checkboxes: Retail, Services, Restaurant, Online.
3. App enables/disables UI based on capabilities.
4. User invited to add team members with per-capability permissions later.

---

## 4. Shared Catalog Decision

### Problem Statement

Current Products table conflates retail items, services, menu items, and combos. Cannot distinguish stock tracking, modifiers, duration, or channel restrictions without hacking fields into one generic Product.

### Final Decision

**One shared catalog with four type-specific item types (Product, Service, MenuItem, Package), not separate tables. Each type has:**

- **Shared base fields**: name, description, salePrice, costPrice, taxRate, images, active status.
- **Type-specific fields**: stock tracking (Product/MenuItem only), duration (Service only), modifiers (MenuItem/Service only), contents (Package only), channels (all types).
- **Type-specific behavior**: Rules for stock movement, booking, ordering, and fulfillment vary by type.

### Reasoning

1. **One catalog, not four**: Users think "things we sell", not "products vs services vs menu items". Catalog UI shows all four types together.
2. **Flexible queries**: Reports group and filter across types when needed (e.g., "total revenue by all item types").
3. **Shared operations**: Creating, renaming, archiving, and exporting work the same for all types.
4. **Type-specific rules**: Stock validation, modifier validation, booking slot validation only on relevant types.
5. **Implementation simplicity**: One type discriminator in schema, not four separate lookups.

### Shared Catalog Base Schema (All Types)

```
Catalog Item {
  remoteId: string (UUID)
  accountRemoteId: string (business link)
  name: string (required)
  description: string | null
  kind: "product" | "service" | "menu_item" | "package" (type discriminator)
  categoryRemoteId: string | null (link to category by ID, not name)
  categoryName: string | null (human-readable snapshot)
  salePrice: number | null
  costPrice: number | null
  currencyCode: string | null
  taxRateLabel: string | null
  taxRatePercent: number | null
  unitLabel: string | null (e.g., "pcs", "kg", "service", "portion")
  skuOrBarcode: string | null
  images: [{ remoteId, imageUrl, uploadedAt }] | null
  status: "active" | "inactive" | "archived"

  // Channels this item can be sold through
  channels: {
    pos: boolean (can sell through POS, default true for Product/Service)
    online: boolean (can sell online, default false initially)
    booking: boolean (can be booked, default true for Service)
  }

  // Timestamps
  createdAt: number
  updatedAt: number
}
```

### Type-Specific Fields by Kind

#### Kind: "product"

- **Stock tracking**: Yes (inventory movements in/out)
- **Modifiers**: No
- **Duration/booking**: No
- **Fields**:
  - `stockQuantity: number | null` (cached projection, not editable directly)
  - `lowStockThreshold: number | null`
  - `reorderQuantity: number | null`

#### Kind: "service"

- **Stock tracking**: No (availability based on calendar/provider)
- **Modifiers**: Yes (e.g., "Hair Service" + length option)
- **Duration/booking**: Yes (required)
- **Fields**:
  - `durationMinutes: number` (required)
  - `modifiers: [{ remoteId, name, type, options: [{ label, priceModifier }] }]` (optional)
  - `providerIds: [string] | null` (staff/provider assignments)
  - `maxConcurrentBookings: number | null`

#### Kind: "menu_item"

- **Stock tracking**: Yes (quantities per item, but typically small)
- **Modifiers**: Yes (required, e.g., "Coffee" + size option, temperature option)
- **Duration/booking**: No
- **Fields**:
  - `stockQuantity: number | null` (optional; some restaurants don't track)
  - `modifiers: [{ remoteId, name, type, options: [{ label, priceModifier }] }]` (required for most menus)
  - `prepTime: number | null` (minutes to prepare)
  - `availability: { startTime, endTime, days }[] | null` (e.g., "Lunch only 11:30-14:30")

#### Kind: "package"

- **Stock tracking**: No (derived from contents)
- **Modifiers**: Can include modifiers on contained items
- **Duration/booking**: No for typical package; yes if service package
- **Fields**:
  - `contents: [{ catalogItemRemoteId, quantity }]` (required)
  - `discount: number | null` (e.g., 10% off if buy as package)

### UI Display Terminology

The app should call this:

- **Retail context**: "Product Catalog" or "Inventory Items"
- **Service context**: "Services & Appointments"
- **Restaurant context**: "Menu"
- **Online context**: "Shop" or "Product Catalog"
- **Admin context**: "Catalog" (neutral term that includes all four types)

Users should never see "Kind" or "Type" in UI; terminology changes based on context:

- Retail: "Product"
- Service: "Service"
- Restaurant: "Menu Item"
- Package: "Bundle" or "Package"

---

## 5. Catalog Item Type Model

### Item Types and Their Behaviors

#### Item Type: Product (Retail Physical Item)

**Definition**: A physical inventory item sold through POS, orders, or online with tracked stock.

**Stock tracking**: Yes (mandatory)

- Stock reduced by: POS sale, Order fulfillment, Manual sale-out movement
- Stock increased by: Stock-in movement, Return movement

**Modifiers**: No

**Duration/booking**: No

**Channels**: POS, Online, Orders

**Fulfillment types**: Pickup, Delivery, Carrier Shipping (can fulfill in multiple ways)

**Required fields**:

- `name`, `salePrice`, `categoryRemoteId`, `stockQuantity`

**Optional fields**:

- `costPrice`, `unitLabel`, `skuOrBarcode`, `lowStockThreshold`, `reorderQuantity`, `images`, `description`

**Type-specific validations**:

- Cannot save without stock quantity (set to 0 if explicitly don't track stock then use Service variant).
- Sale price must be >= cost price (soft warning only).
- Unit label must match stock unit (e.g., "kg", "pcs").

**Special rules**:

- Stock edits are forbidden; only movements can change stock.
- Low-stock alerts trigger when stock < lowStockThreshold.
- Archived products don't appear in POS or new orders but preserve historical order line links.

---

#### Item Type: Service (Time-Based Service)

**Definition**: An intangible service sold by hour/duration with booking capability.

**Stock tracking**: No

**Modifiers**: Yes (optional; e.g., Service + add-on)

- Example: "Hair Service" (base) + "Premium Color" (modifier) = higher price

**Duration/booking**: Yes (mandatory)

- Duration in minutes (e.g., 60-minute massage).
- Booking creates calendar event; availability constraints per staff.
- Multiple bookings per day allowed up to maxConcurrentBookings.

**Channels**: Booking (calendar), Orders (one-time), Online (if multi-provider)

**Fulfillment types**: Service-at-location, Service-at-customer-location, Live virtual (future)

**Required fields**:

- `name`, `salePrice`, `durationMinutes`, `categoryRemoteId`

**Optional fields**:

- `costPrice`, `modifiers`, `images`, `description`, `providerIds`, `maxConcurrentBookings`

**Type-specific validations**:

- Duration must be > 0.
- If modifiers exist, each option must have a valid priceModifier (can be 0 or negative for discount).
- If providerIds specified, all must exist in Team/User table.

**Special rules**:

- Modifiers are mandatory for some services (e.g., hair length), optional for others (e.g., one-time makeup).
- Service capacity is per provider; one provider can book multiple instances up to maxConcurrentBookings.
- Cancellation or rescheduling changes due date for AR/AP linked to that booking.

---

#### Item Type: MenuItem (Restaurant Menu Item)

**Definition**: A food/beverage item sold in restaurant context with modifiers and optional stock tracking.

**Stock tracking**: Optional (but typical)

- Some restaurants track individual items (e.g., "Grilled Fish"); some don't (e.g., "Fries" made to order).
- If stockQuantity set: treated as Product-like, stock reduced on Order.
- If stockQuantity null: treated as availability only (prepared to order).

**Modifiers**: Strongly recommended (almost all menu items have size/preparation options)

- Example: "Coffee" + Size [Small +0, Medium +50, Large +100 currency units] + Temp [Hot, Iced] = multiple variants
- Modifier options can affect price, preparation time, or just track for kitchen.

**Duration/booking**: No (unless function-menu or reservation-based restaurant)

**Channels**: POS (primary; dine-in/takeaway), Online (delivery), Orders (phone orders)

**Fulfillment types**: Dine-in, Takeaway, Delivery, Catering (service-like fulfillment)

**Required fields**:

- `name`, `salePrice`, `categoryRemoteId`, `modifiers` (list of modifier definitions)

**Optional fields**:

- `costPrice`, `stockQuantity`, `prepTime`, `availability`, `images`, `description`

**Type-specific validations**:

- If modifiers defined: each must have options.
- Modifier options can be locked to specific fulfillment types (e.g., "Customization" option only for Online).
- If `availability` set (e.g., "Lunch only 11:30-14:30"): item not selectable outside those hours.
- Prep time used by kitchen queue system.

**Special rules**:

- Menu items often appear in menu in printed/display order; rank/position is managed separately.
- POS line can bundle multiple modifiers into one sale line (e.g., "Coffee Medium Iced" on one receipt line).
- Menu items can be grouped into "Sections" for UX (Appetizers, Mains, Desserts) internally via category.

---

#### Item Type: Package (Bundle/Combo)

**Definition**: A pre-defined collection of catalog items sold as one unit with optional discount.

**Stock tracking**: No (derived; stock reduces from contained items as order is fulfilled)

**Modifiers**: No (but contained items can have modifiers)

- Order "Haircut Package" (Haircut Service + Hair Product) → each contained item keeps its modifiers in order line.

**Duration/booking**: No (but service-containing packages inherit booking requirement)

**Channels**: All channels of contained items (if 1/2 contents are online-only, package is still online-sellable)

**Fulfillment types**: Varies by contents (if service + product, fulfillment must support both)

**Required fields**:

- `name`, `salePrice`, `contents: [{ catalogItemRemoteId, quantity }]`

**Optional fields**:

- `description`, `images`, `discount`, `costPrice`

**Type-specific validations**:

- Every item in contents must exist and be active.
- Cannot contain another Package (prevent nesting).
- If contents include Service: package inherits booking behavior and duration = sum of services.
- If contents include MenuItem + Product: package can be sold via POS and Online.

**Special rules**:

- Discount applies to package sale line, not individual items.
- Order line shows package as one line item; contained items tracked separately in order detail.
- Stock reduction on package Order: reduce stock from each contained Product/MenuItem, not from Package itself.
- Package can be marked "seasonal" via metadata (Christmas Bundle valid only Dec 20-31).

---

### Summary Table: Item Type Comparison

| Aspect                       | Product                    | Service                       | MenuItem                                    | Package                           |
| ---------------------------- | -------------------------- | ----------------------------- | ------------------------------------------- | --------------------------------- |
| **Stock tracked**            | Yes                        | No                            | Optional                                    | No                                |
| **Modifiers**                | No                         | Optional                      | Yes                                         | No (but item modifiers preserved) |
| **Duration/booking**         | No                         | Yes                           | No                                          | No (unless service in package)    |
| **Primary channels**         | POS, Online, Orders        | Booking, Orders, Online       | POS, Online, Orders                         | All (varies by content)           |
| **Fulfillment**              | Pickup, Delivery, Shipping | Service-at-X                  | Dine-in, Takeaway, Delivery, Catering       | Varies                            |
| **Typical sell context**     | Retail store               | Service business              | Restaurant                                  | Any bundling                      |
| **Reduced by**               | POS/Order/Sell movement    | Calendar booking cancellation | POS/Order/Sell movement + modifier tracking | Component deduction               |
| **Can appear in catalog UI** | Yes                        | Yes                           | Yes                                         | Yes                               |
| **Can be ordered**           | Yes                        | Yes (as service order)        | Yes                                         | Yes                               |
| **Can be billed**            | Yes                        | Yes                           | Yes                                         | Yes                               |

---

## 6. Order Core Decision

### Problem Statement

Current app has separate Order module and POS checkout flow. Walk-in POS, phone orders, online orders, dine-in reservations, and service bookings all use different persistent paths. No single order core that unifies channel and fulfillment metadata.

### Final Decision

**One order core module. All order-like workflows (walk-in POS, phone order, online order, dine-in, takeaway, delivery, service appointment, booking) must be unified into one `Order` entity with:**

1. **Channel metadata**: Where the order came from (POS, Phone, Online, Booking Calendar)
2. **Fulfillment type metadata**: How the order is fulfilled (Pickup, Delivery, Dine-in, Service-at-location)
3. **Type-aware line items**: Each line preserves item type, modifiers, price snapshots
4. **Durable persistence**: Every order, even POS walk-in, is a persisted Order record
5. **Integrated lifecycle**: Status, payment, due, inventory, fulfillment all linked

### Reasoning

1. **One history**: No searching three tables for "what did this customer order?"
2. **Unified reporting**: "Orders by channel", "fulfillment status by type" reports work on one Order core.
3. **Common patterns**: Payment, due, refund, inventory linkage are the same regardless of channel.
4. **DineIn/Takeaway clarity**: One order can support multiple fulfillment types (e.g., "Call ahead, pick up" vs "Dine-in after 2 hours" for same order).

### New Order Core Schema

```
Order {
  remoteId: string (UUID)
  ownerUserRemoteId: string
  businessAccountRemoteId: string
  orderNumber: string (auto-generated, business-scoped)
  orderDate: number (timestamp when order created)
  customerRemoteId: string | null (Contact link, null for walk-in/anonymous)
  customerNameSnapshot: string | null (fallback for walk-in; preserved for historical orders)

  // Channel and fulfillment metadata
  channel: "pos" | "online" | "phone" | "booking_calendar" (where order came from)
  fulfillmentType: "pickup" | "delivery" | "dine_in" | "takeaway" | "service_at_location" | "service_at_customer" (how fulfilled)

  // Fulfillment details per type
  fulfillmentDetails: {
    // For pickup/delivery:
    pickupOrDeliveryAt: number | null (when)
    deliveryAddress: string | null

    // For dine-in/takeaway:
    tableNumber: string | null
    estimatedReadyAt: number | null

    // For service appointments:
    scheduledAt: number | null
    providerRemoteId: string | null
    locationOrRemote: "at_location" | "at_customer" | "virtual" | null

    // General fulfillment notes:
    notes: string | null
  }

  // Order items (line items with full snapshot)
  items: OrderLine[]

  // Order totals snapshot
  totals: {
    itemCountTotal: number
    subtotalAmount: number
    discountAmount: number
    surchargeAmount: number
    taxAmount: number
    grandTotal: number
  }

  // Payment and due
  paidAmount: number (default 0 for draft)
  dueAmount: number (calculated: grandTotal - paidAmount)

  // Status lifecycle
  status: "draft" | "pending" | "confirmed" | "processing" | "ready" | "fulfilled" | "cancelled" | "returned"

  // Links to business system
  linkedBillingDocumentRemoteId: string | null (formal invoice/receipt)
  linkedLedgerDueEntryRemoteId: string | null (AR/AP due entry if unpaid/partial)
  linkedInventoryMovementIds: string[] (which stock reductions belong to this order)
  linkedTransactionIds: string[] (which payments belong to this order)

  // Metadata
  tags: string | null (comma-separated)
  internalRemarks: string | null
  deliveryOrPickupDetails: string | null (legacy, being deprecated in favor of fulfillmentDetails)

  // Timestamps
  createdAt: number
  updatedAt: number
}

OrderLine {
  remoteId: string (UUID)
  orderRemoteId: string (link to Order)

  // Catalog item reference and snapshot
  catalogItemRemoteId: string
  catalogItemKind: "product" | "service" | "menu_item" | "package"
  itemName: string (snapshot for historical orders)
  itemCategoryName: string | null (snapshot)

  // Quantity and pricing snapshot
  quantity: number
  unitPrice: number (price per unit at time of order)

  // Modifiers (if applicable)
  modifiers: [{ name, option, priceModifier }] | null

  // Tax snapshot
  taxRatePercent: number
  taxAmount: number

  // Discount/surcharge per line
  discountAmount: number | null
  surchargeAmount: number | null

  // Line total
  lineTotal: number (quantity * unitPrice + modifiers + tax +/- discount/surcharge)

  // Links to side effects
  linkedInventoryMovementId: string | null (when stock reduced for this line)
  linkedBillingLineItemRemoteId: string | null (which formal invoice line)

  // Fulfillment and notes
  fulfillmentStatus: "pending" | "fulfilled" | "cancelled" | "returned" | null
  notes: string | null

  // Timestamps
  lineOrder: number (position in order)
  createdAt: number
  updatedAt: number
}
```

### Order Channel Model

**Channel** indicates source of order entry:

| Channel              | Entry method             | Typical workflow                                            |
| -------------------- | ------------------------ | ----------------------------------------------------------- |
| **pos**              | POS checkout             | Retail clerk scans items, totals, payment at point-of-sale. |
| **online**           | Online store / website   | Customer browses catalog, adds to cart, checks out online.  |
| **phone**            | Phone call from customer | Staff takes order over phone, enters into app.              |
| **booking_calendar** | Calendar/booking UI      | Customer/staff books appointment; booking becomes order.    |

**Channel determines**:

- Home action visibility (Show POS if channel enabled, hide if not)
- Field display (show fulfillment address for online, table number for dine-in)
- Fulfillment options available (POS → pickup only; Online → delivery/pickup)

### Order Fulfillment Type Model

**Fulfillment Type** indicates how order is delivered/served:

| Fulfillment             | Applies to                 | Behavior                                                                                                              |
| ----------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **pickup**              | Retail, Restaurant, Online | Customer picks up at location; inventory reduced on fulfillment.                                                      |
| **delivery**            | Retail, Restaurant, Online | Delivery to customer address; inventory reduced on fulfillment.                                                       |
| **dine_in**             | Restaurant                 | Food prepared; customer eats at restaurant; inventory reduced on fulfillment. Table number, readiness status tracked. |
| **takeaway**            | Restaurant                 | Food prepared; customer picks up; inventory reduced on fulfillment.                                                   |
| **service_at_location** | Service                    | Service performed at business location; if item is physical, inventory reduced.                                       |
| **service_at_customer** | Service                    | Service performed at customer location; if item is physical, inventory reduced.                                       |

**Fulfillment Type determines**:

- Inventory reduction timing: immediately on order or on fulfillment confirmation?
- Delivery metadata shown (address for delivery; table for dine-in; provider for service).
- Fulfillment status workflow (order ready for pickup vs ready to serve vs ready to dispatch).

### Order Lifecycle States

```
Draft → Pending → Confirmed → Processing → Ready → Fulfilled → [Closed]
                         ↓
                     Cancelled ← Returned ← Fulfilled
```

**Draft**: Customer browsing, items in cart, not yet committed. No stock reduction, no due entry.
**Pending**: Order placed/submitted, awaiting confirmation. Stock optional hold. Ledger due created if payment required.
**Confirmed**: Business accepts order. Stock held/reduced. Billing document created if formal invoice.
**Processing**: Order being prepared/processed. Inventory and due are locked.
**Ready**: Order ready for pickup/delivery or service appointment is ready. No changes allowed.
**Fulfilled**: Order delivered, served, or completed. No further changes.
**Cancelled**: Order cancelled before fulfillment. Inventory returned, due/payment reversed.
**Returned**: Order returned post-fulfillment. Inventory returned, refund posted.

---

## 7. POS / Orders / Billing / Ledger / Transactions Role Split

### Current Confusion

Today the app has overlapping claims:

- **POS** and **Orders** both create sales; unclear which is "the" order truth.
- **Billing** and **Ledger** both show outstanding; unclear which is AR/AP truth.
- **Transactions** are standalone money moves, not tied to orders or sales clearly.

### Final Role Split: The Single Source of Truth per Domain

#### **Orders** = **Order Lifecycle Truth**

- Owns: customer request → confirmed → prepared → fulfilled → payment status.
- Tracks: what was ordered, when, by whom, in what channels, fulfillment type, timeline.
- Responsibility: Order status workflow, line items with price/tax snapshots, fulfillment handoff.
- Does NOT own: Payment truth, AR/AP due truth, formal document truth, inventory truth alone.

#### **Billing** = **Formal Document Truth**

- Owns: formal invoice/receipt/credit note, line items, tax calculation, document numbering, print/export snapshots, payment allocations per document.
- Tracks: what was invoiced, to whom, when, document status (paid/partial/pending).
- Responsibility: Document generation from Order/POS/Ledger, formal legal record, mandatory tax/compliance fields, document-level allocations.
- Does NOT own: Party balance truth (Ledger owns it), overall outstanding truth (Ledger owns it), stock truth (Inventory owns it).

#### **Ledger** = **AR/AP Due Truth**

- Owns: Business receivables and payables, entries by party, settlement matching, party balance, statement of account.
- Tracks: what is owed, by whom, from when, when due, how much collected, how much still outstanding, who settled against what.
- Responsibility: Due entry creation from Order/Billing/POS events, settlement posting, balance aggregation, payment reminders, AR/AP reports.
- Does NOT own: Formal document content (Billing owns it), money movement truth (Transactions own it), stock truth (Inventory owns it).

#### **Transactions** = **Money Movement Truth**

- Owns: Cash/bank/wallet movements, posted amounts, settlement money accounts, posting status (posted/voided), idempotent re-entry, balance effects.
- Tracks: cash in/out, from what source, for what reason, when posted, by whom, reconciliation status.
- Responsibility: Canonical posting path for all modules (Ledger, Billing, POS, Manual, EMI, etc.), balance mutation, posting reversal, settlement account linking.
- Does NOT own: Order status (Orders own it), Due status (Ledger owns it), Document status (Billing owns it), Stock truth (Inventory owns it).

#### **POS** = **Fast Checkout Workflow + Durable Sale Record**

- Owns: Point-of-sale transaction workflow, in-memory cart, payment tendering, durable POS sale/receipt record.
- Tracks: what was scanned/entered, line totals, tender amounts, change, receipt number, staff/till.
- Responsibility: Quick checkout experience, durable POS sale persistence, receipt print/reprint.
- Does NOT own: Inventory truth alone (Inventory movements own it), Order lifecycle (Orders own it if multi-item), Customer balance (Ledger owns it).

### Event Flow: How Modules Interact

#### **Walk-in Paid POS Sale**

```
1. POS checkout (cart build, payment tendering)
   ↓
2. Create durable POS sale record + receipt number
   ↓
3. Create Order record (channel="pos", fulfillmentType auto from POS context)
   ↓
4. Create Billing receipt document (link to Order)
   ↓
5. Post Transaction (money in + money out) → updates money account balance
   ↓
6. Create Billing allocation (POS sale ties to receipt)
   ↓
7. Create inventory sale-out movements + update stock projections
   ↓
8. Mark sale "Posted"
```

#### **Walk-in Unpaid/Partial POS Sale**

```
1-4. Same as paid POS
   ↓
5. Create Ledger due entry (Sale type, Pay direction, unpaid amount)
   ↓
6. Post Transaction for paid portion only
   ↓
7. Create Billing allocation for paid portion
   ↓
8. Create inventory movements
   ↓
9. Mark sale "Posted with due"
```

#### **Confirmed Online Order → Delivered**

```
1. Order placed (channel="online", fulfillmentType="delivery")
   ↓
2. Status: Confirmed
   ↓
3. Create Billing invoice document
   ↓
4. Create Ledger due entry (Sale type, if payment required)
   ↓
5. On payment: Post Transaction + create Billing allocation + create Ledger settlement
   ↓
6. On fulfillment: Create inventory movements + update status to Fulfilled
```

#### **Service Booking → Completed**

```
1. Booking created (channel="booking_calendar", fulfillmentType="service_at_location")
   ↓
2. Status: Pending (awaiting confirmation)
   ↓
3. Business confirms → Status: Confirmed, create Ledger due if prepayment required
   ↓
4. Service performed at scheduledAt time
   ↓
5. Post payment Transaction if paid at service + update Ledger settlement
   ↓
6. Status: Fulfilled
```

### What Each Module Should **Stop** Doing

- **POS**: Stop owning Order lifecycle; every POS sale is now an Order record.
- **Orders**: Stop creating standalone Transactions; every payment goes through Ledger settlement or POS checkout.
- **Billing**: Stop owning AR/AP balance truth; Ledger is the source, Billing is a document projection only.
- **Ledger**: Stop grouping by party name/phone; use contactRemoteId when available.
- **Transactions**: Stop being created without source module and idempotency key; every transaction must be traceable.

---

## 8. Inventory Behavior Rules

### Current Problem

- Stock is both directly editable (bad) and changed through movements (good).
- No distinction between retail product stock, service availability, and menu item stock.
- No rules for: what reduces stock, when, and by what item type.
- No distinction between online and store inventory.

### Final Decision

**Inventory is movement-owned. Product.stockQuantity is a cached projection only updated by the canonical inventory posting path.**

Movement types:

- **Opening**: Initial stock for a new product (one-time).
- **StockIn**: Receiving goods from supplier or internal transfer.
- **SaleOut**: Item sold and delivered/consumed (POS, Order fulfillment).
- **Return**: Goods returned by customer.
- **Adjustment**: Stock correction due to damage, theft, expiry, count mismatch.

### Stock Behavior by Item Type

#### **Product (Retail Item)**

**When stock is reduced**:

- On POS checkout: immediately (sale is final).
- On Order confirmed + fulfillmentType=pickup/delivery: immediately or on fulfillment confirmation (business-configurable).
- On Return: immediately reversed.

**When stock is increased**:

- On StockIn movement: immediately.
- On Return: immediately.
- On Adjustment correction: immediately.

**Stock rules**:

- Cannot oversell: if pending stock < 0, warn or block depending on settings.
- Low stock: if stock < lowStockThreshold, show alert on product list and POS.
- Archive product: historical orders preserve product snapshot; current stock view excludes archived items.

**MVP stock behavior**:

- Product stock reduces immediately on POS or on order create (simple model).
- Adjustments handled through manual Adjustment movements.
- Returned stock added back via Return movements.

**Advanced stock behavior** (later):

- Per-store inventory tracking (main warehouse vs retail location).
- Stock reservation for pending orders (hold stock until confirmed).
- Batch/lot tracking and expiry.
- Cycle count and automated reorder suggestions.

---

#### **Service (Time-Based Service)**

**When "stock" is reduced** (i.e., availability is "consumed"):

- On Service Booking confirmed: one booking slot consumed.
- No traditional stock reduction; capacity is per-provider, per-time-slot.

**When available again**:

- On Booking cancellation: slot freed.
- On Booking completion: no change; slot just becomes history.

**Capacity rules**:

- maxConcurrentBookings limits simultaneous bookings (e.g., one hairdresser can handle 1 client at a time).
- Provider availability calendar blocks out unavailable times.
- No "stock in" for services; availability is provider + schedule.

**Inventory table entry**: Service bookings do NOT create Inventory movements. Availability is managed in service+booking domain only.

---

#### **MenuItem (Restaurant Menu Item)**

**When stock is reduced**:

- On POS order created (dine-in, takeaway, delivery): immediately.
- On Online order confirmed: optionally immediately or on fulfillment confirmation (business choice).

**When stock is increased**:

- On StockIn movement: immediately.
- On Return: immediately (customer returned dish, prep waste, etc.).
- On Adjustment: immediately.

**Stock rules**:

- Many restaurants don't track individual dish stock (cooked to order, ingredient-based).
- If `stockQuantity = null`: not tracked; no inventory reduction on order.
- If `stockQuantity = number`: tracked; reduction applies on order create or fulfillment.
- Low stock warnings relevant only if tracked.

**Prep time**: Not an inventory concept; used by kitchen queue system.

---

#### **Package (Bundle/Combo)**

**Stock reduction**:

- Package itself has NO stock; stock reduces from contained items.
- On Order: reduce each contained Product/MenuItem stock by quantity (if that item tracks stock).
- On Return: increase contained item stock back.

**Example**: "Coffee + Toast Combo"

- When ordered: Coffee stock -= 1, Toast stock -= 1.
- When returned: Coffee stock += 1, Toast stock += 1.
- Package record itself unchanged; it's a catalog definition only.

---

### Stock Rules by Order Fulfillment Type

| Fulfillment Type    | Stock Reduction Timing                         | Notes                                                      |
| ------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| **POS walk-in**     | Immediate                                      | Sale is final; no reversal unless return.                  |
| **Order pickup**    | On order create or confirm (configurable)      | Can reserve stock on confirm, reduce on pickup.            |
| **Order delivery**  | On fulfillment confirmed (not on order create) | Stock held until shipped; reduces when dispatch confirmed. |
| **Dine-in service** | On order create                                | Food consumed immediately; no hold period.                 |
| **Service booking** | No traditional stock reduction                 | Slot capacity managed separately.                          |

---

### Stock Movement Schema

```
InventoryMovement {
  remoteId: string (UUID)
  accountRemoteId: string
  catalogItemRemoteId: string (link to product/menu-item)
  catalogItemKind: "product" | "menu_item" (only these track stock)

  // Snapshot for historical records
  itemNameSnapshot: string
  categoryNameSnapshot: string | null
  unitLabelSnapshot: string | null

  // Movement type
  type: "opening" | "stock_in" | "sale_out" | "return" | "adjustment"

  // Quantity change (can be negative for out, positive for in)
  quantity: number
  deltaQuantity: number (signed; +10 for stock_in, -5 for sale_out)

  // Cost/rate snapshot
  unitCostOrRate: number | null
  totalValue: number | null (quantity * unitCostOrRate)

  // Reason/reference (for adjustments, returns, etc.)
  reason: "damage" | "expired" | "count_correction" | "lost" | "return" | "sale" | null
  remark: string | null (human-readable reason)

  // Links to business events
  linkedOrderRemoteId: string | null (which order caused this stock move)
  linkedPosReceiptNumber: string | null (which POS receipt)
  linkedBillingDocumentRemoteId: string | null

  // Timestamps
  movementAt: number (when movement occurred)
  createdAt: number (when recorded in system)
  updatedAt: number
}

// Cached projection (updated only by inventory posting use case):
Product.stockQuantity: number = sum of all deltaQuantity for this product
```

---

### MVP Inventory Rules Summary

1. **Product, MenuItem stock is movement-owned**. Direct edits to Product.stockQuantity are forbidden.
2. **Stock reduction triggers**:
   - POS: immediately on checkout.
   - Order: on create or fulfillment confirmation (business-configurable).
   - Return: on return processing.
3. **Stock increases**:
   - StockIn movement.
   - Return movement.
   - Adjustment movement.
4. **Service**: No stock reduction; booking slot is the "stock" (capacity-based, not quantity-based).
5. **Package**: No own stock; component deduction only.
6. **Low stock alerts**: Trigger if stock < lowStockThreshold.
7. **Archived products**: Preserve historical references; exclude from active inventory views.

**Implementation guarantee**: Every inventory change must have a record with source metadata (linked order, POS receipt, adjustment reason). No silent stock mutations.

---

## 9. Restaurant / Service Specialization Rules

### Current State

App treats all business types the same; no restaurant or service-specific workflows.

### Final Decision

**Restaurant and service businesses live inside the shared system enabled by:**

1. **Capability flags**: Service/Restaurant businesses have specific capabilities enabled.
2. **Type-aware modifiers**: MenuItems have required modifiers; Services have duration.
3. **Fulfillment types**: Dine-in, Takeaway for restaurant; Service-at-location, Service-at-customer for services.
4. **Channel defaults**: Restaurant defaults to POS + Online; Services default to Booking + Phone.
5. **Home actions**: Restaurant sees [POS, Online Orders, Inventory]; Services see [Bookings, Invoices, Ledger].
6. **Catalog presentation**: Restaurant shows "Menu" not "Products"; Services show "Services" not "Products".

### Restaurant-Specific Rules

#### Enabled Capabilities

- **Channels**: POS (mandatory), Online (optional)
- **Fulfillment Types**: Dine-in, Takeaway, Delivery, Catering
- **Inventory**: Track menu item stock (optional but typical)

#### Menu Item Modifiers (Strongly Recommended)

- Size option: Small, Medium, Large (price modifiers)
- Preparation: Mild, Medium, Spicy (no price change)
- Delivery: Dine-in, Takeaway, Delivery (channel-restrict)
- Temp: Hot, Iced, Room Temp (no price change)

#### Fulfillment-Specific Behavior

**Dine-in Order**:

- Order created with table number and estimated ready time.
- Stock reduced immediately (food consumed at restaurant).
- Ledger due created if pay-later.
- Settlement on dine-in completion or end of service.

**Takeaway Order**:

- Order created with pickup time window.
- Stock reduced on order create or on fulfillment confirmation.
- Receipt generated; customer takes food.
- Settlement simultaneous with receipt (cash-on-pickup typical).

**Delivery Order** (via Online):

- Order created with delivery address.
- Stock reduced on fulfillment confirmation (not immediately).
- Billing invoice generated (formal order record).
- Ledger due if pay-on-delivery or prepayment incomplete.
- Inventory moved to "dispatched" pending delivery confirmation.

**Catering Event**:

- Special order type with event date/time and delivery location.
- Line items are menu items + quantities - modifiers less common.
- Advance deposit typical (prepayment).
- Delivery to customer location.

#### Kitchen Queue Integration

- Menu items have prepTime field.
- POS screen shows order queue grouped by table/takeaway/delivery.
- Kitchen teams pull orders by type.
- Ready status updated; waitstaff notified per fulfillment type.

#### Reporting/Dashboard

- Home card: Today's revenue by fulfillment type (dine-in vs takeaway vs delivery).
- Order timeline: Dine-in average table time, delivery completion rate.
- Menu popularity: Which dishes selling most, trending items.
- Inventory: Which items running low, waste/spoilage rate.

#### MVP Restaurant Features

1. Menu item stock tracking.
2. Dine-in, Takeaway, Delivery fulfillment types.
3. Modifier support on menu items.
4. Ledger due for pay-later dine-in.
5. Receipt printing (standalone, no formal invoice).

#### Advanced Restaurant Features (Later)

1. Table management UI (which tables occupied, status).
2. Kitchen queue system with prep time tracking.
3. Catering event management.
4. Online delivery integration (Swiggy/Zomato/internal).
5. Menu version control (seasonal menus).
6. Multi-location support with shared/separate inventory.

---

### Service-Specific Rules

#### Enabled Capabilities

- **Channels**: Booking Calendar (mandatory), Phone (optional), Online (future)
- **Fulfillment Types**: Service-at-location, Service-at-customer, Virtual (future)
- **Inventory**: Optional; only if service includes products (e.g., salon products sold).

#### Service Modifiers (Optional but Common)

- Duration variant: Express (30min), Standard (60min), Premium (90min) (price varies)
- Add-on: Premium Color (+500), Deep Treatment (+300) (price added)
- Provider selection: Stylist A, Stylist B (availability varies)

#### Fulfillment-Specific Behavior

**In-Salon Appointment**:

- Booking created for appointment date/time.
- Provider (stylist/therapist) assigned.
- Customer travels to location.
- Service performed.
- Payment collected or due created if payment-later.

**At-Home Service**:

- Booking created with customer address.
- Provider travels to location.
- Service performed.
- Payment collected or due created.

**Virtual Service** (future):

- Booking for video call time.
- Meeting link generated and shared.
- Service performed remotely.

#### Booking Slot Management

- Service duration (e.g., 60 minutes) blocks one provider's calendar.
- maxConcurrentBookings: if 1, provider can handle one appointment at a time; if > 1, multiple clients asynchronously.
- Provider availability: defined by work hours + days off + blocked times.
- Auto-confirmation or manual review per setting.

#### Staff/Provider Management

- Services can be assigned to specific staff (providerIds).
- Staff skill/certification matrix maintained separately.
- Staff availability calendar distinct from service inventory.
- Commission tracking per staff member (advanced; future).

#### Cancellation and Rescheduling

- Cancellation by customer: refund if prepaid, due reversal if due created.
- Rescheduling: slot freed, new slot allocated, payment unchanged (if already collected).
- Cancellation by provider: customer notified, rebooking option offered.

#### Reporting/Dashboard

- Home card: Upcoming appointments (next 7 days), cancellation rate, average service rating.
- Staff utilization: Hours booked vs available, income per staff, peak hours.
- Service popularity: Most-booked services, seasonal trends.
- Customer retention: Repeat bookings, churn rate.

#### MVP Service Features

1. Booking calendar UI for 1-3 providers.
2. Service duration and basic modifiers (e.g., 30/60/90 min variants, add-ons).
3. Fulfillment type (at-location vs at-customer).
4. Cancellation/rescheduling.
5. Ledger due for pay-later or deposit-required services.

#### Advanced Service Features (Later)

1. Multi-location support.
2. Commission tracking per staff.
3. Virtual services (live video).
4. Customer ratings and reviews.
5. Automated reminders (SMS/email before appointment).
6. Waitlist management for full slots.

---

### Shared Restaurant/Service Capabilities

#### Appointment/Booking Core

- Both restaurant (table reservation) and services use booking calendar.
- Shared Booking entity for both use cases (future unification).

#### Payment-Later (Ledger Due)

- Both support Ledger due on unpaid orders (restaurant: dine-in bill to be paid; service: appointment prepayment or pay-after).
- Settlement on service completion or collection follow-up.

#### Contact + History

- Restaurant: customer history (orders, preferred table, favorite dishes).
- Service: customer history (appointments, service history, staff preferences).
- Both leverage Contact as party master.

---

## 10. Simplest UX Model for SMB Users

### SMB Setup and Context

**The user is**: a small business owner (restaurant owner, hair salon, retail store, online seller) in Nepal, India, or Bangladesh without deep tech background.

**Their mental model**: "I have a business, I sell things to customers, I need to track money and inventory."

**They don't think about**: Ledger, Orders core, POS vs Orders, Transactions, Channels, Fulfillment types.

### Guided Setup Questions

**Question 1: What is your business name and location?**

- Input: Business name, city, country (default: user's configured region)
- Action: Create Business account, set currency and timezone.

**Question 2: What do you sell?**

- Options: (checkboxes, multiple allowed)
  - ☐ Physical items (retail, e-commerce)
  - ☐ Services (salon, plumber, consultant, trainer)
  - ☐ Food / Beverages (restaurant, cafe, catering)
  - ☐ Mix of above
- Action: Enable/disable capabilities and UX per selection.

**Question 3: How do customers buy from you?**

- Default options per business type:
  - Physical items: ☐ In-person at my store (POS), ☐ Online (website)
  - Services: ☐ Appointments/Booking, ☐ Phone orders
  - Food: ☐ Walk-in counter (POS), ☐ Dine-in service, ☐ Delivery, ☐ Online delivery
- Action: Enable channels in UI; adjust home actions.

**Question 4: What's your typical monthly revenue?**

- Options: < 50K, 50K-500K, 500K-2M, 2M+
- Action: Suggest reporting frequency, data backup schedule (future).

**Question 5: Who else needs access?** (optional)

- Option to invite staff with roles (View-only, Inventory Manager, Billing, Reports).
- Action: Send invite links; set permissions.

### Home Screen Actions by Business Type

**Retail Store** (enabled: Physical items + in-person POS):

```
[New POS Sale] [Current Inventory]
[Pending Orders] [Due Customers] [Today's Revenue]
[Quick Reports]
```

**Restaurant** (enabled: Food + POS + dine-in/takeaway):

```
[New POS Sale] [Bookings/Tables] [Menu]
[Today Dine-in] [Today Deliveries] [Pending Payment]
[Menu Performance]
```

**Salon Services** (enabled: Services + booking calendar):

```
[View Calendar] [New Booking] [Staff Availability]
[Today Appointments] [Pending Payment] [Services] [Staff Income]
```

**Online Store** (enabled: Physical + online channel):

```
[Pending Orders] [Inventory Status] [Catalog]
[Recent Orders] [Pending Shipment] [Revenue] [Customer List]
```

**Mixed Business** (retail + services):

```
[New POS Sale] [New Booking] [New Online Order]
[Pending Actions] [Revenue Summary] [Inventory] [Services]
```

### Navigation Terminology

**Retail / Online**:

- "Products" → catalog list
- "Categories" → organize products
- "Inventory" → stock management
- "Orders" → customer orders
- "Billing" → invoices/receipts
- "Customers" → contact list

**Restaurant**:

- "Menu" → catalog (not "Products")
- "Categories" → sections (Appetizers, Mains, Desserts)
- "Kitchen" → order queue (internal)
- "Tables" → dine-in management
- "Orders" → takeaway/delivery orders
- "Online" → delivery channel orders

**Services**:

- "Services" → catalog (not "Products")
- "Bookings" → appointment calendar
- "Staff" → provider/team member list
- "Customers" → contact list (clients)
- "Invoices" → service invoices

**All**:

- "Money Accounts" → cash/bank/wallet
- "Ledger" → business due (AR/AP)
- "Transactions" → cash movements
- "Customers/Suppliers" → Contacts (party master)
- "Reports" → business summary

### Key Principles for UX

1. **Hide advanced unless needed**: Don't show channel/fulfillment metadata unless user has enabled multiple channels.
2. **Use business language**: "Menu" for restaurant, "Services" for salon, "Products" for others.
3. **Context-aware fields**: Only show fields relevant to enabled capabilities.
4. **Clear next steps**: Home screen shows immediate actions (not history or settings).
5. **No data model exposure**: User never sees "kind", "type", "sourceModule", "channel", "fulfillmentType" in UI; these are internal.
6. **Avoid jargon**: No "Ledger", "Transactions", "Billing allocations", "Import/export" in first 100 screens.

---

## 11. What to Lock Now vs Implement Later

### What to Lock Now (Design-Only, No Implementation Yet)

1. **Workspace model**: One business = one workspace + shared catalog + enabled capabilities.
2. **Catalog item types**: Product, Service, MenuItem, Package with type-specific fields and behaviors.
3. **Order core**: Channel + fulfillment type metadata, durable persistence for all order-like workflows.
4. **Inventory rules by type**: When stock reduces, when increases, by item type and fulfillment context.
5. **Role split**: Orders own lifecycle; Billing owns documents; Ledger owns AR/AP; Transactions own money; POS owns checkout workflow.
6. **Restaurant specialization**: Menu items with modifiers, dine-in/takeaway/delivery fulfillment, kitchen queue.
7. **Service specialization**: Services with duration, modifiers, booking calendar, provider assignment.
8. **SMB UX model**: Setup questions, home actions by business type, context-aware field display.

### What Is Already Complete (Foundation Laid)

1. **Canonical money posting** (COMPLETED - April 2026):
   - `PostMoneyMovementUseCase` already exists and is operational.
   - All modules (Manual, Ledger, Billing, EMI, POS, Orders) route through canonical posting path.
   - Balance is derived from transactions; direct edits are blocked.
   - Opening balance posts as money movement; adjustment use case exists.
   - **Outcome**: Money movement truth established. Next phases build on this.

### What Depends On Earlier Completed Work

2. **Contact linkage expansion** (Phase 1 - NEW STARTING POINT, dependent on completed canonical posting):
   - Add `contactRemoteId` to Transactions for party linkage.
   - Transactions created from Orders, POS, Ledger settlements must carry contact reference.
   - Contact detail page becomes history hub (Orders, Ledger, Transactions, Billing, POS).
   - **BEFORE** implementing Order payment + Ledger settlement linkage.

3. **Ledger as canonical AR/AP** (Phase 2, dependent on Phase 1 contact linkage):
   - Change Ledger grouping from party name/phone to `contactRemoteId`.
   - Make Billing outstanding a document projection only; derive from Ledger.
   - Ensure POS creates Ledger due entries for unpaid/partial sales.
   - Ensure Orders create Ledger due entries when status transitions.
   - **BEFORE** implementing Order lifecycle integrated with Ledger.

4. **Catalog item type model** (Phase 3, can start parallel to Phases 1-2):
   - Extend `kind` discriminator and type-specific fields (modifiers, duration, stock tracking).
   - Type validation and UI handling for Product/Service/MenuItem/Package.
   - **BEFORE** implementing Order core that needs item type awareness.

### Implementation Phase Roadmap

#### **COMPLETED: Canonical Money Posting** (Foundation - April 2026)

- ✅ `PostMoneyMovementUseCase` exists and is operational.
- ✅ `PostBusinessTransactionUseCase` wraps canonical posting.
- ✅ Direct Money Account balance edits blocked; only movements change balance.
- ✅ Opening balance posts as money movement.
- ✅ Balance reconciliation use case with audit trail exists.
- ✅ All modules (Ledger, Billing, POS, EMI, Orders, Manual) route through canonical path.
- **Outcome**: Money movement foundation solid. Phases 1-10 below build on this.

---

#### **Phase 1: Contact Linkage Expansion** (Starting Point - May 2026)

- Add `contactRemoteId` to Transaction entity schema (currently missing).
- Update Transaction creation in all modules (Ledger settlement, Billing payment, POS, Manual, EMI, Orders) to carry contact reference.
- Remove direct name/phone Ledger grouping; migrate to contact ID-based grouping.
- Build Contact detail page as history hub linking Orders, Ledger, Transactions, Billing, POS sales.
- Ensure walk-in/anonymous transactions have walk-in flag instead of contact ID.
- **Duration**: 1-2 weeks
- **Dependencies**: Canonical posting (already complete)
- **Risk**: Data migration needed for existing Transactions without contact linkage.

#### **Phase 2: Ledger as Canonical AR/AP** (After Phase 1)

- Make Billing outstanding a document projection only; derive from Ledger due entries.
- Ensure POS creates Ledger due entries for unpaid/partial sales.
- Ensure Orders create Ledger due entries when status transitions to "Confirmed" or later.
- Update Reports to read AR/AP from Ledger, not Billing tables.
- Fix case where Billing can exist without Ledger due entry (enforce coupled creation).
- **Duration**: 1-2 weeks
- **Dependencies**: Phase 1 (for contact ID-based Ledger grouping)
- **Risk**: Existing Billing-based AR/AP calculations change; double-check reports.

#### **Phase 3: Catalog and Item Type Model** (Can start parallel to Phases 1-2)

- Extend Product schema to include `kind` discriminator and type-specific fields (modifiers, duration, stock tracking, channels).
- Add new Modifier entity if not exists.
- Update Product UI to handle type-specific fields (hide modifiers if Product, show modifiers if MenuItem/Service, show duration if Service).
- Create migration script to backfill existing Products as `kind="product"`.
- Add validation: Product without stock = Service, Service without modifiers = Product.
- **Duration**: 2-3 weeks
- **Dependencies**: None; can proceed independently of Phases 1-2
- **Risk**: UI complexity; need thorough QA on each type.

#### **Phase 4: Order Core Redesign** (After Phases 1-3)

- Extend Order schema: add channel, fulfillmentType, fulfillmentDetails, linkedBillingDocumentRemoteId, linkedLedgerDueEntryRemoteId, linkedInventoryMovementIds.
- Extend OrderLine: add catalogItemKind, modifiers, price/tax snapshots, linkedInventoryMovementId.
- Update Order lifecycle state machine.
- Update Order creation flows (POS, Online, Phone, Booking) to use new schema.
- **Duration**: 3-4 weeks
- **Dependencies**: Phase 3 (for item type awareness), Phase 1-2 (for contact/ledger linkage)
- **Risk**: Major schema change; need data migration and extensive testing.

#### **Phase 5: POS Durable Sale Persistence** (After Phase 4)

- Create PosReadinessCheckout entity (durable sale record).
- Replace in-memory POS cart with persisted state.
- Update `completePosCheckout` to create Order + durable PosCheckout record.
- Fix route-level settlement account bug (use Money Account ID, not Business Account ID).
- Make checkout atomic: either all side effects succeed or none.
- **Duration**: 2-3 weeks
- **Dependencies**: Phase 4 (for Order schema with POS metadata)
- **Risk**: POS is critical workflow; one bug breaks sales. Need extreme care and extended testing.

#### **Phase 6: Inventory Movement Truth** (After Phases 4-5)

- Remove direct Product stock editing UI.
- Implement stock projection from movements only.
- Update all stock mutations to create Inventory movements.
- Add low-stock alerts based on projected stock.
- **Duration**: 1-2 weeks
- **Dependencies**: Phases 4-5 (for Order/POS to generate movement records)
- **Risk**: Breaking existing manual stock edits; need UX change messaging.

#### **Phase 7: Restaurant and Service Specialization** (After Phases 3 + 6)

- Extend Capability model (if not exists) to track enabled business capabilities.
- Add Restaurant-specific UX: Menu presentation, dine-in table management, kitchen queue.
- Add Service-specific UX: Booking calendar, provider assignment, appointment workflow.
- Add Modifier UI: Service modifiers, menu item modifiers, modifier option management.
- **Duration**: 3-4 weeks
- **Dependencies**: Phase 3 (for MenuItem/Service types, modifiers), Phase 6 (for inventory)
- **Risk**: Restaurant/Service features may require domain research; involve SMB users in testing.

#### **Phase 8: Workspace Capability Model and UX** (After Phase 7)

- Implement workspace setup flow: capability selection, home action customization.
- Implement context-aware field display per capability.
- Implement context-aware navigation (terminology change: "Menu" vs "Products").
- Implement capability flag enforcement in API/UI.
- **Duration**: 2-3 weeks
- **Dependencies**: Phase 7 (features to show/hide)
- **Risk**: UX complexity; need comprehensive UX testing.

#### **Phase 9: Reporting Consolidation** (After Phases 2 + 6)

- Move report formulas to centralized domain read models.
- Replace Dashboard calculations with shared read models.
- Replace string-based grouping with ID-based grouping (Party, Product, Category, Account).
- **Duration**: 2 weeks
- **Dependencies**: Phase 2 (Ledger as source), Phase 6 (Inventory as source)
- **Risk**: Reports are high-visibility; double-check formulas against current state.

### Total Estimated Duration

```
COMPLETED: Canonical Money Posting (April 2026)

Phase 1 (Contact Hub): 1-2 weeks    [May 2026]
Phase 2 (Ledger AR/AP): 1-2 weeks   [after 1]
Phase 3 (Item Types): 2-3 weeks     [parallel to 1-2]
Phase 4 (Order Core): 3-4 weeks     [after 1-3]
Phase 5 (POS Durable): 2-3 weeks    [after 4]
Phase 6 (Inventory): 1-2 weeks      [after 4-5]
Phase 7 (Restaurant/Service): 3-4 weeks [after 3+6]
Phase 8 (Workspace UX): 2-3 weeks   [after 7]
Phase 9 (Reporting): 2 weeks        [after 2+6]

Parallel opportunity: Phase 3 during (1→2), then 4-9 sequential.

Minimum sequential path (no parallelization): 18-25 weeks (~4-6 months from May 2026)
With smart parallelization (3 parallel with 1-2): ~14-19 weeks (~3-5 months from May 2026)
```

---

## 12. Recommended Implementation Timing

### Timing Decision

**Design locked now (April 2026).**

**Canonical Money Posting already complete (April 2026) — proceed with downstream phases starting May 2026:**

1. **Phase 1 (Contact Linkage Expansion) - May 2026**:
   - Add `contactRemoteId` to Transactions; migrate Ledger grouping to contact ID.
   - Build Contact detail as history hub.
   - **Duration**: 1-2 weeks. Prerequisite for all downstream work.

2. **Phases 2-3 in Parallel (June 2026)**:
   - **Phase 2** (Ledger as canonical AR/AP): Billing is document projection; Ledger is source.
   - **Phase 3** (Catalog Item Types): Extend Product schema for type-specific behaviors.
   - These can proceed independently while Phase 1 completes.

3. **Phases 4-9 Sequential** (June-Aug 2026):
   - Phase 4: Order core (relies on Phase 3 item types + Phase 1 contact linkage).
   - Phase 5: POS durable sale (relies on Phase 4 order schema).
   - Phase 6: Inventory movement truth (relies on Phases 4-5 order/POS).
   - Phase 7: Restaurant/Service specialization (relies on Phase 3 + Phase 6).
   - Phase 8: Workspace capability model (relies on Phase 7).
   - Phase 9: Reporting consolidation (relies on Phase 2 + Phase 6).

### Rationale

**Why Phase 1 first (Contact Linkage)**:

- Prerequisite for Ledger AR/AP work and downstream Order/POS integration.
- Depends only on already-completed canonical posting.
- Clears blocker for Phases 2-9 to proceed.

**Why Phases 2-3 can start immediately after Phase 1**:

- Phase 2 (Ledger) works on money/AR side; independent of catalog or orders.
- Phase 3 (Item Types) is catalog-only; independent of Phase 2 work.
- Can run in parallel while Phase 4 (Order Core) is being designed/architected.

**Why Phases 4-9 must sequence**:

- Each phase directly depends on previous: Order core needs item types, POS needs Order schema, Inventory needs POS order integration, etc.
- Cannot cleanly parallelize without creating rework risk.

### Risks If Timing Is Wrong

**If Phase 1 skipped or delayed**:

- Phases 2-9 will have incomplete contact/Ledger integration.
- Data inconsistency between Transactions and Ledger grouping.
- Risk: Must rework all downstream work; 2-4 weeks re-integration cost.

**If Phases 2-3 start before Phase 1 complete**:

- Ledger grouping refactor will conflict with Phase 1's contact ID work.
- Catalog might be used by incomplete Order schema assumptions.
- Risk: Integration conflicts; need careful sequencing or rework.

**If Phases 4-9 implemented out of order or in parallel**:

- Order core will define assumptions that Inventory and POS later violate.
- Report formulas will be written before Ledger/Inventory truth is finalized.
- Risk: Cascading rewrites; potential 4-6 weeks delay impact.

---

## 13. Final Design Recommendation

### The Unified Target System

By executing this design fully, the eLekha app becomes:

```
One Workspace per Business
  ├─ One Shared Catalog (Product, Service, MenuItem, Package)
  │   ├─ Stock projected from Inventory movements
  │   ├─ Type-specific behavior (modifiers, duration, stock tracking)
  │   └─ Channel restrictions (which channels can sell which items)
  ├─ One Order Core
  │   ├─ Unified channel/fulfillment model (POS, Online, Phone, Booking)
  │   ├─ Durable line item snapshots (price, tax, modifiers at time of order)
  │   ├─ Lifecycle states (Draft → Confirmed → Fulfilled)
  │   └─ Linked to financial side effects (Transactions, Ledger, Billing)
  ├─ Canonical Money System
  │   ├─ Transactions: all money movements, contact-linked
  │   ├─ Ledger: canonical AR/AP due, party balances, settlement truth
  │   ├─ Billing: formal documents, allocations, projections
  │   └─ Money Accounts: balances derived from movements
  ├─ Type-Aware Inventory
  │   ├─ Move tracking as source of truth
  │   ├─ Retail, Restaurant, Service stock rules
  │   └─ Low-stock alerts and automated reorder
  ├─ Capability-Enabled UX
  │   ├─ Restaurant: Menu, Kitchen Queue, Dine-in Service, Delivery
  │   ├─ Service: Booking Calendar, Provider Assignment, Fulfillment Types
  │   ├─ Retail: POS, Inventory, Online Orders
  │   └─ Online: Catalog, Delivery Channel, Customer Self-Service
  ├─ Contact Linkage Hub
  │   ├─ Party history (Orders, Ledger, Transactions, Billing, POS)
  │   ├─ Opening balance and audit trail
  │   └─ Timeline view of all interactions
  └─ Centralized Reports
      ├─ Cash flow by account and settlement account
      ├─ AR/AP by party with statement
      ├─ Sales by channel, fulfillment, item type
      ├─ Inventory valuation and low-stock
      └─ Service bookings, cancellations, provider utilization
```

### Net Business Impact

- **User**: "I can run my complex multi-capability business (retail + dine-in + online delivery) in one app with one login."
- **Data**: One contact, one inventory pool, one business ledger, one cash book across all channels.
- **Clarity**: Money, due, document, orders, and stock each have one authoritative source. No confusion about "outstanding".
- **Reporting**: One dashboard per business type, one set of reports, no double-counting.
- **Growth**: Add new capability (e.g., online delivery) without restructuring data or creating new account.

### Not Solved By This Design

This design **does not solve**:

- **Country-specific compliance**: Still only configuration support (currency, tax labels). Nepal VAT/PAN, India GST, Bangladesh VAT rules remain future work.
- **Multi-location consolidation**: One workspace = one business, not multi-location chain. Multi-location sharing one inventory or separate inventory per location is future design.
- **Full import/export backup**: Only selected data transfer supported; full restore is future feature.
- **State machine complexity**: Eventual complex state transitions (e.g., refunds, partial deliveries) will need extended state machine; MVP uses simple linear flow.
- **Fulfillment provider integration**: Delivery channel assumes manual tracking; Swiggy/Zomato/Flipkart sync is future.

### Success Criteria For This Design

When fully implemented, verify:

1. ✅ One business account can enable **multiple capabilities** (Retail, Service, Restaurant, Online) from workspace settings without creating separate accounts.
2. ✅ **All order-like workflows** (POS, Online, Phone, Booking) persist as Order records with channel + fulfillment metadata.
3. ✅ **Inventory reduces only from movements**; Product stock is a cached projection; no direct Product stock editing.
4. ✅ **Ledger is canonical AR/AP**; Billing outstanding is a document projection; reports read AR/AP from Ledger only.
5. ✅ **All transactions carry `contactRemoteId`** when party-linked; Transactions posted through canonical money posting path.
6. ✅ **POS creates durable sale records** persisted to database; no loss on app crash.
7. ✅ **Orders include price/tax/modifier snapshots**; historical orders preserve exact line detail at time of sale.
8. ✅ **Restaurant UX** shows "Menu" not "Products"; supports modifiers, prep times, dine-in/takeaway/delivery, kitchen queue.
9. ✅ **Service UX** shows booking calendar, duration selection, provider assignment, service-at-location/at-customer.
10. ✅ **Setup flow** asks "what do you sell?" and "how do customers buy?" then enables appropriate UX/capabilities.

---

## 14. References and Source Documents

- **SOURCE_OF_TRUTH_DECISION_DOCUMENT.md**: Pre-existing architecture and ownership decisions (Ledger, Transactions, Money Accounts, Contacts, Products/Inventory split, Import/Export limited scope).
- **Current codebase as of April 2026**:
  - Workspace: `feature/auth/accountSelection`, `feature/accounts` (Account type: Personal | Business, businessType metadata)
  - Catalog: `feature/products` (Product kind: item | service, stockQuantity field, categoryName string, no modifiers/duration/package)
  - Orders: `feature/orders` (status states, customerRemoteId link, no price/tax snapshots, no channel/fulfillment metadata)
  - POS: `feature/pos` (in-memory cart, completePosCheckout, no durable sale, creates Billing+Transaction+Ledger+Inventory)
  - Inventory: `feature/inventory` (StockIn, SaleOut, Adjustment movements, Product.stockQuantity cached field)
  - Billing: `feature/billing` (Invoice/Receipt documents, allocations, status states, contactRemoteId field)
  - Ledger: `feature/ledger` (AR/AP due entries, party grouping by name/phone, settlement entries, contactRemoteId field)
  - Transactions: `feature/transactions` (money movements, sourceModule metadata, no contactRemoteId, direct balance mutation in use case)
- **Shared constants** and types in `shared/` folder (BusinessType values, TaxMode, RegionalFinance config, Category options, Unit options)

---

## Design Lockdown: Approved

This design document **locks** the structural model for the next wave of eLekha, grounded in completed work and verified against current codebase.

**Foundation (Already Complete)**:

1. ✅ Canonical money posting (PostMoneyMovementUseCase) operational; all modules route through it.
2. ✅ Money account balance guardrails implemented; direct edits blocked; adjustment use case exists.
3. ✅ Ledger settlement to Transaction linkage working.
4. ✅ Billing payment integration complete.

**Approval Requirements Before Starting Phase 1:**

1. This document is reviewed and approved by product and engineering leads.
2. Transaction schema extension for `contactRemoteId` is designed and reviewed.
3. Data migration strategy for existing Transactions (to add contact linkage) is defined.
4. Team capacity confirmed for May 2026 Phase 1 start (Contact Linkage Expansion).

**Next Actions**:

1. Schedule design review with team (target: within 1 week of document creation).
2. Begin Phase 1 implementation immediately after approval (estimated May 2026 start).
3. Phases 2-3 can begin planning/design in parallel with Phase 1 execution.

---

**Document Version**: 2.0 (Revised with Current Refactor Progress)  
**Last Updated**: April 12, 2026  
**Status**: Design-Locked (Ready for Implementation Review)
