import { GetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { SaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase";
import {
  OrderOperationResult,
  OrderValidationError,
} from "@/feature/orders/types/order.types";
import {
  buildOrderBillingDocumentNumber,
  buildOrderLedgerDueEntryRemoteId,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import { findBillingDocumentForOrder } from "@/feature/orders/utils/orderCommercialProjection.util";
import { EnsureOrderBillingAndDueLinksUseCase } from "@/feature/orders/useCase/ensureOrderBillingAndDueLinks.useCase";
import * as Crypto from "expo-crypto";
import { OrderPaymentPostingWorkflowInput } from "../types/orderPaymentPostingWorkflow.types";
import { RunOrderPaymentPostingWorkflowUseCase } from "./runOrderPaymentPostingWorkflow.useCase";

const MONEY_EPSILON = 0.0001;

export const createRunOrderPaymentPostingWorkflowUseCase = (params: {
  getBillingOverviewUseCase: GetBillingOverviewUseCase;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  saveLedgerEntryWithSettlementUseCase: SaveLedgerEntryWithSettlementUseCase;
  ensureOrderBillingAndDueLinksUseCase: EnsureOrderBillingAndDueLinksUseCase;
}): RunOrderPaymentPostingWorkflowUseCase => ({
  async execute(
    input: OrderPaymentPostingWorkflowInput,
  ): Promise<OrderOperationResult> {
    const normalizedOrderRemoteId = input.orderRemoteId.trim();
    const normalizedOrderNumber = input.orderNumber.trim();
    const normalizedOwnerUserRemoteId = input.ownerUserRemoteId.trim();
    const normalizedAccountRemoteId = input.accountRemoteId.trim();
    const normalizedAccountDisplayNameSnapshot =
      input.accountDisplayNameSnapshot.trim();
    const normalizedCurrencyCode = input.currencyCode?.trim().toUpperCase() ?? null;
    const normalizedSettlementMoneyAccountRemoteId =
      input.settlementMoneyAccountRemoteId.trim();
    const normalizedSettlementMoneyAccountLabel =
      input.settlementMoneyAccountDisplayNameSnapshot.trim();

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

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return {
        success: false,
        error: OrderValidationError("Amount must be greater than zero."),
      };
    }

    if (!Number.isFinite(input.happenedAt) || input.happenedAt <= 0) {
      return {
        success: false,
        error: OrderValidationError("Payment date is required."),
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

    const ensureResult =
      await params.ensureOrderBillingAndDueLinksUseCase.execute(
        normalizedOrderRemoteId,
      );

    if (!ensureResult.success) {
      return { success: false, error: ensureResult.error };
    }

    const billingOverviewResult =
      await params.getBillingOverviewUseCase.execute(normalizedAccountRemoteId);

    if (!billingOverviewResult.success) {
      return {
        success: false,
        error: OrderValidationError(billingOverviewResult.error.message),
      };
    }

    const linkedBillingDocument =
      findBillingDocumentForOrder({
        orderRemoteId: ensureResult.value.order.remoteId,
        billingDocuments: billingOverviewResult.value.documents,
      }) ??
      billingOverviewResult.value.documents.find(
        (document) =>
          document.remoteId === ensureResult.value.billingDocumentRemoteId,
      ) ??
      null;

    if (!linkedBillingDocument) {
      return {
        success: false,
        error: OrderValidationError(
          "The linked billing document for this order could not be found.",
        ),
      };
    }

    if (linkedBillingDocument.outstandingAmount <= MONEY_EPSILON) {
      return {
        success: false,
        error: OrderValidationError("This order is already fully paid."),
      };
    }

    if (input.amount > linkedBillingDocument.outstandingAmount + MONEY_EPSILON) {
      return {
        success: false,
        error: OrderValidationError(
          "Payment amount exceeds the remaining balance due.",
        ),
      };
    }

    const ledgerEntriesResult = await params.getLedgerEntriesUseCase.execute({
      businessAccountRemoteId: normalizedAccountRemoteId,
    });

    if (!ledgerEntriesResult.success) {
      return {
        success: false,
        error: OrderValidationError(ledgerEntriesResult.error.message),
      };
    }

    const deterministicDueEntryRemoteId = buildOrderLedgerDueEntryRemoteId(
      ensureResult.value.order.remoteId,
    );
    const linkedDueEntry =
      ledgerEntriesResult.value.find(
        (entry) => entry.remoteId === ensureResult.value.ledgerDueEntryRemoteId,
      ) ??
      ledgerEntriesResult.value.find(
        (entry) => entry.remoteId === deterministicDueEntryRemoteId,
      ) ??
      null;

    if (!linkedDueEntry) {
      return {
        success: false,
        error: OrderValidationError(
          "The linked ledger due entry for this order could not be found.",
        ),
      };
    }

    const settlementResult =
      await params.saveLedgerEntryWithSettlementUseCase.execute({
        mode: "create",
        businessAccountDisplayName: normalizedAccountDisplayNameSnapshot,
        selectedSettlementAccountRemoteId:
          normalizedSettlementMoneyAccountRemoteId,
        ledgerEntry: {
          remoteId: Crypto.randomUUID(),
          businessAccountRemoteId: normalizedAccountRemoteId,
          ownerUserRemoteId: normalizedOwnerUserRemoteId,
          partyName: ensureResult.value.contact.fullName,
          partyPhone: ensureResult.value.contact.phoneNumber ?? null,
          contactRemoteId: ensureResult.value.contact.remoteId,
          entryType: LedgerEntryType.Collection,
          balanceDirection: LedgerBalanceDirection.Receive,
          title: `Order Payment ${normalizedOrderNumber}`,
          amount: input.amount,
          currencyCode:
            normalizedCurrencyCode && normalizedCurrencyCode.length === 3
              ? normalizedCurrencyCode
              : null,
          note: input.note?.trim() || null,
          happenedAt: input.happenedAt,
          dueAt: null,
          paymentMode: null,
          referenceNumber: buildOrderBillingDocumentNumber(normalizedOrderNumber),
          reminderAt: null,
          attachmentUri: null,
          settledAgainstEntryRemoteId: linkedDueEntry.remoteId,
          linkedDocumentRemoteId: linkedBillingDocument.remoteId,
          linkedTransactionRemoteId: null,
          settlementAccountRemoteId: null,
          settlementAccountDisplayNameSnapshot: null,
        },
        existingLedgerEntries: ledgerEntriesResult.value,
        settlementCandidates: [
          {
            remoteId: linkedDueEntry.remoteId,
            outstandingAmount: linkedBillingDocument.outstandingAmount,
          },
        ],
      });

    if (!settlementResult.success) {
      return {
        success: false,
        error: OrderValidationError(settlementResult.error.message),
      };
    }

    return { success: true, value: true };
  },
});
