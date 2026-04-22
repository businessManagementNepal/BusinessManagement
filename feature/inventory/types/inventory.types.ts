import { Result } from "@/shared/types/result.types";

export const InventoryMovementType = {
  OpeningStock: "opening_stock",
  StockIn: "stock_in",
  SaleOut: "sale_out",
  Adjustment: "adjustment",
} as const;

export type InventoryMovementTypeValue =
  (typeof InventoryMovementType)[keyof typeof InventoryMovementType];

export const InventoryMovementSourceModule = {
  Orders: "orders",
  Pos: "pos",
  Manual: "manual",
  Products: "products",
} as const;

export type InventoryMovementSourceModuleValue =
  (typeof InventoryMovementSourceModule)[keyof typeof InventoryMovementSourceModule];

export const InventoryAdjustmentReason = {
  Damage: "damage",
  Expired: "expired",
  Correction: "correction",
  Lost: "lost",
  Other: "other",
} as const;

export type InventoryAdjustmentReasonValue =
  (typeof InventoryAdjustmentReason)[keyof typeof InventoryAdjustmentReason];

export type InventoryStockItem = {
  productRemoteId: string;
  accountRemoteId: string;
  name: string;
  categoryName: string | null;
  skuOrBarcode: string | null;
  stockQuantity: number;
  unitLabel: string | null;
  costPrice: number | null;
  stockValue: number;
  isLowStock: boolean;
};

export type InventoryMovement = {
  remoteId: string;
  accountRemoteId: string;
  productRemoteId: string;
  productName: string;
  productUnitLabel: string | null;
  type: InventoryMovementTypeValue;
  quantity: number;
  deltaQuantity: number;
  unitRate: number | null;
  totalValue: number | null;
  reason: InventoryAdjustmentReasonValue | null;
  remark: string | null;
  sourceModule: string | null;
  sourceRemoteId: string | null;
  sourceLineRemoteId: string | null;
  sourceAction: string | null;
  movementAt: number;
  createdAt: number;
  updatedAt: number;
};

export type InventorySnapshot = {
  stockItems: InventoryStockItem[];
  recentMovements: InventoryMovement[];
};

export type SaveInventoryMovementPayload = {
  remoteId: string;
  accountRemoteId: string;
  productRemoteId: string;
  type: InventoryMovementTypeValue;
  quantity: number;
  unitRate: number | null;
  reason: InventoryAdjustmentReasonValue | null;
  remark: string | null;
  sourceModule?: string | null;
  sourceRemoteId?: string | null;
  sourceLineRemoteId?: string | null;
  sourceAction?: string | null;
  movementAt: number;
};

export type InventorySourceLookupParams = {
  accountRemoteId: string;
  sourceModule: string;
  sourceRemoteId: string;
};

export const InventoryErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  ProductNotFound: "PRODUCT_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type InventoryError = {
  type: (typeof InventoryErrorType)[keyof typeof InventoryErrorType];
  message: string;
};

export const InventoryDatabaseError: InventoryError = {
  type: InventoryErrorType.DatabaseError,
  message: "Unable to process inventory right now. Please try again.",
};

export const InventoryValidationError = (message: string): InventoryError => ({
  type: InventoryErrorType.ValidationError,
  message,
});

export const InventoryProductNotFoundError: InventoryError = {
  type: InventoryErrorType.ProductNotFound,
  message: "The selected product was not found.",
};

export const InventoryUnknownError: InventoryError = {
  type: InventoryErrorType.UnknownError,
  message: "An unexpected inventory error occurred.",
};

export type InventorySnapshotResult = Result<InventorySnapshot, InventoryError>;
export type InventoryMovementResult = Result<InventoryMovement, InventoryError>;
export type InventoryMovementsResult = Result<InventoryMovement[], InventoryError>;
export type InventoryOperationResult = Result<boolean, InventoryError>;

export const INVENTORY_ADJUSTMENT_REASON_OPTIONS = [
  { label: "Damage", value: InventoryAdjustmentReason.Damage },
  { label: "Expired", value: InventoryAdjustmentReason.Expired },
  { label: "Count Correction", value: InventoryAdjustmentReason.Correction },
  { label: "Lost", value: InventoryAdjustmentReason.Lost },
  { label: "Other", value: InventoryAdjustmentReason.Other },
] as const;
