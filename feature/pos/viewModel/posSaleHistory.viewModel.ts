import type { PosSaleHistoryItem } from "../types/posSaleHistory.entity.types";

export interface PosSaleHistoryViewModel {
  receipts: readonly PosSaleHistoryItem[];
  isLoading: boolean;
  searchTerm: string;
  selectedReceipt: PosSaleHistoryItem | null;
  activeModal: "history" | "detail" | "none";
  errorMessage: string | null;
  onSearchChange: (value: string) => void;
  onReceiptPress: (receipt: PosSaleHistoryItem) => void;
  onPrintReceipt: (receipt: PosSaleHistoryItem) => Promise<void>;
  onShareReceipt: (receipt: PosSaleHistoryItem) => Promise<void>;
  onOpenHistory: () => Promise<void>;
  onCloseHistory: () => void;
  onCloseDetail: () => void;
  onLoadReceipts: () => Promise<void>;
}
