import type { BillingDocument } from "@/feature/billing/types/billing.types";
import type { PosReceipt } from "./pos.entity.types";
import type { PosSaleWorkflowStatusValue } from "./posSale.constant";

export type PosSaleHistoryItem = {
  document: BillingDocument;
  receipt: PosReceipt;
  workflowStatus: PosSaleWorkflowStatusValue;
  lastErrorMessage: string | null;
};
