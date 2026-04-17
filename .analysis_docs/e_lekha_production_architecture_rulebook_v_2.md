# eLekha Production Architecture Rulebook v2

## Purpose

This document is the **strict production architecture contract** for eLekha.
It defines how every route, factory, screen, feature, workflow, type, helper, adapter, repository, data source, sync path, report, export, and integration must be built.

This rulebook is intentionally stricter than a style guide.
A feature is **not production-grade** unless it follows these rules.

This rulebook is designed to support:

- standard CRUD features
- financial features with strict source-of-truth ownership
- cross-feature workflows such as POS checkout, billing settlement, order fulfillment, and import jobs
- offline-first behavior
- secure local persistence
- high-scale reporting and exports
- future advanced features such as OCR, AI assistance, real-time sync, external integrations, multi-branch operations, and enterprise controls

---

# 1. Core architecture principles

## 1.1 Canonical architectural flow

Every feature must follow this request flow:

`route -> factory -> UI -> viewModel -> useCase -> repository -> dataSource -> database/API/device adapter`

No layer may bypass the layer below it except for tiny local presentation-only helpers.

## 1.2 Purity and ownership

- **Routes choose navigation outcome only.**
- **Factories wire dependencies only.**
- **UI renders state and emits callbacks only.**
- **View models own screen state, form state, and screen-level orchestration only.**
- **Use cases own business actions.**
- **Repositories own feature-facing persistence contracts, mapping, and error translation.**
- **Data sources own raw I/O only.**
- **Adapters wrap device, file, export, notification, OCR, AI, or third-party APIs.**
- **Read models own reporting and aggregation.**
- **Workflow orchestrators own multi-step cross-feature business workflows.**

## 1.3 Source-of-truth ownership

Every domain must have one primary truth owner.

Examples:

- **Transactions** own posted money movement truth.
- **Ledger** owns business receivable/payable due truth.
- **Billing** owns formal printable document truth.
- **Contacts** own party identity truth.
- **Inventory movements** own stock movement truth.
- **Products** own current catalog defaults, not historical pricing truth.
- **POS sale** owns fast-checkout sale truth.
- **Orders** own order lifecycle truth.
- **Read models** own dashboard and report aggregation truth.

No module may silently create a competing business truth.

## 1.4 No silent fallback rule

The system must never invent:

- a business context
- an active account
- a settlement money account
- a user role
- a tax regime
- a payment status
- a ledger status
- a sync status

Missing context must cause explicit recovery, validation failure, or routing to a selector flow.

---

# 2. System architecture layers

## 2.1 Route layer

### Route may contain

- route params
- guard checks
- mode checks
- session/context checks
- navigation callbacks
- factory selection

### Route must not contain

- business validation
- repository imports
- database access
- API calls
- secure storage access
- WatermelonDB queries
- financial calculations
- screen-local business mapping

### Route rule

A route file should be boring.
Its job is to choose *what feature entry to render*.

---

## 2.2 Factory layer

### Factory may contain

- dependency graph creation
- dependency composition across features
- adapter injection
- feature configuration injection
- environment-based wiring
- feature flag gating

### Factory must not contain

- JSX business decisions based on data fetching
- screen-specific form validation
- domain business rules
- database queries directly inside render bodies

### Factory rule

The factory is the **only valid place** to assemble complex screen dependencies.

If one screen depends on Contacts, Accounts, Tax, Products, Billing, and Permissions, the factory wires them.
The UI still receives one clean contract.

---

## 2.3 UI layer

### UI may contain

- JSX
- styles
- animations
- local presentational state
- input rendering
- list rendering
- modal rendering
- empty/loading/error states
- accessibility labels
- test IDs
- tiny presentational formatters local to that file

### UI must not contain

- repositories
- data sources
- database imports
- transport imports
- sync logic
- business truth calculations
- tax policy logic
- settlement rules
- stock mutation rules
- source-of-truth coordination
- report aggregation formulas

### UI rule

UI is **pure presentation**.
It may decide **how to show** something, not **what business truth means**.

---

## 2.4 View model layer

### View model may contain

- screen state
- form state
- loading/error/success states
- hydration effects
- event handler orchestration
- conversion of use case results into UI-friendly state
- composition of multiple screen-specific sub-states
- debounce timing for search or input
- pagination/search/filter state for the current screen

### View model must not contain

- database imports
- direct API calls
- secure storage imports
- raw navigation objects unless injected
- canonical domain truth calculations
- report aggregation shared across the app
- financial posting logic

### View model rule

One screen or one clear user intent should have one view model.

Do not create:

- one giant module-wide view model
- one mega view model for all lists + details + create + edit + delete + export + sync

Allowed:

- a list screen VM
- a details screen VM
- an add screen VM
- an edit screen VM
- a dedicated payment modal VM
- a dedicated split-bill VM

---

## 2.5 Use case layer

### Use case may contain

- one business action
- input validation
- coordination of repository methods
- transaction boundary requests
- domain-level decision making
- typed Result return values

### Use case must not contain

- React hooks
- JSX
- route logic
- direct UI strings unless they are domain-safe error messages
- raw DTO leakage upward
- device platform branching unless it is infrastructure-specific and delegated to an adapter

### Use case rule

One business action = one use case.

Examples:

- `addTransaction`
- `updateTransaction`
- `deleteTransaction`
- `postMoneyMovement`
- `settleLedgerDue`
- `issueInvoice`
- `capturePosSale`
- `applyInventoryAdjustment`
- `generateInstallmentSchedule`
- `exportStatement`

Do not hide unrelated actions in generic submit use cases.

---

## 2.6 Workflow orchestration use case layer

This is a special use-case category for multi-step workflows.

### Orchestrator may contain

- ordered steps across multiple domains
- idempotency handling
- retry strategy
- compensation strategy
- workflow status changes
- audit event emission
- partial failure policy
- pending-posting state transitions

### Orchestrator must not contain

- UI rendering
- direct component state
- raw DB model leakage
- hidden irreversible side effects without workflow status tracking

### Required for

- POS checkout
- billing payment posting
- ledger settlement
- order fulfillment with payment + stock + billing
- import jobs
- export jobs
- AI-assisted multi-step operations
- OCR -> parse -> map -> review -> create flow

### Orchestrator rule

Any workflow touching **more than one source-of-truth domain** must use an orchestration use case.

---

## 2.7 Repository layer

### Repository may contain

- public domain-facing persistence contract implementation
- entity mapping between datasource models/DTOs and domain entities
- error translation from datasource/infrastructure errors into domain errors
- source selection rules such as local-first, remote-first, cache-first
- aggregate consistency rules within the repository boundary
- merge behavior between local and remote sources when that repository owns it
- read-model query delegation when the repository is the correct boundary

### Repository must not contain

- React hooks
- JSX
- UI strings meant for screens
- toast/alert behavior
- direct component state updates
- route logic
- screen-specific formatting
- raw UI option building
- business workflow orchestration across multiple source-of-truth domains unless that repository is explicitly a workflow repository

### Repository contract file rule

The repository contract file must be:

- `<feature>.repository.ts`
- public contract only

It may contain only:

- `export interface <Feature>Repository`
- imports of shared domain/entity/dto/error/result types required by the public contract

It must not contain:

- constructor params
- implementation helpers
- datasource instances
- mapping logic
- private helper functions
- implementation code

### Repository implementation file rule

The repository implementation file must be:

- `<feature>.repository.impl.ts`

It may contain:

- `interface Create<Feature>RepositoryParams`
- repository implementation
- mapping logic
- error translation
- private repository-local helpers

It must not contain:

- React hooks
- screen/view-model logic
- UI imports
- route logic
- implementation params exported publicly unless truly needed elsewhere

### Repository strict responsibility rule

Repository is the only place allowed to:

- translate datasource shapes into domain shapes
- hide local/remote/cache decisions from use cases
- convert infrastructure errors into feature/domain-safe errors

Use cases may decide **what business action happens**.
Repositories decide **how that feature persists/loads data behind the contract**.

## 2.8 Data source layer

### Data source may contain

- raw DB queries
- raw DB writes
- raw API requests
- raw secure storage access
- raw file/device operations
- serialization/deserialization
- model/table access
- native bridge/service calls

### Data source must not contain

- React hooks
- JSX
- screen orchestration
- cross-feature business workflows
- route logic
- UI wording
- domain-level decision making that belongs in a use case
- repository mapping behavior that belongs in the repository

### Data source contract file rule

The datasource contract file must be:

- `<feature>.datasource.ts`

It may contain only:

- `export interface <Feature>Datasource`
- public datasource method signatures
- imports of DTO/entity/result types strictly needed by the contract

It must not contain:

- implementation params
- DB instances
- adapter setup
- helper implementations
- raw queries
- platform branching implementation

### Data source implementation file rule

Datasource implementations must follow one of these patterns:

- `local.<feature>.datasource.impl.ts`
- `remote.<feature>.datasource.impl.ts`
- `memory.<feature>.datasource.impl.ts`
- `device.<feature>.datasource.impl.ts`

They may contain:

- `interface CreateLocal<Feature>DatasourceParams` or equivalent
- DB/API/device calls
- raw infrastructure-specific helpers
- serialization/deserialization helpers

They must not contain:

- view-model logic
- UI strings meant for end users unless returned as raw infra errors to repository translation
- screen orchestration
- aggregate-level business decision logic
- multi-domain workflow coordination

### Data source strict responsibility rule

Datasource performs I/O only.
If the code is deciding business meaning, status transitions, settlement truth, or cross-feature effects, it does not belong in datasource.

### Memory/mock datasource rule

Memory datasource implementations are allowed only for:

- tests
- mocks
- local development prototypes
- demo environments

They must follow these rules:

- never be wired into production factories by default
- never be treated as production persistence
- be clearly named as `memory.<feature>.datasource.impl.ts`
- be removed if unused

If a memory datasource exists but has no test/dev usage, it should be deleted to reduce confusion.

## 2.9 Adapter / gateway layer

Adapters are required for external or platform capabilities.

### Adapter examples

- secure storage adapter
- file export adapter
- print adapter
- share adapter
- notification adapter
- image picker adapter
- OCR adapter
- AI recommendation adapter
- payment-terminal adapter
- webhooks adapter
- external accounting adapter

### Adapter rule

If the capability is not part of the feature domain itself, wrap it in an adapter.
Do not scatter external SDK calls across features.

---

## 2.10 Read-model layer

Read models are not regular feature CRUD.
They exist to answer:

- dashboards
- reports
- KPI widgets
- statements
- exports
- analytics snapshots
- search indexes

### Read model may contain

- denormalized queries
- aggregation formulas
- ID-based joins
- time-bucket logic
- report-friendly shaping

### Read model must not contain

- write-side business mutation logic
- hidden updates to source-of-truth tables
- UI rendering logic

### Read model rule

No dashboard or report may define its own business formula in a screen or view model if that formula is shared elsewhere.

---

# 3. Folder contract

## 3.1 Feature folder blueprint

```text
feature/<feature>/
  data/
    dataSource/
      <feature>.datasource.ts
      local.<feature>.datasource.impl.ts
      remote.<feature>.datasource.impl.ts
      memory.<feature>.datasource.impl.ts
      db/
        <feature>.model.ts
        <feature>.schema.ts
    repository/
      <feature>.repository.ts
      <feature>.repository.impl.ts
      mapper/
        <feature>.mapper.ts
  factory/
    get<Feature>Screen.factory.tsx
    get<Feature>ListScreen.factory.tsx
    getAdd<Feature>Screen.factory.tsx
    getUpdate<Feature>Screen.factory.tsx
  types/
    <feature>.entity.types.ts
    <feature>.state.types.ts
    <feature>.dto.types.ts
    <feature>.error.types.ts
    <feature>.constant.ts
  useCase/
    get<Feature>.useCase.ts
    get<Feature>.useCase.impl.ts
    get<Feature>ById.useCase.ts
    add<Feature>.useCase.ts
    update<Feature>.useCase.ts
    delete<Feature>.useCase.ts
    <specialAction>.useCase.ts
  viewModel/
    <feature>List.viewModel.ts
    <feature>Details.viewModel.ts
    add<Feature>.viewModel.ts
    update<Feature>.viewModel.ts
    <specialFlow>.viewModel.ts
  ui/
    <Feature>Screen.tsx
    <Feature>ListScreen.tsx
    <Feature>DetailsScreen.tsx
    components/
      ...
    testIds.ts
```

## 3.2 Workflow folder blueprint

```text
workflow/<workflow>/
  types/
    <workflow>.types.ts
    <workflow>.error.types.ts
    <workflow>.state.types.ts
  useCase/
    run<Workflow>.useCase.ts
    run<Workflow>.useCase.impl.ts
  repository/
    <workflow>.repository.ts
    <workflow>.repository.impl.ts
  adapter/
    <workflow>.adapter.ts
```

Examples:

- `workflow/posCheckout`
- `workflow/billingSettlement`
- `workflow/orderFulfillment`
- `workflow/importJob`

## 3.3 Read model folder blueprint

```text
readModel/<area>/
  data/
    dataSource/
    repository/
  types/
    <area>.readModel.types.ts
    <area>.query.types.ts
  useCase/
    get<Area>ReadModel.useCase.ts
    export<Area>Report.useCase.ts
```

## 3.4 Contract and implementation file convention

This naming rule is mandatory.

### Public contract files

These files define public contracts only:

- `<feature>.repository.ts`
- `<feature>.datasource.ts`
- `<action>.useCase.ts`
- `<intent>.viewModel.ts`
- `<feature>.adapter.ts`

Public contract files may contain only:

- exported interface contracts
- exported public contract types only if truly necessary
- imports of shared entity/dto/error/result types needed by the contract

They must not contain:

- constructor params
- dependency-injection params
- helper implementations
- hook bodies
- DB/API/platform code
- implementation logic

### Implementation files

These files contain implementation only:

- `<feature>.repository.impl.ts`
- `local.<feature>.datasource.impl.ts`
- `remote.<feature>.datasource.impl.ts`
- `memory.<feature>.datasource.impl.ts`
- `<action>.useCase.impl.ts`
- `<intent>.viewModel.impl.ts`
- `<feature>.adapter.impl.ts`

Implementation files may contain:

- internal params interfaces such as `CreateXParams` or `UseXViewModelParams`
- implementation logic
- private helpers used only in that file

Implementation files must not contain:

- shared entity/state/dto/error contracts that belong in `types/*.ts`
- reusable UI types that belong in `ui.types.ts`
- public contract duplication already defined in the matching `.ts` file

### Params placement rule

All implementation-only params must stay in the `.impl.ts` file.

Examples:

- `CreatePosRepositoryParams`
- `CreateLocalPosDatasourceParams`
- `CreateCompletePosCheckoutUseCaseParams`
- `UsePosCatalogViewModelParams`

These do **not** belong in:

- public contract `.ts` files
- feature `types/*.ts` files

### Public business payload rule

Public business payloads and DTOs still belong in `types/*.ts`, not in `.impl.ts`.

Examples:

- save payloads
- execute input DTOs
- bootstrap params used across layers
- session payloads
- workflow input/output DTOs

## 3.5 Compatibility wrapper rule

Temporary compatibility wrappers are allowed during migration only.

Examples:

- a lightweight wrapper VM preserving existing imports while delegating to new smaller VMs
- a temporary adapter bridge during renaming

But these rules apply:

- compatibility wrappers must be thin
- they must not permanently hide a giant legacy implementation
- they must not become the final architecture
- they should be removed once the migration path is complete

## 3.6 Small view-model rule

A view-model must stay small and intent-based.

### Good examples

- catalog VM
- cart VM
- customer VM
- checkout VM
- split-bill VM
- receipt VM
- sale-history VM
- coordinator VM for composition only

### Bad examples

- one giant VM that owns the whole feature
- a fake split where child VMs simply forward everything into a hidden giant engine
- a VM that owns unrelated list + add + edit + delete + export + sync + settings logic

### Coordinator VM rule

A coordinator VM is allowed only to:

- compose child VM contracts
- own top-level screen status/messages
- mediate screen-level modal or state coordination
- trigger feature bootstrap/load

A coordinator VM must not silently become the full feature VM under a different name.

---

# 4. Type ownership rules

This section is strict.
Teams lose architecture quality fastest when types are scattered randomly.

## 4.1 Types that must be moved into `types/*.ts`

Move a type out of a file immediately if **any** of the following is true:

- it is imported by another file
- it models domain data
- it models state
- it models a DTO or payload
- it models an error/result contract
- it models a constant enum-like contract
- it models a reusable callback contract
- it is used in tests and implementation
- it is part of repository/use case/view model public surface
- it expresses a business rule or workflow state

## 4.2 Types allowed to remain inside a file

A type may stay inside a file only if **all** are true:

- it is used in one file only
- it is tiny and obvious
- it is purely presentational
- it is not part of a public contract
- moving it out would not improve clarity

Examples allowed inline:

- a tiny `SectionProps` for a local presentational component
- a tiny local tuple type used in one render-only helper

## 4.3 `entity.types.ts`

Put here:

- domain entities
- aggregate roots
- child domain objects
- canonical business identifiers
- domain snapshots

Examples:

- `Transaction`
- `LedgerEntry`
- `BillingDocument`
- `PosSale`
- `InventoryMovement`
- `Contact`

Do not put here:

- screen form state
- transport response wrappers
- temporary modal state

## 4.4 `state.types.ts`

Put here:

- view-model state
- form state
- screen state
- loading/error/success state
- modal state
- workflow UI state

Examples:

- `PosScreenState`
- `BillingEditorState`
- `TransactionListFiltersState`

Do not put here:

- DB models
- raw API payloads
- business entities

## 4.5 `dto.types.ts`

Put here:

- request/response DTOs
- datasource payloads
- import/export row shapes
- normalized external adapter payloads

Examples:

- `SaveBillingDocumentPayload`
- `PostMoneyMovementPayload`
- `PosLoadBootstrapParams`

Do not put here:

- final business entities
- view-model states

## 4.6 `error.types.ts`

Put here:

- domain error unions
- feature-specific Result aliases
- error code constants
- workflow failure shapes

Examples:

- `PosError`
- `BillingError`
- `InventoryAdjustmentError`
- `Result<T, E>` aliases for the feature

## 4.7 `constant.ts`

Put here:

- string constants
- enum-like value objects
- status literals
- feature-level fixed labels used by logic
- query limits
- retry limits

## 4.8 Shared type placement

Shared types belong in `shared/types` only when they are truly generic and feature-agnostic.

Examples:

- `Result<T, E>`
- `StatusType`
- `PaginationState`
- `SortDirection`
- `AsyncState`
- `IsoDateString`
- `CurrencyCode`

If a type contains words like `Transaction`, `Ledger`, `Billing`, `Role`, `EMI`, `Product`, `Inventory`, `POS`, or `Subscription`, it usually does **not** belong in shared.

## 4.9 Interface vs type alias standard

Use **interface** when:

- describing object-shaped contracts meant for extension
- repository contracts
- data source contracts
- adapter contracts
- view-model public contracts

Use **type alias** when:

- expressing unions
- intersections
- utility-transformed types
- tuples
- branded IDs
- callback type expressions
- mapped types

## 4.10 Declaration file rule

Use `.d.ts` only for:

- third-party type declarations
- ambient declarations
- native/global augmentation

Do not use `.d.ts` for normal feature business types.

---

# 5. Helper-function rules

## 5.1 Why helper functions exist

Helper functions exist to improve:

- readability
- reuse
- testability
- separation of concerns
- hook safety
- render purity
- mapper clarity
- calculation stability

A helper is justified when it turns hidden complexity into a named, testable unit.

## 5.2 When to create a helper

Create a helper when:

- logic is repeated in more than one place
- a function body is becoming hard to scan
- a calculation has domain meaning
- a transformation is reusable
- a mapper is getting noisy
- a validation rule is reused across add/update/import flows
- a formatter is shared across screens

Do **not** create a helper just to split every 3 lines of code.

## 5.3 Where helpers are kept

### Keep helper inside the same file when

- it is used once
- it is tiny
- it is tightly coupled to that file
- it is purely presentational

### Move helper into feature helper/util file when

- it is reused within a feature
- it expresses feature-specific logic
- it belongs to a mapper/calculation/validation family

Suggested locations:

```text
feature/<feature>/utils/
feature/<feature>/mapper/
feature/<feature>/validation/
```

### Move helper into shared when

- it is domain-agnostic
- it can be reused safely by unrelated features
- it does not know business vocabulary

Examples for shared:

- date formatting
- currency formatting
- debounce utility
- array chunking
- result helpers
- stable ID utilities

## 5.4 Helpers that must not live in shared

Do not place these in shared:

- `calculateLedgerSettlementBreakdown`
- `buildPosReceiptNote`
- `resolveBillingStatusFromPayment`
- `mapProductTaxToNepalVatLabel`

These belong in their features because they carry business meaning.

## 5.5 Helper naming rules

Prefer names that describe intent:

- `calculateTotals`
- `buildPosSaleSnapshot`
- `resolveBillingStatus`
- `mapTransactionModelToEntity`
- `validateSettlementRequest`

Avoid vague names:

- `handleData`
- `processThing`
- `doLogic`
- `helper`

---

# 6. Hook rules

## 6.1 Hook ownership

Hooks belong in:

- route files
- factory files only when producing dependency-stable instances
- UI files
- view models
- shared/custom hook modules

Hooks must never exist in:

- use cases
- repositories
- data sources
- mappers
- validators

## 6.2 Custom hook rule

A custom hook should exist only when:

- logic is React-specific
- it reuses state/effects across multiple React files
- it benefits from Hook rules and DevTools visibility

If logic is pure and not React-specific, prefer a normal function over a custom hook.

## 6.3 Hook dependency rule

Effects must include every reactive dependency they read unless the logic is intentionally restructured.

Do not silence dependency issues with unstable workarounds.

## 6.4 Derivation rule

Do not use `useEffect` to derive state that can be computed during render or through `useMemo`.

## 6.5 Hook extraction rule

Move logic into a custom hook when:

- two or more React files need the same effect/state pattern
- the UI file becomes hard to read because of lifecycle code
- the logic is still React-specific

---

# 7. Domain and workflow contracts

## 7.1 Standard CRUD features

Each CRUD feature should usually have:

- get/list use case
- get by id use case
- add use case
- update use case
- delete/archive use case
- dedicated list/details/add/edit VMs

## 7.2 Multi-step workflows

A workflow must define:

- workflow input type
- workflow output type
- workflow state model
- step list
- forward path
- retry path
- failure path
- compensation path if needed
- idempotency contract
- audit events

## 7.3 Required workflow statuses

Recommended standard:

- `draft`
- `pending_validation`
- `pending_posting`
- `posted`
- `partially_posted`
- `failed`
- `compensated`
- `cancelled`

## 7.4 Idempotency rule

Any workflow that can retry or be triggered twice must accept or generate an idempotency key.

Examples:

- POS checkout
- billing payment posting
- settlement posting
- imports
- AI-assisted create actions

## 7.5 Compensation rule

If a workflow spans multiple write owners and cannot use one hard transaction boundary, it must define compensation or a recoverable pending state.

---

# 8. Offline-first and sync architecture

## 8.1 Sync principle

The local database is operational truth for the device.
The remote system is shared truth for multi-device coordination.
Sync must reconcile them explicitly.

## 8.2 Required sync metadata per syncable record

Recommended fields:

- `recordSyncStatus`
- `lastSyncedAt`
- `deletedAt`
- `version` or server revision
- `createdAt`
- `updatedAt`
- ownership scope fields

## 8.3 Sync status values

Recommended standard:

- `pending_create`
- `pending_update`
- `pending_delete`
- `syncing`
- `synced`
- `sync_failed`
- `conflict`

## 8.4 Conflict rule

Every syncable feature must define one of:

- server-wins
- client-wins
- version-based merge
- field-level merge
- manual conflict resolution

No feature may leave conflict behavior undefined.

## 8.5 Tombstone rule

Deletes must use a safe delete policy.
Do not hard-delete business records whose history matters unless policy explicitly allows it.

## 8.6 Sync queue rule

Cross-feature sync should go through a queue or coordinator, not random per-screen sync calls.

---

# 9. Security architecture rules

## 9.1 Secret storage rule

Secrets and tokens must live in secure storage only.
They must not live in:

- WatermelonDB tables
- plain AsyncStorage for secrets
- screen state persistence
- logs
- exports

## 9.2 Sensitive data rule

Never log directly:

- access tokens
- refresh tokens
- passwords
- encryption keys
- raw biometric secrets
- full PII unless explicitly required and permitted

## 9.3 Authorization rule

Permissions must be checked at the application/service boundary, not only hidden in UI.

## 9.4 Audit rule

Destructive or financial actions must emit audit events.

Required examples:

- void sale
- delete document
- reverse transaction
- change role
- force close plan
- inventory adjustment
- restore import

## 9.5 Audit event minimum fields

- actor id
- actor role
- action type
- target type
- target id
- timestamp
- reason if destructive
- source module
- correlation/idempotency key if workflow-based

---

# 10. Reporting and read-model rules

## 10.1 No UI formulas rule

Dashboard screens and report screens must not invent shared business formulas.

## 10.2 ID-based aggregation rule

Aggregate by stable IDs, not mutable display strings.

Use:

- `contactRemoteId`
- `categoryRemoteId`
- `productRemoteId`
- `moneyAccountRemoteId`
- `billingDocumentRemoteId`
- `posSaleRemoteId`

## 10.3 Read-model ownership examples

- receivable/payable summary -> Ledger read model
- money movement chart -> Transactions read model
- invoice issuance summary -> Billing read model
- stock valuation -> Inventory read model
- POS sales trend -> POS sale read model

## 10.4 Export parity rule

PDF/CSV/XLS/print exports must use the same snapshot/query truth as the visible report.

---

# 11. File-level strict rules

## 11.1 What is allowed in a component file

Allowed:

- component
- local styles
- local tiny prop types
- render-only helper functions
- local constants used only there

Not allowed:

- repository imports
- DB imports
- API imports
- feature business validation logic
- cross-feature data mutation

## 11.2 What is allowed in a view-model file

Allowed:

- state
- callbacks
- effect orchestration
- use case consumption
- UI shaping

Not allowed:

- DB imports
- raw transport imports
- cross-feature adapter SDK calls

## 11.3 What is allowed in a use-case file

Allowed:

- validation
- business decision making
- repository coordination
- Result return types

Not allowed:

- hooks
- JSX
- UI imports
- screen component imports

## 11.4 What is allowed in a repository file

Allowed:

- mapping
- merge policy
- error translation
- data source composition

Not allowed:

- direct UI strings
- hooks
- component imports

## 11.5 What is allowed in a datasource file

Allowed:

- raw DB/API/device I/O
- serialization
- model handling

Not allowed:

- screen orchestration
- multi-step business workflow
- UI logic

---

# 12. Performance rules

## 12.1 Rendering

- Components must stay pure.
- Prefer derived values over state duplication.
- Use memoization intentionally, not everywhere.
- Use stable keys in lists.

## 12.2 Large lists

Large lists must define:

- virtualization strategy
- key extractor policy
- empty/loading/error states
- pagination or windowing plan

## 12.3 Async work

Long-running work must not block render.
Use:

- background tasks
- job queues
- export jobs
- workflow states

## 12.4 Expensive features

For OCR, AI, document parsing, or large exports:

- use adapter/gateway boundaries
- use async job state
- use retries/timeouts
- persist job status when business-relevant

---

# 13. Testing contract

## 13.1 Minimum tests per feature

- use case success path
- use case failure path
- repository mapping/error path
- view-model loading/empty/success/failure path
- UI callback wiring path

## 13.2 Required tests per workflow

- happy path
- validation failure
- idempotent retry
- partial failure
- compensation or recoverable pending state
- audit emission if applicable

## 13.3 Required tests per read model

- aggregation correctness
- filter correctness
- date-range correctness
- export parity

## 13.4 Required tests per syncable feature

- create/update/delete sync metadata
- conflict behavior
- tombstone behavior
- retry behavior

---

# 14. Advanced-feature support rules

This architecture must support modern and expensive features.
The following rules make that possible.

## 14.1 AI features

AI features must use adapters and orchestration.

AI must not be called directly from UI or repositories.

AI workflows must define:

- prompt input contract
- structured output contract
- validation layer
- retry/fallback behavior
- review-before-commit behavior when business data is affected

## 14.2 OCR/document scanning

OCR flows must define:

- capture
- parse
- normalize
- confidence
- review/edit
- commit
- audit

OCR output is not business truth until user-reviewed or rule-validated.

## 14.3 External payment or terminal support

Payment-terminal SDKs and payment gateways must be wrapped in adapters.
Payment success must not directly mutate business truth without workflow coordination.

## 14.4 Real-time features

Realtime features must separate:

- subscription transport
- realtime event normalization
- local state projection
- persisted truth write path

Realtime notifications are not the same as source-of-truth commits.

## 14.5 Multi-branch / enterprise support

Future-ready entities should distinguish:

- user identity
- profile scope
- business scope
- branch scope
- account scope
- permission scope

No module should assume one business means one branch forever.

---

# 15. Strict decisions for eLekha

## 15.1 Personal vs Business

The shell may be shared.
The data ownership must not be shared silently.

## 15.2 Transactions / Ledger / EMI

These remain separate write domains.
Reports may unify them in read models only.

## 15.3 POS

POS is a workflow.
It does not own products, stock, or ledger truth.
POS must persist a durable sale aggregate.

## 15.4 Billing

Billing owns formal documents and printable snapshots.
It does not own business receivable/payable truth.

## 15.5 Inventory

Inventory movements own stock history truth.
Direct product stock editing is not a final architecture truth.

---

# 16. Rule summary for helpers, types, and files

## Types inside file vs `types/*.ts`

### Keep inside file only if

- local only
- tiny
- presentational only
- not imported elsewhere

### Move to `types/*.ts` if

- imported elsewhere
- part of any contract
- part of state, entity, DTO, error, workflow, or constant model

## Why use helper functions

Use helpers to:

- name business meaning
- isolate calculations
- reduce duplication
- improve testing
- keep render/view-model/use-case files readable

## Where helpers go

- same file: tiny one-off local helper
- feature utils: reusable feature helper
- mapper folder: mapping helper
- validation folder: rule helper
- shared: only generic helper

---

# 17. Pull request checklist

- [ ] Route contains no business logic or repository/database imports
- [ ] Factory owns dependency wiring only
- [ ] UI contains no repository/database/API imports
- [ ] View model contains no raw I/O imports
- [ ] Each business action has a dedicated use case
- [ ] Cross-feature workflow uses an orchestration use case
- [ ] Repository owns mapping and error translation
- [ ] Data source owns raw I/O only
- [ ] Types are placed in the correct `types/*.ts` file
- [ ] Shared code is truly feature-agnostic
- [ ] Reports use read models, not UI formulas
- [ ] Sync metadata and conflict policy are defined where needed
- [ ] Secrets are not stored outside secure storage
- [ ] Financial/destructive actions emit audit events
- [ ] Expensive integrations are wrapped in adapters
- [ ] Tests cover success and failure paths

---

# 18. Final enforcement statement

This rulebook is the production contract for eLekha.

A feature is not considered production-grade unless:

- its layer boundaries match this rulebook
- its source-of-truth ownership is explicit
- its type ownership is predictable
- its helper placement is disciplined
- its advanced integrations are adapter-based
- its workflows are orchestrated safely
- its reports use read models
- its sync and security behaviors are defined
- its destructive and financial actions are auditable

Simple memory rule:

**Route chooses. Factory wires. UI renders. View model orchestrates the screen. Use case decides the business action. Orchestrator coordinates cross-domain workflows. Repository translates and merges. Data source performs I/O. Adapter wraps external capability. Read model answers analytics and reports. Shared stays generic.**

