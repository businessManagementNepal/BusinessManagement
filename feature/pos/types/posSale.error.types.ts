import type { Result } from "@/shared/types/result.types";
import type { PosSaleRecord } from "./posSale.entity.types";

export const PosSaleErrorType = {
  Validation: "VALIDATION",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  Unknown: "UNKNOWN",
} as const;

export type PosSaleError = {
  type: (typeof PosSaleErrorType)[keyof typeof PosSaleErrorType];
  message: string;
};

export type PosSaleResult = Result<PosSaleRecord, PosSaleError>;
export type PosSaleLookupResult = Result<PosSaleRecord | null, PosSaleError>;
export type PosSaleOperationResult = Result<boolean, PosSaleError>;
