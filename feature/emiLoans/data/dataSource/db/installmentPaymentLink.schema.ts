import { tableSchema } from "@nozbe/watermelondb";

export const installmentPaymentLinksTable = tableSchema({
  name: "installment_payment_links",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "plan_remote_id", type: "string", isIndexed: true },
    { name: "installment_remote_id", type: "string", isIndexed: true },
    { name: "payment_record_type", type: "string", isIndexed: true },
    { name: "payment_record_remote_id", type: "string", isIndexed: true },
    { name: "payment_direction", type: "string", isIndexed: true },
    { name: "amount", type: "number" },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
