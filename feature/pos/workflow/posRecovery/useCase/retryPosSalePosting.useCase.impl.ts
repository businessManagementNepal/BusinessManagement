import type { PosCustomer } from "@/feature/pos/types/pos.entity.types";
import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import { isPosSaleRetryableWorkflowStatus } from "@/feature/pos/utils/posSaleRecoveryStatus.util";
import type { RunPosCheckoutUseCase } from "@/feature/pos/workflow/posCheckout/useCase/runPosCheckout.useCase";
import type { RetryPosSalePostingUseCase } from "./retryPosSalePosting.useCase";

type CreateRetryPosSalePostingUseCaseParams = {
  runPosCheckoutUseCase: RunPosCheckoutUseCase;
};

const buildCustomerSnapshot = (sale: PosSaleRecord): PosCustomer | null => {
  const remoteId = sale.customerRemoteId?.trim() ?? "";
  const fullName = sale.customerNameSnapshot?.trim() ?? "";

  if (!remoteId || !fullName) {
    return null;
  }

  return {
    remoteId,
    fullName,
    phone: sale.customerPhoneSnapshot,
    address: null,
  };
};

const hasDueAmount = (sale: PosSaleRecord): boolean => {
  const paidAmount = sale.paymentParts.reduce((sum, part) => sum + part.amount, 0);

  return Number((sale.totalsSnapshot.grandTotal - paidAmount).toFixed(2)) > 0;
};

const validateSaleSnapshot = (sale: PosSaleRecord): string | null => {
  if (!sale.remoteId.trim()) {
    return "POS sale id is required for retry.";
  }

  if (!sale.businessAccountRemoteId.trim()) {
    return "Business account context is required for retry.";
  }

  if (!sale.ownerUserRemoteId.trim()) {
    return "Owner user context is required for retry.";
  }

  if (!sale.idempotencyKey.trim()) {
    return "POS sale idempotency key is required for retry.";
  }

  if (sale.cartLinesSnapshot.length === 0) {
    return "POS sale retry requires the original cart snapshot.";
  }

  const hasPaidPaymentPart = sale.paymentParts.some(
    (part) => part.amount > 0,
  );

  const hasInvalidPaidPart = sale.paymentParts.some(
    (part) => part.amount > 0 && !part.settlementAccountRemoteId?.trim(),
  );

  if (hasPaidPaymentPart && hasInvalidPaidPart) {
    return "POS sale retry requires the original settlement money account for paid payment parts.";
  }

  if (hasDueAmount(sale) && !buildCustomerSnapshot(sale)) {
    return "POS sale retry requires the original customer snapshot for unpaid balance.";
  }

  return null;
};

export const createRetryPosSalePostingUseCase = ({
  runPosCheckoutUseCase,
}: CreateRetryPosSalePostingUseCaseParams): RetryPosSalePostingUseCase => ({
  async execute({ sale }) {
    if (!isPosSaleRetryableWorkflowStatus(sale.workflowStatus)) {
      return {
        success: false,
        error: {
          type: PosErrorType.UnsupportedOperation,
          message: "Only pending, failed, or partially-posted POS sales can be retried.",
        },
      };
    }

    const validationMessage = validateSaleSnapshot(sale);
    if (validationMessage) {
      return {
        success: false,
        error: {
          type: PosErrorType.Validation,
          message: validationMessage,
        },
      };
    }

    const result = await runPosCheckoutUseCase.execute({
      idempotencyKey: sale.idempotencyKey,
      paymentParts: sale.paymentParts,
      selectedCustomer: buildCustomerSnapshot(sale),
      grandTotalSnapshot: sale.totalsSnapshot.grandTotal,
      cartLinesSnapshot: sale.cartLinesSnapshot,
      totalsSnapshot: sale.totalsSnapshot,
      activeBusinessAccountRemoteId: sale.businessAccountRemoteId,
      activeOwnerUserRemoteId: sale.ownerUserRemoteId,
      activeAccountCurrencyCode: sale.currencyCode,
      activeAccountCountryCode: sale.countryCode,
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          type:
            result.error.type === "CONTEXT_REQUIRED"
              ? PosErrorType.ContextRequired
              : result.error.type === "EMPTY_CART"
                ? PosErrorType.EmptyCart
                : result.error.type === "VALIDATION"
                  ? PosErrorType.Validation
                  : PosErrorType.Unknown,
          message: result.error.message,
        },
      };
    }

    return result;
  },
});
