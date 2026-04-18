import type { BillingDocument } from "@/feature/billing/types/billing.types";
import type { PosSaleWorkflowStatusValue } from "./posSale.constant";

export type PosSaleHistoryItem = {
  document: BillingDocument;
  workflowStatus: PosSaleWorkflowStatusValue;
  lastErrorMessage: string | null;
};
