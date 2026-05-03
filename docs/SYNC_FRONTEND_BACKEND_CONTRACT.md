# Sync Frontend/Backend Contract

## Scope

This contract locks the V1 sync boundary between the eLekha React Native app and the Django sync authority.

Core rules:

- Local WatermelonDB remains the operational truth on the device.
- Backend is the shared multi-device sync truth only.
- UI and feature screens do not call backend APIs directly.
- Create, update, and delete flows continue to write locally first.
- Sync payload translation happens only at the sync boundary.

## V1 Rollout

Enabled sync tables for staged V1:

- `contacts`
- `categories`
- `products`

Disabled for V1 rollout even though registry coverage exists:

- `transactions`
- `ledger_entries`
- `billing_documents`
- `billing_document_items`
- `inventory_movements`
- `orders`
- `order_lines`
- `pos_sales`
- `emi_plans`
- `emi_installments`
- `installment_payment_links`

## Canonical Values

### `transactions.direction`

Local device truth:

- `in`
- `out`

Sync payload / backend truth:

- `inflow`
- `outflow`

Boundary mapping:

- `in -> inflow`
- `out -> outflow`

### `transactions.transaction_type`

Allowed values:

- `income`
- `expense`
- `transfer`
- `refund`

Backend may accept additional legacy financial types, but current frontend sync generation uses only the values above.

### `transactions.posting_status`

Local device truth:

- `posted`
- `voided`

Sync payload / backend truth:

- `posted`
- `void`

Boundary mapping:

- `posted -> posted`
- `voided -> void`

### `ledger_entries.balance_direction`

Local device truth:

- `receive`
- `pay`

Sync payload / backend truth:

- `debit`
- `credit`

Boundary mapping:

- `receive -> debit`
- `pay -> credit`

### `ledger_entries.entry_type`

Allowed values:

- `sale`
- `purchase`
- `collection`
- `payment_out`
- `refund`
- `advance`
- `adjustment`

### `orders.status`

Canonical frontend and backend lifecycle values:

- `draft`
- `pending`
- `confirmed`
- `processing`
- `ready`
- `shipped`
- `delivered`
- `cancelled`
- `returned`

### `pos_sales.workflow_status`

Canonical frontend and backend lifecycle values:

- `pending_validation`
- `pending_posting`
- `posted`
- `partially_posted`
- `failed`

### `billing_documents.status`

Canonical frontend and backend lifecycle values:

- `draft`
- `pending`
- `partially_paid`
- `paid`
- `overdue`

Issued billing scenario rule:

- An issued but unpaid billing document is represented as `status = pending`.

### `inventory_movements.movement_type`

Canonical frontend and backend values:

- `opening_stock`
- `stock_in`
- `sale_out`
- `adjustment`

## V1 Projection Protection

These fields are never allowed to overwrite local projection truth from remote pull:

- `products.stock_quantity`
- `money_accounts.current_balance`

These fields are stripped from outbound sync payloads for the same reason.

## Transport Rules

- `EXPO_PUBLIC_API_BASE_URL` must be origin only.
- Valid example: `https://api.elekha.app`
- Invalid example: `https://api.elekha.app/api/v1`
- Sync endpoints remain:
  - `/api/v1/sync/push`
  - `/api/v1/sync/pull`
  - `/api/v1/auth/refresh`

## Compatibility Notes

- Transaction and ledger vocabularies intentionally map at the sync boundary.
- Order, POS, billing, inventory, product, contact, and category lifecycle/domain values are aligned directly with frontend domain truth.
- `categories` must carry `server_revision` like the other V1 tables.
