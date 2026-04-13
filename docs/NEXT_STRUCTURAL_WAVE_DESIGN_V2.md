Design Document: Next Structural Wave
Version 2.1 — Cleaned Structural Design Draft
Status: Target structural design draft. Uses current code reality, completed refactor progress, and locked source-of-truth decisions. Not a claim that all target behavior is implemented.
Purpose: This document defines the structural direction for the next major wave of the app so future refactors for Ledger, Contacts, Orders, POS, Inventory, and Reports follow one consistent model.

1. What this document is and is not
This document is
a target structural design for the next major wave
grounded in the real current codebase and current refactor progress
intended to guide future implementation order
intended to reduce fragmentation across modules
This document is not
a description of everything already implemented
a final locked schema for every future module
a marketing document
a country-compliance claim
Whenever this document describes a future model, it should be read as:
target decision if the direction is locked
candidate implementation shape if exact schema/fields may still evolve

2. Current reality summary
The current app already has broad module coverage and real local-first persistence.
Already improved
canonical money-posting foundation exists
money-account balance guardrails exist
opening balance now posts as a money movement
balance correction/reconciliation exists
Billing payment flow is centralized and improved
Ledger settlement flow is centralized and improved
Still fragmented
Ledger is not yet the fully enforced canonical AR/AP truth everywhere
Transactions still need stronger party linkage and downstream consistency
Orders, POS, Billing, Ledger, Inventory, and Reports are not yet one coherent operational graph
Products, Inventory, and Orders still need stronger snapshot and movement discipline
Dashboard and Reports still need read-model consolidation
So the app is beyond the early prototype stage, but it is not yet a fully connected SMB operating system.

3. Structural direction to keep
These decisions remain strong and should be kept.
3.1 One business = one workspace
One business should use one workspace, not separate business accounts for retail, services, restaurant, and online selling.
Capabilities and channels should be enabled inside that workspace.
3.2 One shared catalog core
The app should move toward one shared catalog for everything the business sells, while allowing different behavior by item type.
3.3 One order core
All order-like workflows should eventually converge into one order core, with channel and fulfillment metadata layered on top.
3.4 Clear truth ownership by module
Contacts = party identity and history hub
Billing = formal document truth
Ledger = business AR/AP due truth
Transactions = money movement truth
Money Accounts = account register / balance projection
Products = catalog defaults
Inventory = stock movement truth
Orders = order lifecycle truth
POS = fast checkout workflow with durable sale record
Reports/Dashboard = read-model consumers, not truth owners
3.5 Inventory should become movement-owned
Stock should move toward being owned by inventory movements, with current stock exposed as a projection or cache, not a freely edited source of truth.

4. Workspace decision
Current reality
one account acts like one workspace
business type exists as metadata only
no capability model yet
all business types are treated too similarly in the UI and workflow structure
Problem
The current workspace is too generic. Different SMBs need different workflows, but they should not have to create separate accounts for each capability.
Target decision
Use one workspace per business with capability-based behavior inside it.
What should be shared across the workspace
contacts
catalog
inventory pool unless future multi-location logic changes this
transactions
ledger
money accounts
reports
users/permissions
What should vary by capability
home actions
visible workflows
channel options
fulfillment options
terminology
specialized forms and validation
Default capability examples
These are examples, not rigid rules.
Retail workspace: POS, Orders, Inventory, Billing, Ledger
Service workspace: Bookings/Orders, Billing, Ledger, Contacts
Restaurant workspace: POS, Orders, Menu, Billing, Ledger, Inventory if enabled
Online workspace: Orders, Catalog, Billing, Ledger, Inventory if enabled
Mixed workspace: any combination above

5. Shared catalog decision
Current reality
Products currently mix item/service behavior too loosely
no real menu-item or package behavior
no type-aware modifiers/duration logic
no strong category-ID usage everywhere
Problem
The app cannot cleanly support retail, service, restaurant, and mixed businesses with only the current simple product model.
Target decision
Move toward one shared catalog with four main sellable types:
Product
Service
Menu Item
Package / Combo
User-facing naming
User-facing terminology should adapt by context:
Retail: Product
Service business: Service
Restaurant: Menu Item
Package: Bundle or Package
Internal/admin neutral term: Catalog Item
Shared catalog concepts
Every sellable item should support these common ideas:
name
description
category link
active/inactive state
sale price default
tax defaults
images
optional SKU/barcode where relevant
optional channel availability
Candidate fields for future implementation
Do not treat these as fully locked final schema yet. They are the current recommended shape.
item type discriminator
category ID + category label snapshot
price/cost defaults
unit label
tax defaults
channel availability flags
status flags

6. Catalog item type model
Product
Purpose: physical sellable item
Behavior target:
stock tracked
can be sold in POS, Orders, online
price is current catalog default, not historical truth
stock changes should come from inventory movement logic
Service
Purpose: time-based or task-based sellable service
Behavior target:
not stock tracked by default
duration may apply
booking may apply
provider assignment may apply later
may support modifiers or add-ons
Menu Item
Purpose: restaurant/food sellable item
Behavior target:
may track stock or availability depending on setup
modifiers are common
dine-in/takeaway/delivery behavior matters
prep-related metadata may matter later
Package / Combo
Purpose: bundled sellable offer
Behavior target:
package itself does not own independent stock
underlying stock-tracked components should drive stock effects
can contain product/service/menu-item combinations depending on rules
Important note
The exact future schema for these types should remain partially flexible until POS, Orders, and Inventory phases are further along.

7. Order core decision
Current reality
Orders exist but are weakly integrated into payment, due, inventory, and snapshot truth
POS uses a separate checkout path
Orders do not yet carry strong channel/fulfillment meaning
Problem
The app currently has multiple sale/order-like paths that are not unified enough.
Target decision
Move toward one order core that can represent different business entry points through metadata.
Required order-core concepts
These are required concepts, not a final frozen schema.
order ID / number
customer/contact link or walk-in state
channel
fulfillment type
line snapshots
totals snapshot
status lifecycle
links to Billing / Ledger / Transaction / Inventory side effects where applicable
Core channels to support
POS / walk-in
online
phone/chat
booking/calendar
Core fulfillment types to support
pickup
delivery
dine-in
takeaway
service at location
service at customer location
Target role of Order
Orders should own lifecycle truth, not money truth or due truth.

8. Role split between POS, Orders, Billing, Ledger, Transactions
Current reality
These modules still overlap too much in practical business meaning.
Target role split
POS
fast checkout workflow
durable sale/session/receipt workflow later
not the owner of AR/AP or overall money truth
Orders
lifecycle truth for non-instant or tracked selling flows
customer/channel/fulfillment context
not the owner of payment truth
Billing
formal document truth
invoice/receipt/credit note snapshots
allocations at document level
not the final owner of business AR/AP truth
Ledger
canonical business receivable/payable due truth
party balances
settlements
statement/account logic
Transactions
canonical money movement truth
posted/voided money events
source-linked financial movement history
What should stop over time
Billing and Ledger both acting like equal AR/AP truth owners
Orders posting money as if they own financial truth
POS existing only as temporary in-memory checkout without durable sale identity
reports defining their own truth separately from source modules

9. Inventory behavior rules
Current reality
stock still has dual truth pressure between product fields and movement history
Orders do not yet fully integrate with inventory movements
POS creates stock effects, but broader movement discipline is incomplete
Target decision
Inventory should be movement-owned.
Required inventory concepts
opening stock event
stock in
sale out
return
adjustment/correction
source-linked movement metadata
Behavior by item type
Product
stock tracked
reduced by sale/fulfillment according to lifecycle rules
increased by stock-in/returns/adjustments
Service
not stock-tracked by default
capacity/availability is separate from inventory quantity
Menu Item
may be stock-tracked or availability-based depending on setup
restaurant rules may differ from retail item rules
Package
package itself should not become an independent stock truth
stock effects should come from contained stock-tracked items
Important implementation caution
The exact timing of stock reduction for Orders/POS should be finalized during the durable POS sale and order lifecycle phases, not frozen too early here.

10. Restaurant and service specialization
Current reality
The app does not yet support restaurant and service workflows natively enough.
Target decision
Restaurant and service businesses should live inside the same system through item types, channels, fulfillment types, and capability-aware UX.
Restaurant target behaviors
Common examples:
menu presentation instead of generic product language
modifiers
dine-in / takeaway / delivery behavior
later kitchen/prep workflow if needed
Service target behaviors
Common examples:
duration-aware items
bookings/appointments
provider assignment later if needed
at-location vs at-customer fulfillment
Important note
These are target specialization principles, not proof that the current app supports them yet.

11. SMB UX model
Current reality
Setup and home behavior are too generic.
Target decision
The app should ask simpler business questions during setup and use the answers to shape the experience.
Recommended setup questions
What do you sell?
How do customers buy from you?
Which capabilities do you need now?
Examples of capability-driven top actions
These are examples, not hard locked final menus.
Retail: Sell now, Orders, Inventory, Customers
Service: New booking, Customers, Bills, Dues
Restaurant: New sale, Orders, Menu, Dues
Online: Orders, Catalog, Customers, Billing
Mixed: blended top actions based on enabled capabilities
UX principle
Keep the interface simple by showing only what the business is likely to need first, while still allowing a mixed business to enable more advanced workflows later.

12. What to lock now vs what to implement later
Lock now as design direction
one workspace per business
one shared catalog direction
four main sellable item types
one order core direction
clear role split between POS / Orders / Billing / Ledger / Transactions
movement-owned inventory direction
restaurant/service specialization direction
guided SMB setup direction
Do not fully implement yet until earlier core truth phases are stable
full catalog type schema migration
final order-core schema migration
durable POS sale model
final inventory movement timing across all fulfillment types
advanced restaurant/service workflows
final dashboard/report formulas based on the new structural wave

13. Recommended implementation timing
Already progressed
canonical money posting foundation
balance guardrails
opening balance as posted movement
balance adjustment/reconciliation
money-account history and void visibility
Billing payment refactor
Ledger settlement refactor
Recommended next major sequence from current state
Ledger as canonical AR/AP due ledger
Contact linkage expansion across money/due/document/order/POS/EMI
POS settlement-account fix and durable POS sale persistence
Order line snapshots and order-to-billing/ledger/inventory lifecycle
Inventory movement truth and product stock edit removal
Reporting/dashboard read models
Then bring the shared catalog/order-core structural wave into implementation more deeply
Then capability-aware UX and restaurant/service specialization layers
Why not implement the whole structural wave first
Because POS, Orders, Inventory, Ledger, and Transactions still need stronger truth ownership alignment first. Implementing the entire catalog/order/workspace redesign too early would increase rework risk.

14. Final design recommendation
The final app should become:
one business workspace
one shared catalog core
one order core
canonical money movement through Transactions
canonical due truth through Ledger
formal documents through Billing
party identity/history through Contacts
stock truth through Inventory movements
fast checkout through POS with durable sale persistence
unified read models for Dashboard and Reports
Best concise product picture
A simple but powerful SMB operating system where retail, services, restaurant, and online selling can live in one connected business workspace without breaking financial truth.
Important caution
This document should guide future refactors, but it should not be mistaken for current implementation truth. Several core phases still need to land before the full structural wave can be implemented safely.

15. Approval recommendation
Recommendation: Ready for planning use after one final review pass.
Safe to use for
product planning
architecture discussion
dependency ordering
future module design
Not safe to use as
current implementation documentation
final frozen schema contract
release readiness proof
country compliance claim

16. Next action
Use this document as the structural target while continuing the source-of-truth refactor sequence.
Immediate next implementation focus should remain:
Ledger as canonical AR/AP due ledger
then contact linkage expansion
then POS / Orders / Inventory structural wave
Only after those are stronger should the full shared catalog / order-core / capability-driven UX wave be implemented.
