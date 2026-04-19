import type {
  PosSaleHistoryItem,
  PosSaleReconciliation,
} from "../types/posSaleHistory.entity.types";

export interface PosSaleHistoryViewModel {
  receipts: readonly PosSaleHistoryItem[];
  isLoading: boolean;
  searchTerm: string;
  selectedReceipt: PosSaleHistoryItem | null;
  activeModal: "history" | "detail" | "none";
  errorMessage: string | null;
  reconciliation: PosSaleReconciliation | null;
  isReconciling: boolean;
  isResolving: boolean;
  recoveryMessage: string | null;
  onSearchChange: (value: string) => void;
  onReceiptPress: (receipt: PosSaleHistoryItem) => void;
  onPrintReceipt: (receipt: PosSaleHistoryItem) => Promise<void>;
  onShareReceipt: (receipt: PosSaleHistoryItem) => Promise<void>;
  onOpenHistory: () => Promise<void>;
  onCloseHistory: () => void;
  onCloseDetail: () => void;
  onLoadReceipts: () => Promise<void>;
  onRefreshReconciliation: () => Promise<void>;
  onCleanupAbnormalSale: () => Promise<void>;
}
