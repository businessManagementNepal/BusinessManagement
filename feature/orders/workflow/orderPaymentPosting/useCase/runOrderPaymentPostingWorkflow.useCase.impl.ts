import {
    MoneyAccount,
    MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import {
    AuditModule,
    AuditOutcome,
    AuditSeverity,
} from "@/feature/audit/types/audit.entity.types";
import type { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
import { GetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase";
import {
    LedgerBalanceDirection,
    LedgerEntryType,
    LedgerPaymentMode,
    LedgerPaymentModeValue
} from "@/feature/ledger/types/ledger.entity.types";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { SaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase";
import { OrderValidationError } from "@/feature/orders/types/order.types";
import { EnsureOrderBillingAndDueLinksUseCase } from "@/feature/orders/useCase/ensureOrderBillingAndDueLinks.useCase";
import {
    buildOrderBillingDocumentNumber,
    buildOrderLedgerDueEntryRemoteId,
    buildOrderPaymentIdempotencyKey,
    buildOrderPaymentSettlementLedgerEntryRemoteId,
    buildOrderPaymentTransactionRemoteId,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import { findBillingDocumentForOrder } from "@/feature/orders/utils/orderCommercialProjection.util";
import {
    TransactionDirection,
    TransactionSourceModule,
    TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import {
    OrderPaymentPostingWorkflowInput,
    OrderPaymentPostingWorkflowResult,
} from "../types/orderPaymentPostingWorkflow.types";
import { RunOrderPaymentPostingWorkflowUseCase } from "./runOrderPaymentPostingWorkflow.useCase";

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

const rollbackCreatedOrderPaymentTransaction = async (params: {
  paymentTransactionRemoteId: string;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
}): Promise<string | null> => {
  const deleteResult = await params.deleteBusinessTransactionUseCase.execute(
    params.paymentTransactionRemoteId,
  );

  if (deleteResult.success) {
    return null;
  }

  return deleteResult.error.message;
};

const derivePaymentModeFromMoneyAccount = (
  moneyAccount: MoneyAccount,
): LedgerPaymentModeValue => {
  if (moneyAccount.type === MoneyAccountType.Cash) {
    return LedgerPaymentMode.Cash;
  }

  if (moneyAccount.type === MoneyAccountType.Wallet) {
    return LedgerPaymentMode.MobileWallet;
  }

  return LedgerPaymentMode.BankTransfer;
};

export const createRunOrderPaymentPostingWorkflowUseCase = (params: {
  getBillingOverviewUseCase: GetBillingOverviewUseCase;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  saveLedgerEntryWithSettlementUseCase: SaveLedgerEntryWithSettlementUseCase;
  ensureOrderBillingAndDueLinksUseCase: EnsureOrderBillingAndDueLinksUseCase;
  recordAuditEventUseCase: RecordAuditEventUseCase;
}): RunOrderPaymentPostingWorkflowUseCase => ({
  async execute(
    input: OrderPaymentPostingWorkflowInput,
  ): Promise<OrderPaymentPostingWorkflowResult> {
    const normalizedOrderRemoteId = input.orderRemoteId.trim();
    const normalizedOrderNumber = input.orderNumber.trim();
    const normalizedPaymentAttemptRemoteId =
      input.paymentAttemptRemoteId.trim();

    if (!normalizedPaymentAttemptRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Payment attempt id is required."),
      };
    }

    const normalizedOwnerUserRemoteId = input.ownerUserRemoteId.trim();
    const normalizedAccountRemoteId = input.accountRemoteId.trim();
    const normalizedAccountDisplayNameSnapshot =
      input.accountDisplayNameSnapshot.trim();
    const normalizedCurrencyCode = input.currencyCode?.trim().toUpperCase() ?? null;
    const normalizedSettlementMoneyAccountRemoteId =
      input.settlementMoneyAccountRemoteId.trim();
    const normalizedSettlementMoneyAccountLabel =
      input.settlementMoneyAccountDisplayNameSnapshot.trim();

    // Validation
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

    // Validate money account
    const moneyAccountsResult =
      await params.getMoneyAccountsUseCase.execute(normalizedAccountRemoteId);
    if (!moneyAccountsResult.success) {
      return {
        success: false,
        error: OrderValidationError(moneyAccountsResult.error.message),
      };
    }

    const settlementMoneyAccount = moneyAccountsResult.value
      .filter((moneyAccount) => moneyAccount.isActive)
      .find(
        (moneyAccount) =>
          moneyAccount.remoteId === normalizedSettlementMoneyAccountRemoteId,
      );

    if (!settlementMoneyAccount) {
      return {
        success: false,
        error: OrderValidationError("Choose a valid active money account."),
      };
    }

    // Ensure order billing and due links
    const ensureResult =
      await params.ensureOrderBillingAndDueLinksUseCase.execute(
        normalizedOrderRemoteId,
      );

    if (!ensureResult.success) {
      return {
        success: false,
        error: OrderValidationError(ensureResult.error.message),
      };
    }

    // Get billing overview
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

    // Check overpayment
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

    // Get ledger entries
    const ledgerEntriesResult = await params.getLedgerEntriesUseCase.execute({
      businessAccountRemoteId: normalizedAccountRemoteId,
    });

    if (!ledgerEntriesResult.success) {
      return {
        success: false,
        error: OrderValidationError(ledgerEntriesResult.error.message),
      };
    }

    // Find due entry
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

    // Create Orders-linked payment transaction
    const paymentTransactionRemoteId = buildOrderPaymentTransactionRemoteId(
      normalizedPaymentAttemptRemoteId,
    );

    const settlementLedgerEntryRemoteId =
      buildOrderPaymentSettlementLedgerEntryRemoteId(
        normalizedPaymentAttemptRemoteId,
      );

    const existingSettlementEntry =
      ledgerEntriesResult.value.find(
        (entry) => entry.remoteId === settlementLedgerEntryRemoteId,
      ) ?? null;

    const paymentTransactionResult = await params.postBusinessTransactionUseCase.execute({
      remoteId: paymentTransactionRemoteId,
      ownerUserRemoteId: normalizedOwnerUserRemoteId,
      accountRemoteId: normalizedAccountRemoteId,
      accountDisplayNameSnapshot: normalizedAccountDisplayNameSnapshot,
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: `Order Payment ${normalizedOrderNumber}`,
      amount: input.amount,
      currencyCode: normalizedCurrencyCode,
      categoryLabel: "Orders",
      note: input.note?.trim() || null,
      happenedAt: input.happenedAt,
      settlementMoneyAccountRemoteId: settlementMoneyAccount.remoteId,
      settlementMoneyAccountDisplayNameSnapshot: settlementMoneyAccount.name,
      sourceModule: TransactionSourceModule.Orders,
      sourceRemoteId: ensureResult.value.order.remoteId,
      sourceAction: "payment",
      idempotencyKey: buildOrderPaymentIdempotencyKey(
        normalizedPaymentAttemptRemoteId,
      ),
      contactRemoteId: ensureResult.value.contact.remoteId,
    });

    if (!paymentTransactionResult.success) {
      return {
        success: false,
        error: OrderValidationError(paymentTransactionResult.error.message),
      };
    }

    // Create settlement with external transaction
    const settlementResult =
      await params.saveLedgerEntryWithSettlementUseCase.execute({
        mode: existingSettlementEntry ? "update" : "create",
        businessAccountDisplayName: normalizedAccountDisplayNameSnapshot,
        selectedSettlementAccountRemoteId:
          normalizedSettlementMoneyAccountRemoteId,
        externalSettlementTransaction: {
          remoteId: paymentTransactionRemoteId,
          settlementMoneyAccountRemoteId: settlementMoneyAccount.remoteId,
          settlementMoneyAccountDisplayNameSnapshot: settlementMoneyAccount.name,
          paymentMode: derivePaymentModeFromMoneyAccount(settlementMoneyAccount),
        },
        ledgerEntry: {
          remoteId: settlementLedgerEntryRemoteId,
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
      const rollbackMessage =
        existingSettlementEntry === null
          ? await rollbackCreatedOrderPaymentTransaction({
              paymentTransactionRemoteId,
              deleteBusinessTransactionUseCase:
                params.deleteBusinessTransactionUseCase,
            })
          : null;

      const failedAuditResult = await params.recordAuditEventUseCase.execute({
        accountRemoteId: normalizedAccountRemoteId,
        ownerUserRemoteId: normalizedOwnerUserRemoteId,
        actorUserRemoteId: normalizedOwnerUserRemoteId,
        module: AuditModule.Orders,
        action: "order_payment_failed",
        sourceModule: "orders",
        sourceRemoteId: ensureResult.value.order.remoteId,
        sourceAction: "payment",
        outcome: AuditOutcome.Failure,
        severity: rollbackMessage ? AuditSeverity.Critical : AuditSeverity.Warning,
        summary: `Order payment failed: ${normalizedOrderNumber}`,
        metadataJson: JSON.stringify({
          orderRemoteId: ensureResult.value.order.remoteId,
          paymentAttemptRemoteId: normalizedPaymentAttemptRemoteId,
          paymentTransactionRemoteId,
          rollbackMessage,
          errorMessage: settlementResult.error.message,
        }),
      });

      if (!failedAuditResult.success) {
        // Keep the real settlement/rollback error as the returned business result.
        // Audit failure should not hide the actual payment workflow failure.
      }

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: settlementResult.error.message,
          rollbackMessage,
        }),
      };
    }

    const auditResult = await params.recordAuditEventUseCase.execute({
      accountRemoteId: normalizedAccountRemoteId,
      ownerUserRemoteId: normalizedOwnerUserRemoteId,
      actorUserRemoteId: normalizedOwnerUserRemoteId,
      module: AuditModule.Orders,
      action: "order_payment_posted",
      sourceModule: "orders",
      sourceRemoteId: ensureResult.value.order.remoteId,
      sourceAction: "payment",
      outcome: AuditOutcome.Success,
      severity: AuditSeverity.Info,
      summary: `Order payment posted: ${normalizedOrderNumber}`,
      metadataJson: JSON.stringify({
        orderRemoteId: ensureResult.value.order.remoteId,
        orderNumber: normalizedOrderNumber,
        amount: input.amount,
        paymentAttemptRemoteId: normalizedPaymentAttemptRemoteId,
        paymentTransactionRemoteId,
        settlementLedgerEntryRemoteId: settlementResult.value.remoteId,
        billingDocumentRemoteId: linkedBillingDocument.remoteId,
        ledgerDueEntryRemoteId: linkedDueEntry.remoteId,
        settlementMoneyAccountRemoteId: settlementMoneyAccount.remoteId,
      }),
    });

    if (!auditResult.success) {
      // Audit failure must not turn a completed payment into a user-facing failure.
      // The payment transaction and ledger settlement are already posted at this point.
    }

    return {
      success: true,
      value: {
        orderRemoteId: ensureResult.value.order.remoteId,
        paymentTransactionRemoteId,
        settlementLedgerEntryRemoteId: settlementResult.value.remoteId,
        billingDocumentRemoteId: linkedBillingDocument.remoteId,
        ledgerDueEntryRemoteId: linkedDueEntry.remoteId,
      },
    };
  },
});
