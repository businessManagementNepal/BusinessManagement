# Sync Architecture Decision

This document locks the production sync foundation rules for eLekha.

## Core decisions

1. Local database remains operational truth.
2. Remote backend is shared multi-device truth.
3. User actions write locally first.
4. Sync runs after local write.
5. No UI waits for API to save business data.
6. Sync failure does not break local app usage.
7. Financial records are never silently overwritten.
8. Deletes use tombstones.
9. Conflicts must be explicit.
10. Sync runs through one coordinator, not per-screen calls.

## Architectural path

All sync work must follow the canonical application flow:

`route -> factory -> UI -> viewModel -> useCase -> repository -> dataSource -> database/API/device adapter`

Sync is a dedicated cross-feature workflow under `feature/sync`. It must not be embedded inside UI screens, routes, or unrelated feature repositories.

## Source-of-truth guardrails

- Transactions own posted money movement truth.
- Ledger owns receivable and payable due truth.
- Billing owns printable document truth.
- Inventory movements own stock movement truth.
- Products and money accounts keep projections only. Sync must rebuild their projections after remote apply instead of trusting remote projection fields.

## Runtime rules

- Sync runs are serialized through a single lock.
- Sync push marks records as synced only after explicit server ACK.
- Sync pull updates checkpoints only after local apply succeeds.
- Sync conflicts are persisted for retry and manual review.
- Existing offline-first behavior remains unchanged unless a failing test proves a bug.
