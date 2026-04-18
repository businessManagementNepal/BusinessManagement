import type { Result } from "@/shared/types/result.types";
import type { RunPosCheckoutValue } from "./posCheckout.types";

export const PosCheckoutErrorType = {
  Validation: "VALIDATION",
  ContextRequired: "CONTEXT_REQUIRED",
  EmptyCart: "EMPTY_CART",
  IdempotencyConflict: "IDEMPOTENCY_CONFLICT",
  PostingFailed: "POSTING_FAILED",
  Unknown: "UNKNOWN",
} as const;

export type PosCheckoutError = {
  type: (typeof PosCheckoutErrorType)[keyof typeof PosCheckoutErrorType];
  message: string;
};

export type RunPosCheckoutResult = Result<RunPosCheckoutValue, PosCheckoutError>;
