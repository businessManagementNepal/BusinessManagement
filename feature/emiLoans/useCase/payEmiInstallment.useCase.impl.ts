import { EmiRepository } from "@/feature/emiLoans/data/repository/emi.repository";
import { LedgerRepository } from "@/feature/ledger/data/repository/ledger.repository";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import {
  TransactionDirection,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  EmiPaymentDirection,
  EmiPlanMode,
  InstallmentPaymentRecordType,
} from "@/feature/emiLoans/types/emi.entity.types";
import {
  EmiAlreadyPaidError,
  EmiInstallmentNotFoundError,
  EmiValidationError,
} from "@/feature/emiLoans/types/emi.error.types";
import { createLocalRemoteId } from "@/feature/emiLoans/viewModel/emi.shared";
import { PayEmiInstallmentUseCase } from "./payEmiInstallment.useCase";

export const createPayEmiInstallmentUseCase = (
  emiRepository: EmiRepository,
  transactionRepository: TransactionRepository,
  ledgerRepository: LedgerRepository,
): PayEmiInstallmentUseCase => ({
  async execute({ planRemoteId, installmentRemoteId, paidAt }) {
    const normalizedPlanRemoteId = planRemoteId.trim();
    const normalizedInstallmentRemoteId = installmentRemoteId.trim();

    if (!normalizedPlanRemoteId || !normalizedInstallmentRemoteId) {
      return {
        success: false,
        error: EmiValidationError("Plan and installment are required."),
      };
    }

    if (!Number.isFinite(paidAt) || paidAt <= 0) {
      return {
        success: false,
        error: EmiValidationError("A valid payment date is required."),
      };
    }

    const planDetailResult = await emiRepository.getPlanDetailByRemoteId(
      normalizedPlanRemoteId,
    );

    if (!planDetailResult.success) {
      return planDetailResult;
    }

    const installment = planDetailResult.value.installments.find(
      (entry) => entry.remoteId === normalizedInstallmentRemoteId,
    );

    if (!installment) {
      return { success: false, error: EmiInstallmentNotFoundError };
    }

    if (installment.status === "paid") {
      return { success: false, error: EmiAlreadyPaidError };
    }

    const { plan } = planDetailResult.value;
    let paymentRecordType: "transaction" | "ledger";
    let paymentRecordRemoteId: string;

    if (plan.planMode === EmiPlanMode.Personal) {
      paymentRecordType = InstallmentPaymentRecordType.Transaction;
      paymentRecordRemoteId = createLocalRemoteId("txn_emi_payment");

      const transactionResult = await transactionRepository.saveTransaction({
        remoteId: paymentRecordRemoteId,
        ownerUserRemoteId: plan.ownerUserRemoteId,
        accountRemoteId: plan.linkedAccountRemoteId,
        accountDisplayNameSnapshot: plan.linkedAccountDisplayNameSnapshot,
        transactionType: TransactionType.Expense,
        direction: TransactionDirection.Out,
        title: `${plan.title} - Installment ${installment.installmentNumber}`,
        amount: installment.amount,
        currencyCode: plan.currencyCode,
        categoryLabel: "EMI Payment",
        note: plan.note,
        happenedAt: paidAt,
      });

      if (!transactionResult.success) {
        return {
          success: false,
          error: {
            type: "UNKNOWN_ERROR",
            message: transactionResult.error.message,
          },
        };
      }
    } else {
      paymentRecordType = InstallmentPaymentRecordType.Ledger;
      paymentRecordRemoteId = createLocalRemoteId("ledger_emi_payment");

      const ledgerResult = await ledgerRepository.saveLedgerEntry({
        remoteId: paymentRecordRemoteId,
        businessAccountRemoteId: plan.businessAccountRemoteId ?? plan.linkedAccountRemoteId,
        ownerUserRemoteId: plan.ownerUserRemoteId,
        partyName: plan.counterpartyName || plan.title,
        partyPhone: plan.counterpartyPhone,
        entryType:
          plan.paymentDirection === EmiPaymentDirection.Collect
            ? LedgerEntryType.Collection
            : LedgerEntryType.PaymentOut,
        balanceDirection:
          plan.paymentDirection === EmiPaymentDirection.Collect
            ? LedgerBalanceDirection.Receive
            : LedgerBalanceDirection.Pay,
        title: `${plan.title} - Installment ${installment.installmentNumber}`,
        amount: installment.amount,
        currencyCode: plan.currencyCode,
        note: plan.note,
        happenedAt: paidAt,
        dueAt: null,
        paymentMode: null,
        referenceNumber: null,
        reminderAt: null,
        attachmentUri: null,
        settledAgainstEntryRemoteId: null,
        linkedTransactionRemoteId: null,
        settlementAccountRemoteId: plan.linkedAccountRemoteId,
        settlementAccountDisplayNameSnapshot: plan.linkedAccountDisplayNameSnapshot,
      });

      if (!ledgerResult.success) {
        return {
          success: false,
          error: {
            type: "UNKNOWN_ERROR",
            message: ledgerResult.error.message,
          },
        };
      }
    }

    const completePaymentResult = await emiRepository.completeInstallmentPayment({
      linkRemoteId: createLocalRemoteId("installment_link"),
      planRemoteId: normalizedPlanRemoteId,
      installmentRemoteId: normalizedInstallmentRemoteId,
      paymentRecordType,
      paymentRecordRemoteId,
      paymentDirection: plan.paymentDirection,
      amount: installment.amount,
      paidAt,
    });

    if (completePaymentResult.success && completePaymentResult.value) {
      return completePaymentResult;
    }

    const rollbackResult =
      paymentRecordType === InstallmentPaymentRecordType.Transaction
        ? await transactionRepository.deleteTransactionByRemoteId(paymentRecordRemoteId)
        : await ledgerRepository.deleteLedgerEntryByRemoteId(paymentRecordRemoteId);

    const rollbackErrorMessage = !rollbackResult.success
      ? rollbackResult.error.message
      : !rollbackResult.value
        ? "Payment record rollback was not confirmed."
        : null;

    if (!completePaymentResult.success) {
      if (!rollbackErrorMessage) {
        return completePaymentResult;
      }

      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: `${completePaymentResult.error.message} Rollback failed: ${rollbackErrorMessage}`,
        },
      };
    }

    return {
      success: false,
      error: EmiValidationError(
        rollbackErrorMessage
          ? `Unable to complete EMI payment. Rollback failed: ${rollbackErrorMessage}`
          : "Unable to complete EMI payment.",
      ),
    };
  },
});
