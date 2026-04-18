import { Result } from "@/shared/types/result.types";
import {
  PosBootstrap,
  PosCartLine,
  PosLedgerEffect,
  PosReceipt,
  PosTotals,
} from "./pos.entity.types";
import type { PosSaleHistoryItem } from "./posSaleHistory.entity.types";

export const PosErrorType = {
  Validation: "VALIDATION",
  ContextRequired: "CONTEXT_REQUIRED",
  ProductNotFound: "PRODUCT_NOT_FOUND",
  OutOfStock: "OUT_OF_STOCK",
  SlotNotFound: "SLOT_NOT_FOUND",
  CartLineNotFound: "CART_LINE_NOT_FOUND",
  EmptyCart: "EMPTY_CART",
  UnsupportedOperation: "UNSUPPORTED_OPERATION",
  Unknown: "UNKNOWN",
} as const;

export type PosError = {
  type: (typeof PosErrorType)[keyof typeof PosErrorType];
  message: string;
};

export type PosBootstrapResult = Result<PosBootstrap, PosError>;
export type PosCartLinesResult = Result<readonly PosCartLine[], PosError>;
export type PosTotalsResult = Result<PosTotals, PosError>;
export type PosPaymentResult = Result<PosReceipt, PosError>;
export type PosLedgerEffectResult = Result<PosLedgerEffect, PosError>;
export type PosOperationResult = Result<boolean, PosError>;
export type PosSaleHistoryResult = Result<readonly PosSaleHistoryItem[], PosError>;
