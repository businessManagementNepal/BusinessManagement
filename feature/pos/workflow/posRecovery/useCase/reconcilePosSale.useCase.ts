import type { PosError } from "@/feature/pos/types/pos.error.types";
import type {
  PosSaleHistoryItem,
  PosSaleReconciliation,
} from "@/feature/pos/types/posSaleHistory.entity.types";
import type { Result } from "@/shared/types/result.types";

export type ReconcilePosSaleInput = {
  sale: PosSaleHistoryItem["sale"];
};

export type ReconcilePosSaleResult = Result<PosSaleReconciliation, PosError>;

export interface ReconcilePosSaleUseCase {
  execute(input: ReconcilePosSaleInput): Promise<ReconcilePosSaleResult>;
}
