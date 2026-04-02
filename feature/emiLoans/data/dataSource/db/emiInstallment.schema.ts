import { tableSchema } from "@nozbe/watermelondb";

export const emiInstallmentsTable = tableSchema({
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
});
