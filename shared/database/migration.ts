import {
  BACKFILL_EMPTY_BILLING_DOCUMENT_NUMBER_SQL,
  BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_SQL,
  DEDUPE_ACTIVE_BILLING_DOCUMENT_NUMBER_SQL,
  NORMALIZE_BILLING_DOCUMENT_NUMBER_SQL,
} from "@/feature/billing/data/dataSource/db/billingDocument.uniqueIndex";
import {
  BACKFILL_CONTACT_NORMALIZED_PHONE_SQL,
  CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL,
  DEDUPE_CONTACT_NORMALIZED_PHONE_SQL,
  DROP_CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL,
} from "@/feature/contacts/data/dataSource/db/contactPhone.uniqueIndex";
import {
  addColumns,
  createTable,
  schemaMigrations,
  unsafeExecuteSql,
} from "@nozbe/watermelondb/Schema/migrations";

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 11,
      steps: [
        createTable({
          name: "auth_credentials",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "user_remote_id", type: "string", isIndexed: true },
            { name: "login_id", type: "string", isIndexed: true },
            { name: "credential_type", type: "string", isIndexed: true },
            { name: "password_hash", type: "string" },
            { name: "password_salt", type: "string" },
            { name: "hint", type: "string", isOptional: true },
            { name: "last_login_at", type: "number", isOptional: true },
            { name: "is_active", type: "boolean" },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 12,
      steps: [
        addColumns({
          table: "auth_credentials",
          columns: [
            { name: "failed_attempt_count", type: "number", isOptional: true },
            { name: "lockout_until", type: "number", isOptional: true },
            { name: "last_failed_login_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "app_settings",
          columns: [
            { name: "selected_language", type: "string" },
            { name: "onboarding_completed", type: "boolean" },
            {
              name: "active_user_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            {
              name: "active_account_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 13,
      steps: [
        createTable({
          name: "accounts",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "account_type", type: "string", isIndexed: true },
            { name: "display_name", type: "string" },
            { name: "currency_code", type: "string", isOptional: true },
            { name: "city_or_location", type: "string", isOptional: true },
            { name: "country_code", type: "string", isOptional: true },
            { name: "is_active", type: "boolean" },
            { name: "is_default", type: "boolean" },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 14,
      steps: [
        addColumns({
          table: "accounts",
          columns: [
            { name: "business_type", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 15,
      steps: [
        createTable({
          name: "business_profiles",
          columns: [
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "business_type", type: "string" },
            { name: "business_name", type: "string" },
            { name: "country_code", type: "string" },
            { name: "currency_code", type: "string" },
            { name: "timezone", type: "string" },
            { name: "phone_policy", type: "string" },
            { name: "is_active", type: "boolean" },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 16,
      steps: [
        addColumns({
          table: "business_profiles",
          columns: [
            { name: "business_logo_url", type: "string", isOptional: true },
            { name: "business_phone", type: "string", isOptional: true },
            { name: "business_email", type: "string", isOptional: true },
            { name: "registered_address", type: "string", isOptional: true },
            { name: "country", type: "string", isOptional: true },
            { name: "city", type: "string", isOptional: true },
            { name: "state_or_district", type: "string", isOptional: true },
            { name: "tax_registration_id", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 17,
      steps: [
        createTable({
          name: "user_management_permissions",
          columns: [
            { name: "code", type: "string", isIndexed: true },
            { name: "module", type: "string", isIndexed: true },
            { name: "label", type: "string" },
            { name: "description", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "account_roles",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "is_system", type: "boolean" },
            { name: "is_default", type: "boolean" },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "account_role_permissions",
          columns: [
            { name: "role_remote_id", type: "string", isIndexed: true },
            { name: "permission_code", type: "string", isIndexed: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "account_user_roles",
          columns: [
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "user_remote_id", type: "string", isIndexed: true },
            { name: "role_remote_id", type: "string", isIndexed: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 18,
      steps: [
        createTable({
          name: "account_members",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "user_remote_id", type: "string", isIndexed: true },
            { name: "status", type: "string", isIndexed: true },
            {
              name: "invited_by_user_remote_id",
              type: "string",
              isOptional: true,
            },
            { name: "joined_at", type: "number", isOptional: true },
            { name: "last_active_at", type: "number", isOptional: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 19,
      steps: [
        createTable({
          name: "transactions",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "account_display_name_snapshot", type: "string" },
            { name: "transaction_type", type: "string", isIndexed: true },
            { name: "direction", type: "string", isIndexed: true },
            { name: "title", type: "string" },
            { name: "amount", type: "number" },
            { name: "currency_code", type: "string", isOptional: true },
            { name: "category_label", type: "string", isOptional: true },
            { name: "note", type: "string", isOptional: true },
            { name: "happened_at", type: "number", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 20,
      steps: [
        createTable({
          name: "ledger_entries",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            {
              name: "business_account_remote_id",
              type: "string",
              isIndexed: true,
            },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "party_name", type: "string", isIndexed: true },
            { name: "party_phone", type: "string", isOptional: true },
            { name: "entry_type", type: "string", isIndexed: true },
            { name: "balance_direction", type: "string", isIndexed: true },
            { name: "title", type: "string" },
            { name: "amount", type: "number" },
            { name: "currency_code", type: "string", isOptional: true },
            { name: "note", type: "string", isOptional: true },
            { name: "happened_at", type: "number", isIndexed: true },
            {
              name: "due_at",
              type: "number",
              isOptional: true,
              isIndexed: true,
            },
            {
              name: "settlement_account_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            {
              name: "settlement_account_display_name_snapshot",
              type: "string",
              isOptional: true,
            },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 21,
      steps: [
        createTable({
          name: "emi_plans",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            {
              name: "business_account_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            { name: "plan_mode", type: "string", isIndexed: true },
            { name: "plan_type", type: "string", isIndexed: true },
            { name: "payment_direction", type: "string", isIndexed: true },
            { name: "title", type: "string" },
            {
              name: "counterparty_name",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            { name: "counterparty_phone", type: "string", isOptional: true },
            {
              name: "linked_account_remote_id",
              type: "string",
              isIndexed: true,
            },
            { name: "linked_account_display_name_snapshot", type: "string" },
            { name: "currency_code", type: "string", isOptional: true },
            { name: "total_amount", type: "number" },
            { name: "installment_count", type: "number" },
            { name: "paid_installment_count", type: "number" },
            { name: "paid_amount", type: "number" },
            { name: "first_due_at", type: "number", isIndexed: true },
            {
              name: "next_due_at",
              type: "number",
              isOptional: true,
              isIndexed: true,
            },
            { name: "reminder_enabled", type: "boolean" },
            { name: "reminder_days_before", type: "number", isOptional: true },
            { name: "note", type: "string", isOptional: true },
            { name: "status", type: "string", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "emi_installments",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "plan_remote_id", type: "string", isIndexed: true },
            { name: "installment_number", type: "number", isIndexed: true },
            { name: "amount", type: "number" },
            { name: "due_at", type: "number", isIndexed: true },
            { name: "status", type: "string", isIndexed: true },
            { name: "paid_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "installment_payment_links",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "plan_remote_id", type: "string", isIndexed: true },
            { name: "installment_remote_id", type: "string", isIndexed: true },
            { name: "payment_record_type", type: "string", isIndexed: true },
            {
              name: "payment_record_remote_id",
              type: "string",
              isIndexed: true,
            },
            { name: "payment_direction", type: "string", isIndexed: true },
            { name: "amount", type: "number" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 22,
      steps: [
        createTable({
          name: "inventory_movements",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "product_remote_id", type: "string", isIndexed: true },
            { name: "product_name_snapshot", type: "string" },
            {
              name: "product_unit_label_snapshot",
              type: "string",
              isOptional: true,
            },
            { name: "movement_type", type: "string", isIndexed: true },
            { name: "quantity", type: "number" },
            { name: "delta_quantity", type: "number" },
            { name: "unit_rate", type: "number", isOptional: true },
            { name: "reason", type: "string", isOptional: true },
            { name: "remark", type: "string", isOptional: true },
            { name: "movement_at", type: "number", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "products",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "name", type: "string", isIndexed: true },
            { name: "kind", type: "string", isIndexed: true },
            { name: "category_name", type: "string", isOptional: true },
            { name: "sale_price", type: "number" },
            { name: "cost_price", type: "number", isOptional: true },
            { name: "stock_quantity", type: "number", isOptional: true },
            { name: "unit_label", type: "string", isOptional: true },
            { name: "sku_or_barcode", type: "string", isOptional: true },
            { name: "tax_rate_label", type: "string", isOptional: true },
            { name: "description", type: "string", isOptional: true },
            { name: "image_url", type: "string", isOptional: true },
            { name: "status", type: "string", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 23,
      steps: [
        createTable({
          name: "categories",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "account_type", type: "string", isIndexed: true },
            { name: "scope", type: "string", isIndexed: true },
            { name: "kind", type: "string", isIndexed: true },
            { name: "name", type: "string", isIndexed: true },
            { name: "description", type: "string", isOptional: true },
            { name: "is_system", type: "boolean", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 24,
      steps: [
        createTable({
          name: "money_accounts",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            {
              name: "scope_account_remote_id",
              type: "string",
              isIndexed: true,
            },
            { name: "name", type: "string" },
            { name: "account_type", type: "string", isIndexed: true },
            { name: "current_balance", type: "number" },
            { name: "description", type: "string", isOptional: true },
            { name: "currency_code", type: "string", isOptional: true },
            { name: "is_primary", type: "boolean" },
            { name: "is_active", type: "boolean" },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "contacts",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "account_type", type: "string", isIndexed: true },
            { name: "contact_type", type: "string", isIndexed: true },
            { name: "full_name", type: "string", isIndexed: true },
            { name: "phone_number", type: "string", isOptional: true },
            { name: "email_address", type: "string", isOptional: true },
            { name: "address", type: "string", isOptional: true },
            { name: "tax_id", type: "string", isOptional: true },
            { name: "opening_balance_amount", type: "number" },
            {
              name: "opening_balance_direction",
              type: "string",
              isOptional: true,
            },
            { name: "notes", type: "string", isOptional: true },
            { name: "is_archived", type: "boolean", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "billing_documents",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "document_number", type: "string", isIndexed: true },
            { name: "document_type", type: "string", isIndexed: true },
            { name: "template_type", type: "string", isIndexed: true },
            { name: "customer_name", type: "string" },
            { name: "status", type: "string", isIndexed: true },
            { name: "tax_rate_percent", type: "number" },
            { name: "notes", type: "string", isOptional: true },
            { name: "subtotal_amount", type: "number" },
            { name: "tax_amount", type: "number" },
            { name: "total_amount", type: "number" },
            { name: "issued_at", type: "number", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "billing_document_items",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "document_remote_id", type: "string", isIndexed: true },
            { name: "line_order", type: "number" },
            { name: "item_name", type: "string" },
            { name: "quantity", type: "number" },
            { name: "unit_rate", type: "number" },
            { name: "line_total", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "bill_photos",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            {
              name: "document_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            { name: "file_name", type: "string" },
            { name: "mime_type", type: "string", isOptional: true },
            { name: "image_data_url", type: "string" },
            { name: "uploaded_at", type: "number", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "business_notes",
          columns: [
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "note_content", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 25,
      steps: [
        unsafeExecuteSql(NORMALIZE_BILLING_DOCUMENT_NUMBER_SQL),
        unsafeExecuteSql(BACKFILL_EMPTY_BILLING_DOCUMENT_NUMBER_SQL),
        unsafeExecuteSql(DEDUPE_ACTIVE_BILLING_DOCUMENT_NUMBER_SQL),
        unsafeExecuteSql(BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_SQL),
      ],
    },
    {
      toVersion: 26,
      steps: [
        createTable({
          name: "orders",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "order_number", type: "string", isIndexed: true },
            { name: "order_date", type: "number", isIndexed: true },
            {
              name: "customer_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            {
              name: "delivery_or_pickup_details",
              type: "string",
              isOptional: true,
            },
            { name: "notes", type: "string", isOptional: true },
            { name: "tags", type: "string", isOptional: true },
            { name: "internal_remarks", type: "string", isOptional: true },
            { name: "status", type: "string", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "order_lines",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "order_remote_id", type: "string", isIndexed: true },
            { name: "product_remote_id", type: "string", isIndexed: true },
            { name: "quantity", type: "number" },
            { name: "line_order", type: "number", isIndexed: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 27,
      steps: [
        createTable({
          name: "budget_plans",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "budget_month", type: "string", isIndexed: true },
            { name: "category_remote_id", type: "string", isIndexed: true },
            { name: "category_name_snapshot", type: "string" },
            { name: "currency_code", type: "string", isOptional: true },
            { name: "planned_amount", type: "number" },
            { name: "note", type: "string", isOptional: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 28,
      steps: [
        addColumns({
          table: "app_settings",
          columns: [
            {
              name: "biometric_login_enabled",
              type: "boolean",
              isOptional: true,
            },
            {
              name: "two_factor_auth_enabled",
              type: "boolean",
              isOptional: true,
            },
          ],
        }),
        createTable({
          name: "bug_reports",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "user_remote_id", type: "string", isIndexed: true },
            { name: "title", type: "string" },
            { name: "description", type: "string" },
            { name: "severity", type: "string", isIndexed: true },
            { name: "device_info", type: "string", isOptional: true },
            { name: "app_version", type: "string", isOptional: true },
            { name: "submitted_at", type: "number", isIndexed: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "app_ratings",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "user_remote_id", type: "string", isIndexed: true },
            { name: "star_count", type: "number", isIndexed: true },
            { name: "review", type: "string", isOptional: true },
            { name: "submitted_at", type: "number", isIndexed: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 29,
      steps: [
        addColumns({
          table: "accounts",
          columns: [
            {
              name: "default_tax_rate_percent",
              type: "number",
              isOptional: true,
            },
            { name: "default_tax_mode", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 30,
      steps: [
        addColumns({
          table: "ledger_entries",
          columns: [
            { name: "payment_mode", type: "string", isOptional: true },
            { name: "reference_number", type: "string", isOptional: true },
            { name: "reminder_at", type: "number", isOptional: true },
            { name: "attachment_uri", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 31,
      steps: [
        addColumns({
          table: "ledger_entries",
          columns: [
            {
              name: "linked_transaction_remote_id",
              type: "string",
              isOptional: true,
            },
          ],
        }),
      ],
    },
    {
      toVersion: 32,
      steps: [
        addColumns({
          table: "transactions",
          columns: [
            {
              name: "settlement_money_account_remote_id",
              type: "string",
              isOptional: true,
            },
            {
              name: "settlement_money_account_display_name_snapshot",
              type: "string",
              isOptional: true,
            },
            { name: "source_module", type: "string", isOptional: true },
            { name: "source_remote_id", type: "string", isOptional: true },
            { name: "source_action", type: "string", isOptional: true },
            { name: "idempotency_key", type: "string", isOptional: true },
            { name: "posting_status", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 33,
      steps: [
        addColumns({
          table: "ledger_entries",
          columns: [
            {
              name: "settled_against_entry_remote_id",
              type: "string",
              isOptional: true,
            },
          ],
        }),
      ],
    },
    {
      toVersion: 34,
      steps: [
        addColumns({
          table: "billing_documents",
          columns: [
            { name: "due_at", type: "number", isOptional: true },
            { name: "source_module", type: "string", isOptional: true },
            { name: "source_remote_id", type: "string", isOptional: true },
            {
              name: "linked_ledger_entry_remote_id",
              type: "string",
              isOptional: true,
            },
          ],
        }),
        createTable({
          name: "billing_document_allocations",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "document_remote_id", type: "string", isIndexed: true },
            {
              name: "settlement_ledger_entry_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            {
              name: "settlement_transaction_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            { name: "amount", type: "number" },
            { name: "settled_at", type: "number", isIndexed: true },
            { name: "note", type: "string", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        addColumns({
          table: "ledger_entries",
          columns: [
            {
              name: "linked_document_remote_id",
              type: "string",
              isOptional: true,
            },
          ],
        }),
      ],
    },
    {
      toVersion: 35,
      steps: [
        addColumns({
          table: "billing_documents",
          columns: [
            {
              name: "contact_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
          ],
        }),
        addColumns({
          table: "ledger_entries",
          columns: [
            {
              name: "contact_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
          ],
        }),
      ],
    },
    {
      toVersion: 36,
      steps: [
        addColumns({
          table: "transactions",
          columns: [
            {
              name: "contact_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
          ],
        }),
      ],
    },
    {
      toVersion: 37,
      steps: [
        createTable({
          name: "pos_sales",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "receipt_number", type: "string", isIndexed: true },
            {
              name: "business_account_remote_id",
              type: "string",
              isIndexed: true,
            },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "idempotency_key", type: "string", isIndexed: true },
            { name: "workflow_status", type: "string", isIndexed: true },
            {
              name: "customer_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            { name: "customer_name_snapshot", type: "string", isOptional: true },
            {
              name: "customer_phone_snapshot",
              type: "string",
              isOptional: true,
            },
            { name: "currency_code", type: "string" },
            { name: "country_code", type: "string", isOptional: true },
            { name: "item_count", type: "number" },
            { name: "gross", type: "number" },
            { name: "discount_amount", type: "number" },
            { name: "surcharge_amount", type: "number" },
            { name: "tax_amount", type: "number" },
            { name: "grand_total", type: "number" },
            { name: "cart_lines_snapshot_json", type: "string" },
            { name: "payment_parts_snapshot_json", type: "string" },
            { name: "receipt_snapshot_json", type: "string", isOptional: true },
            {
              name: "billing_document_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            {
              name: "ledger_entry_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            { name: "posted_transaction_remote_ids_json", type: "string" },
            { name: "last_error_type", type: "string", isOptional: true },
            { name: "last_error_message", type: "string", isOptional: true },
            { name: "sync_status", type: "string", isIndexed: true },
            { name: "last_synced_at", type: "number", isOptional: true },
            { name: "deleted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 38,
      steps: [
        addColumns({
          table: "contacts",
          columns: [
            {
              name: "normalized_phone_number",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
          ],
        }),
        unsafeExecuteSql(BACKFILL_CONTACT_NORMALIZED_PHONE_SQL),
        unsafeExecuteSql(DEDUPE_CONTACT_NORMALIZED_PHONE_SQL),
        unsafeExecuteSql(CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL),
      ],
    },
    {
      toVersion: 39,
      steps: [
        unsafeExecuteSql(DROP_CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL),
        unsafeExecuteSql(CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL),
      ],
    },
    {
      toVersion: 40,
      steps: [
        addColumns({
          table: "orders",
          columns: [
            { name: "tax_rate_percent", type: "number", isOptional: true },
            { name: "subtotal_amount", type: "number", isOptional: true },
            { name: "tax_amount", type: "number", isOptional: true },
            { name: "discount_amount", type: "number", isOptional: true },
            { name: "total_amount", type: "number", isOptional: true },
          ],
        }),
        addColumns({
          table: "order_lines",
          columns: [
            { name: "product_name_snapshot", type: "string", isOptional: true },
            { name: "unit_label_snapshot", type: "string", isOptional: true },
            {
              name: "sku_or_barcode_snapshot",
              type: "string",
              isOptional: true,
            },
            {
              name: "category_name_snapshot",
              type: "string",
              isOptional: true,
            },
            {
              name: "tax_rate_label_snapshot",
              type: "string",
              isOptional: true,
            },
            { name: "unit_price_snapshot", type: "number", isOptional: true },
            {
              name: "tax_rate_percent_snapshot",
              type: "number",
              isOptional: true,
            },
            {
              name: "line_subtotal_amount",
              type: "number",
              isOptional: true,
            },
            { name: "line_tax_amount", type: "number", isOptional: true },
            { name: "line_total_amount", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 41,
      steps: [
        addColumns({
          table: "orders",
          columns: [
            {
              name: "linked_billing_document_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            {
              name: "linked_ledger_due_entry_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
          ],
        }),
      ],
    },
    {
      toVersion: 42,
      steps: [
        unsafeExecuteSql(BACKFILL_CONTACT_NORMALIZED_PHONE_SQL),
        unsafeExecuteSql(DEDUPE_CONTACT_NORMALIZED_PHONE_SQL),
        unsafeExecuteSql(DROP_CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL),
        unsafeExecuteSql(CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL),
      ],
    },
    {
      toVersion: 43,
      steps: [
        Object.assign(
          createTable({
            name: "audit_events",
            columns: [
              { name: "remote_id", type: "string", isIndexed: true },
              { name: "account_remote_id", type: "string", isIndexed: true },
              { name: "owner_user_remote_id", type: "string", isIndexed: true },
              { name: "actor_user_remote_id", type: "string", isIndexed: true },
              { name: "module", type: "string", isIndexed: true },
              { name: "action", type: "string", isIndexed: true },
              { name: "source_module", type: "string", isIndexed: true },
              { name: "source_remote_id", type: "string", isIndexed: true },
              { name: "source_action", type: "string", isIndexed: true },
              { name: "outcome", type: "string", isIndexed: true },
              { name: "severity", type: "string", isIndexed: true },
              { name: "summary", type: "string" },
              { name: "metadata_json", type: "string", isOptional: true },
              { name: "sync_status", type: "string", isIndexed: true },
              { name: "last_synced_at", type: "number", isOptional: true },
              { name: "deleted_at", type: "number", isOptional: true },
              { name: "created_at", type: "number", isIndexed: true },
              { name: "updated_at", type: "number" },
            ],
          }),
          { table: "audit_events" },
        ),
      ],
    },
    {
      toVersion: 44,
      steps: [],
    },
    {
      toVersion: 45,
      steps: [
        createTable({
          name: "sync_checkpoints",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "table_name", type: "string", isIndexed: true },
            { name: "server_cursor", type: "string", isOptional: true },
            { name: "last_pulled_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "sync_runs",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "owner_user_remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "status", type: "string", isIndexed: true },
            { name: "started_at", type: "number", isIndexed: true },
            { name: "finished_at", type: "number", isOptional: true },
            { name: "pushed_count", type: "number" },
            { name: "pulled_count", type: "number" },
            { name: "conflict_count", type: "number" },
            { name: "failed_count", type: "number" },
            { name: "error_message", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "sync_errors",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "sync_run_remote_id", type: "string", isIndexed: true },
            { name: "table_name", type: "string", isIndexed: true },
            { name: "record_remote_id", type: "string", isIndexed: true },
            { name: "operation", type: "string", isIndexed: true },
            { name: "error_type", type: "string", isIndexed: true },
            { name: "error_message", type: "string" },
            { name: "retry_count", type: "number" },
            { name: "next_retry_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "sync_conflicts",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "table_name", type: "string", isIndexed: true },
            { name: "record_remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "local_payload_json", type: "string" },
            { name: "remote_payload_json", type: "string" },
            { name: "conflict_policy", type: "string", isIndexed: true },
            { name: "status", type: "string", isIndexed: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "sync_outbox",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "table_name", type: "string", isIndexed: true },
            { name: "record_remote_id", type: "string", isIndexed: true },
            { name: "account_remote_id", type: "string", isIndexed: true },
            { name: "operation", type: "string", isIndexed: true },
            { name: "payload_json", type: "string" },
            { name: "status", type: "string", isIndexed: true },
            { name: "attempt_count", type: "number" },
            { name: "last_attempted_at", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 46,
      steps: [
        Object.assign(
          createTable({
            name: "import_jobs",
            columns: [
              { name: "remote_id", type: "string", isIndexed: true },
              {
                name: "active_account_remote_id",
                type: "string",
                isIndexed: true,
              },
              {
                name: "active_user_remote_id",
                type: "string",
                isIndexed: true,
              },
              { name: "module_id", type: "string", isIndexed: true },
              { name: "file_name", type: "string" },
              { name: "file_format", type: "string", isIndexed: true },
              { name: "status", type: "string", isIndexed: true },
              { name: "import_mode", type: "string", isIndexed: true },
              { name: "total_rows", type: "number" },
              { name: "valid_rows", type: "number" },
              { name: "invalid_rows", type: "number" },
              { name: "duplicate_rows", type: "number" },
              { name: "imported_rows", type: "number" },
              { name: "skipped_rows", type: "number" },
              { name: "failed_rows", type: "number" },
              { name: "created_at", type: "number", isIndexed: true },
              { name: "updated_at", type: "number" },
              { name: "completed_at", type: "number", isOptional: true },
            ],
          }),
          { table: "import_jobs" },
        ),
        Object.assign(
          createTable({
            name: "import_job_rows",
            columns: [
              { name: "remote_id", type: "string", isIndexed: true },
              {
                name: "import_job_remote_id",
                type: "string",
                isIndexed: true,
              },
              { name: "row_number", type: "number", isIndexed: true },
              { name: "status", type: "string", isIndexed: true },
              { name: "raw_json", type: "string" },
              { name: "normalized_json", type: "string", isOptional: true },
              { name: "error_json", type: "string", isOptional: true },
              { name: "warning_json", type: "string", isOptional: true },
              {
                name: "created_record_remote_id",
                type: "string",
                isOptional: true,
              },
              { name: "created_at", type: "number" },
              { name: "updated_at", type: "number" },
            ],
          }),
          { table: "import_job_rows" },
        ),
      ],
    },
    {
      toVersion: 47,
      steps: [
        addColumns({
          table: "money_accounts",
          columns: [
            {
              name: "opening_balance_amount",
              type: "number",
              isOptional: true,
            },
            {
              name: "opening_balance_direction",
              type: "string",
              isOptional: true,
            },
          ],
        }),
        unsafeExecuteSql(`
          UPDATE money_accounts
          SET opening_balance_amount = current_balance,
              opening_balance_direction =
                CASE
                  WHEN current_balance < 0 THEN 'out'
                  ELSE 'in'
                END
          WHERE opening_balance_amount IS NULL;
        `),
      ],
    },
    {
      toVersion: 48,
      steps: [
        addColumns({
          table: "accounts",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "business_profiles",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "account_members",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "account_roles",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "account_role_permissions",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "account_user_roles",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "contacts",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "money_accounts",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "products",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "inventory_movements",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "billing_documents",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "billing_document_items",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "ledger_entries",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "transactions",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "orders",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "order_lines",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "pos_sales",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "emi_plans",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "emi_installments",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "installment_payment_links",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "budget_plans",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "audit_events",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
        addColumns({
          table: "bill_photos",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 49,
      steps: [
        addColumns({
          table: "app_settings",
          columns: [{ name: "sync_enabled", type: "boolean", isOptional: true }],
        }),
        unsafeExecuteSql(`
          UPDATE app_settings
          SET sync_enabled = 0
          WHERE sync_enabled IS NULL;
        `),
      ],
    },
    {
      toVersion: 50,
      steps: [
        addColumns({
          table: "categories",
          columns: [{ name: "server_revision", type: "string", isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 51,
      steps: [
        createTable({
          name: "sync_identity_bindings",
          columns: [
            { name: "binding_type", type: "string", isIndexed: true },
            { name: "local_user_remote_id", type: "string", isIndexed: true },
            { name: "remote_user_remote_id", type: "string", isIndexed: true },
            {
              name: "local_account_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            {
              name: "remote_account_remote_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    ],
});
