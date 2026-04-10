import { tableSchema } from "@nozbe/watermelondb";

export const billingDocumentAllocationsTable = tableSchema({
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
});
