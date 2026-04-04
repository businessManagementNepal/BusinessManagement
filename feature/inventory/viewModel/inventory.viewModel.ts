import {
  InventoryAdjustmentReasonValue,
  InventoryMovement,
  InventoryMovementTypeValue,
  InventoryStockItem,
} from "@/feature/inventory/types/inventory.types";

export type InventoryMovementFormState = {
  productRemoteId: string;
  quantity: string;
  unitRate: string;
  reason: InventoryAdjustmentReasonValue | "";
  movementDate: string;
  remark: string;
};

export type InventorySummaryState = {
  totalProducts: number;
  lowStockCount: number;
  stockValue: number;
};

export interface InventoryViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  currencyCode: string;
  countryCode: string | null;
  currencyPrefix: string;
  summary: InventorySummaryState;
  stockItems: InventoryStockItem[];
  recentMovements: InventoryMovement[];
  productOptions: { label: string; value: string }[];
  canManage: boolean;
  isEditorVisible: boolean;
  editorType: InventoryMovementTypeValue;
  editorTitle: string;
  form: InventoryMovementFormState;
  adjustmentReasonOptions: readonly { label: string; value: InventoryAdjustmentReasonValue }[];
  onRefresh: () => Promise<void>;
  onOpenStockIn: () => void;
  onOpenAdjustment: () => void;
  onCloseEditor: () => void;
  onFormChange: (field: keyof InventoryMovementFormState, value: string) => void;
  onSubmit: () => Promise<void>;
}
