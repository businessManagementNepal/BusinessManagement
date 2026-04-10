import {
    BillingDocumentType,
    BillingDocumentTypeValue,
    BillingOperationResult,
    BillingValidationError,
} from "@/feature/billing/types/billing.types";
import { SaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase";
import {
    SaveTransactionPayload,
    TransactionDirection,
    TransactionDirectionValue,
    TransactionSourceModule,
    TransactionType,
    TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import {
    PayBillingDocumentPayload,
    PayBillingDocumentUseCase,
} from "./payBillingDocument.useCase";

const createTransactionRemoteId = (): string =>
  `txn-billing-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createAllocationRemoteId = (): string =>
  `alloc-billing-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const resolveTransactionType = (
  documentType: BillingDocumentTypeValue,
): TransactionTypeValue =>
  documentType === BillingDocumentType.Invoice
    ? TransactionType.Income
    : TransactionType.Expense;

const resolveTransactionDirection = (
  documentType: BillingDocumentTypeValue,
): TransactionDirectionValue =>
  documentType === BillingDocumentType.Invoice
    ? TransactionDirection.In
    : TransactionDirection.Out;

export const createPayBillingDocumentUseCase = (
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase,
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase,
  saveBillingDocumentAllocationsUseCase: SaveBillingDocumentAllocationsUseCase,
): PayBillingDocumentUseCase => ({
  async execute(
    payload: PayBillingDocumentPayload,
  ): Promise<BillingOperationResult> {
    if (!payload.billingDocumentRemoteId.trim()) {
      return {
        success: false,
        error: BillingValidationError("Billing document id is required."),
      };
    }

    if (!payload.ownerUserRemoteId.trim()) {
      return {
        success: false,
        error: BillingValidationError("User context is required."),
      };
    }

    if (!payload.accountRemoteId.trim()) {
      return {
        success: false,
        error: BillingValidationError("Account context is required."),
      };
    }

    if (!payload.accountDisplayNameSnapshot.trim()) {
      return {
        success: false,
        error: BillingValidationError("Account display name is required."),
      };
    }

    if (!payload.settlementMoneyAccountRemoteId.trim()) {
      return {
        success: false,
        error: BillingValidationError("Settlement money account is required."),
      };
    }

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      return {
        success: false,
        error: BillingValidationError(
          "Payment amount must be greater than zero.",
        ),
      };
    }

    const transactionRemoteId = createTransactionRemoteId();
    const transactionPayload: SaveTransactionPayload = {
      remoteId: transactionRemoteId,
      ownerUserRemoteId: payload.ownerUserRemoteId.trim(),
      accountRemoteId: payload.accountRemoteId,
      accountDisplayNameSnapshot: payload.accountDisplayNameSnapshot,
      transactionType: resolveTransactionType(payload.documentType),
      direction: resolveTransactionDirection(payload.documentType),
      title:
        payload.documentType === BillingDocumentType.Invoice
          ? `Received for ${payload.documentNumber}`
          : `Paid for ${payload.documentNumber}`,
      amount: payload.amount,
      currencyCode: null,
      categoryLabel: "Billing",
      note: payload.note,
      happenedAt: payload.settledAt,
      settlementMoneyAccountRemoteId: payload.settlementMoneyAccountRemoteId,
      settlementMoneyAccountDisplayNameSnapshot:
        payload.settlementMoneyAccountDisplayNameSnapshot,
      sourceModule: TransactionSourceModule.Billing,
      sourceRemoteId: payload.billingDocumentRemoteId,
      sourceAction: "document_payment",
      idempotencyKey: `billing:${payload.billingDocumentRemoteId}:payment:${transactionRemoteId}`,
      postingStatus: undefined,
    };

    const transactionResult =
      await postBusinessTransactionUseCase.execute(transactionPayload);

    if (!transactionResult.success) {
      return {
        success: false,
        error: BillingValidationError(
          `Payment posting failed: ${transactionResult.error.message}`,
        ),
      };
    }

    const allocationResult =
      await saveBillingDocumentAllocationsUseCase.execute([
        {
          remoteId: createAllocationRemoteId(),
          accountRemoteId: payload.accountRemoteId,
          documentRemoteId: payload.billingDocumentRemoteId,
          settlementLedgerEntryRemoteId: null,
          settlementTransactionRemoteId: transactionRemoteId,
          amount: payload.amount,
          settledAt: payload.settledAt,
          note: payload.note,
        },
      ]);

    if (!allocationResult.success) {
      await deleteBusinessTransactionUseCase.execute(transactionRemoteId);
      return {
        success: false,
        error: BillingValidationError(
          `Payment allocation failed: ${allocationResult.error.message}`,
        ),
      };
    }

    return { success: true, value: true };
  },
});
