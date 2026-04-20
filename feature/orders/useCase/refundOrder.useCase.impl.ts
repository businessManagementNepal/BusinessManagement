import { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import { GetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase";
import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import { LedgerEntryType } from "@/feature/ledger/types/ledger.entity.types";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { SaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase";
import {
  OrderOperationResult,
  OrderValidationError,
} from "@/feature/orders/types/order.types";
import {
  buildOrderRefundBillingDocumentNumber,
  buildOrderRefundBillingDocumentPayload,
  buildOrderRefundBillingDocumentRemoteId,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import { calculateOrderCommercialSettlementSnapshot } from "@/feature/orders/utils/orderCommercialProjection.util";
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import * as Crypto from "expo-crypto";
import { EnsureOrderBillingAndDueLinksUseCase } from "./ensureOrderBillingAndDueLinks.useCase";
import { RefundOrderUseCase } from "./refundOrder.useCase";

const MONEY_EPSILON = 0.0001;

const buildRollbackAwareValidationError = (params: {
  primaryMessage: string;
  rollbackMessage: string | null;
}) =>
  OrderValidationError(
    params.rollbackMessage
      ? `${params.primaryMessage} Rollback failed: ${params.rollbackMessage}`
      : params.primaryMessage,
  );

export const createRefundOrderUseCase = (params: {
  orderRepository?: unknown;
  addTransactionUseCase?: unknown;
  getBillingOverviewUseCase?: GetBillingOverviewUseCase;
  getLedgerEntriesUseCase?: GetLedgerEntriesUseCase;
  getTransactionsUseCase?: GetTransactionsUseCase;
  saveBillingDocumentUseCase?: SaveBillingDocumentUseCase;
  deleteBillingDocumentUseCase?: DeleteBillingDocumentUseCase;
  saveLedgerEntryWithSettlementUseCase?: SaveLedgerEntryWithSettlementUseCase;
  ensureOrderBillingAndDueLinksUseCase?: EnsureOrderBillingAndDueLinksUseCase;
}): RefundOrderUseCase => ({
  async execute({
    orderRemoteId,
    orderNumber,
    ownerUserRemoteId,
    accountRemoteId,
    accountDisplayNameSnapshot,
    currencyCode,
    amount,
    happenedAt,
    settlementMoneyAccountRemoteId,
    settlementMoneyAccountDisplayNameSnapshot,
    note,
  }): Promise<OrderOperationResult> {
    const normalizedOrderRemoteId = orderRemoteId.trim();
    const normalizedOrderNumber = orderNumber.trim();
    const normalizedOwnerUserRemoteId = ownerUserRemoteId.trim();
    const normalizedAccountRemoteId = accountRemoteId.trim();
    const normalizedAccountDisplayNameSnapshot =
      accountDisplayNameSnapshot.trim();
    const normalizedCurrencyCode = currencyCode?.trim().toUpperCase() ?? null;
    const normalizedSettlementMoneyAccountRemoteId =
      settlementMoneyAccountRemoteId.trim();
    const normalizedSettlementMoneyAccountLabel =
      settlementMoneyAccountDisplayNameSnapshot.trim();

    if (!normalizedOrderRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Order remote id is required."),
      };
    }

    if (!normalizedOrderNumber) {
      return {
        success: false,
        error: OrderValidationError("Order number is required."),
      };
    }

    if (!normalizedOwnerUserRemoteId || !normalizedAccountRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Active account context is required."),
      };
    }

    if (!normalizedAccountDisplayNameSnapshot) {
      return {
        success: false,
        error: OrderValidationError("Account label is required."),
      };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        error: OrderValidationError("Amount must be greater than zero."),
      };
    }

    if (!Number.isFinite(happenedAt) || happenedAt <= 0) {
      return {
        success: false,
        error: OrderValidationError("Refund date is required."),
      };
    }

    if (!normalizedSettlementMoneyAccountRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Money account is required."),
      };
    }

    if (!normalizedSettlementMoneyAccountLabel) {
      return {
        success: false,
        error: OrderValidationError("Money account label is required."),
      };
    }

    if (
      !params.getBillingOverviewUseCase ||
      !params.getLedgerEntriesUseCase ||
      !params.getTransactionsUseCase ||
      !params.saveBillingDocumentUseCase ||
      !params.deleteBillingDocumentUseCase ||
      !params.saveLedgerEntryWithSettlementUseCase ||
      !params.ensureOrderBillingAndDueLinksUseCase
    ) {
      return {
        success: false,
        error: OrderValidationError(
          "Refund commercial dependencies are not configured.",
        ),
      };
    }

    const ensureResult =
      await params.ensureOrderBillingAndDueLinksUseCase.execute(
        normalizedOrderRemoteId,
      );

    if (!ensureResult.success) {
      return { success: false, error: ensureResult.error };
    }

    const [billingOverviewResult, ledgerEntriesResult, transactionsResult] =
      await Promise.all([
        params.getBillingOverviewUseCase.execute(normalizedAccountRemoteId),
        params.getLedgerEntriesUseCase.execute({
          businessAccountRemoteId: normalizedAccountRemoteId,
        }),
        params.getTransactionsUseCase.execute({
          ownerUserRemoteId: normalizedOwnerUserRemoteId,
          accountRemoteId: normalizedAccountRemoteId,
        }),
      ]);

    if (!billingOverviewResult.success) {
      return {
        success: false,
        error: OrderValidationError(billingOverviewResult.error.message),
      };
    }

    if (!ledgerEntriesResult.success) {
      return {
        success: false,
        error: OrderValidationError(ledgerEntriesResult.error.message),
      };
    }

    if (!transactionsResult.success) {
      return {
        success: false,
        error: OrderValidationError(transactionsResult.error.message),
      };
    }

    const settlementSnapshot = calculateOrderCommercialSettlementSnapshot({
      order: ensureResult.value.order,
      billingDocuments: billingOverviewResult.value.documents,
      ledgerEntries: ledgerEntriesResult.value,
      transactions: transactionsResult.value,
    });

    if (!settlementSnapshot.dueEntry) {
      return {
        success: false,
        error: OrderValidationError(
          "The linked ledger due entry for this order could not be found.",
        ),
      };
    }

    if (settlementSnapshot.paidAmount <= MONEY_EPSILON) {
      return {
        success: false,
        error: OrderValidationError(
          "This order has no paid amount available for refund.",
        ),
      };
    }

    if (amount > settlementSnapshot.paidAmount + MONEY_EPSILON) {
      return {
        success: false,
        error: OrderValidationError(
          "Refund amount exceeds the net paid amount for this order.",
        ),
      };
    }

    const refundLedgerEntryRemoteId = Crypto.randomUUID();
    const refundBillingDocumentRemoteId = buildOrderRefundBillingDocumentRemoteId(
      {
        orderRemoteId: ensureResult.value.order.remoteId,
        refundLedgerEntryRemoteId,
      },
    );

    const saveRefundDocumentResult =
      await params.saveBillingDocumentUseCase.execute(
        buildOrderRefundBillingDocumentPayload({
          order: ensureResult.value.order,
          contact: ensureResult.value.contact,
          refundBillingDocumentRemoteId,
          refundLedgerEntryRemoteId,
          amount,
          happenedAt,
          note: note?.trim() || null,
        }),
      );

    if (!saveRefundDocumentResult.success) {
      return {
        success: false,
        error: OrderValidationError(saveRefundDocumentResult.error.message),
      };
    }

    const settlementResult =
      await params.saveLedgerEntryWithSettlementUseCase.execute({
        mode: "create",
        businessAccountDisplayName: normalizedAccountDisplayNameSnapshot,
        selectedSettlementAccountRemoteId:
          normalizedSettlementMoneyAccountRemoteId,
        ledgerEntry: {
          remoteId: refundLedgerEntryRemoteId,
          businessAccountRemoteId: normalizedAccountRemoteId,
          ownerUserRemoteId: normalizedOwnerUserRemoteId,
          partyName: ensureResult.value.contact.fullName,
          partyPhone: ensureResult.value.contact.phoneNumber ?? null,
          contactRemoteId: ensureResult.value.contact.remoteId,
          entryType: LedgerEntryType.PaymentOut,
          balanceDirection: settlementSnapshot.dueEntry.balanceDirection,
          title: `Order Refund ${normalizedOrderNumber}`,
          amount,
          currencyCode:
            normalizedCurrencyCode && normalizedCurrencyCode.length === 3
              ? normalizedCurrencyCode
              : null,
          note: note?.trim() || null,
          happenedAt,
          dueAt: null,
          paymentMode: null,
          referenceNumber: buildOrderRefundBillingDocumentNumber({
            orderNumber: normalizedOrderNumber,
            refundLedgerEntryRemoteId,
          }),
          reminderAt: null,
          attachmentUri: null,
          settledAgainstEntryRemoteId: settlementSnapshot.dueEntry.remoteId,
          linkedDocumentRemoteId: refundBillingDocumentRemoteId,
          linkedTransactionRemoteId: null,
          settlementAccountRemoteId: null,
          settlementAccountDisplayNameSnapshot: null,
        },
        existingLedgerEntries: ledgerEntriesResult.value,
        settlementCandidates: [],
      });

    if (!settlementResult.success) {
      const rollbackResult = await params.deleteBillingDocumentUseCase.execute(
        refundBillingDocumentRemoteId,
      );

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: settlementResult.error.message,
          rollbackMessage: rollbackResult.success
            ? null
            : rollbackResult.error.message,
        }),
      };
    }

    return { success: true, value: true };
  },
});
