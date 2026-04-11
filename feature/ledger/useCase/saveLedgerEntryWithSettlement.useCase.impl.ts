import {
  MoneyAccount,
  MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingDocumentTypeValue,
  BillingTemplateType,
  BillingTemplateTypeValue,
} from "@/feature/billing/types/billing.types";
import { DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase } from "@/feature/billing/useCase/deleteBillingDocumentAllocationsBySettlementEntryRemoteId.useCase";
import { ReplaceBillingDocumentAllocationsForSettlementEntryUseCase } from "@/feature/billing/useCase/replaceBillingDocumentAllocationsForSettlementEntry.useCase";
import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import {
  LedgerEntry,
  LedgerEntryResult,
  LedgerEntryType,
  LedgerEntryTypeValue,
  LedgerPaymentMode,
  LedgerPaymentModeValue,
  SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerError,
  LedgerErrorType,
  LedgerValidationError,
} from "@/feature/ledger/types/ledger.error.types";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { UpdateLedgerEntryUseCase } from "@/feature/ledger/useCase/updateLedgerEntry.useCase";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import {
  INVALID_LEDGER_SETTLEMENT_ACCOUNT_MESSAGE,
  LedgerSettlementAllocationCandidate,
  SaveLedgerEntryWithSettlementPayload,
  SaveLedgerEntryWithSettlementUseCase,
} from "./saveLedgerEntryWithSettlement.useCase";

type CreateSaveLedgerEntryWithSettlementUseCaseParams = {
  addLedgerEntryUseCase: AddLedgerEntryUseCase;
  updateLedgerEntryUseCase: UpdateLedgerEntryUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  replaceBillingDocumentAllocationsForSettlementEntryUseCase:
    ReplaceBillingDocumentAllocationsForSettlementEntryUseCase;
  deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase:
    DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase;
};

const createTransactionRemoteId = (): string => {
  return `txn-ledger-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createBillingDocumentRemoteId = (): string => {
  return `bill-ledger-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const isDueEntryType = (entryType: LedgerEntryTypeValue): boolean => {
  return (
    entryType === LedgerEntryType.Sale ||
    entryType === LedgerEntryType.Purchase
  );
};

const isSettlementEntryType = (entryType: LedgerEntryTypeValue): boolean => {
  return (
    entryType === LedgerEntryType.Collection ||
    entryType === LedgerEntryType.PaymentOut
  );
};

const buildLedgerDocumentNumber = ({
  entryType,
  remoteId,
  happenedAt,
}: {
  entryType: LedgerEntryTypeValue;
  remoteId: string;
  happenedAt: number;
}): string => {
  const year = new Date(happenedAt).getUTCFullYear();
  const token = remoteId.replace(/-/g, "").slice(-8).toUpperCase();
  const prefix = entryType === LedgerEntryType.Sale ? "INV" : "BILL";
  return `${prefix}-${year}-${token}`;
};

const resolveBillingDocumentTypeForEntryType = (
  entryType: LedgerEntryTypeValue,
): BillingDocumentTypeValue => {
  if (entryType === LedgerEntryType.Sale) {
    return BillingDocumentType.Invoice;
  }

  return BillingDocumentType.Receipt;
};

const resolveBillingTemplateTypeForEntryType = (
  entryType: LedgerEntryTypeValue,
): BillingTemplateTypeValue => {
  if (entryType === LedgerEntryType.Sale) {
    return BillingTemplateType.StandardInvoice;
  }

  return BillingTemplateType.DetailedInvoice;
};

const buildLedgerDocumentItemName = (
  entryType: LedgerEntryTypeValue,
): string => {
  if (entryType === LedgerEntryType.Sale) {
    return "Sale Due";
  }

  if (entryType === LedgerEntryType.Purchase) {
    return "Purchase Due";
  }

  return "Ledger Due";
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

const buildSettlementTransactionPayload = ({
  remoteId,
  ownerUserRemoteId,
  businessAccountRemoteId,
  businessAccountDisplayName,
  entryType,
  partyName,
  amount,
  currencyCode,
  note,
  happenedAt,
  sourceRemoteId,
  settlementMoneyAccountRemoteId,
  settlementMoneyAccountDisplayNameSnapshot,
}: {
  remoteId: string;
  ownerUserRemoteId: string;
  businessAccountRemoteId: string;
  businessAccountDisplayName: string;
  entryType: LedgerEntryTypeValue;
  partyName: string;
  amount: number;
  currencyCode: string | null;
  note: string | null;
  happenedAt: number;
  sourceRemoteId: string;
  settlementMoneyAccountRemoteId: string | null;
  settlementMoneyAccountDisplayNameSnapshot: string | null;
}): SaveTransactionPayload => {
  const isReceive = entryType === LedgerEntryType.Collection;

  return {
    remoteId,
    ownerUserRemoteId,
    accountRemoteId: businessAccountRemoteId,
    accountDisplayNameSnapshot: businessAccountDisplayName,
    transactionType: isReceive
      ? TransactionType.Income
      : TransactionType.Expense,
    direction: isReceive ? TransactionDirection.In : TransactionDirection.Out,
    title: `${isReceive ? "Received from" : "Paid to"} ${partyName}`,
    amount,
    currencyCode,
    categoryLabel: "Ledger",
    note,
    happenedAt,
    settlementMoneyAccountRemoteId,
    settlementMoneyAccountDisplayNameSnapshot,
    sourceModule: TransactionSourceModule.Ledger,
    sourceRemoteId,
    sourceAction: "settlement",
    idempotencyKey: `ledger:${sourceRemoteId}:settlement`,
  };
};

const buildDocumentAllocationPlan = ({
  amount,
  selectedDueRemoteId,
  settlementCandidates,
  dueEntryByRemoteId,
}: {
  amount: number;
  selectedDueRemoteId: string | null;
  settlementCandidates: readonly LedgerSettlementAllocationCandidate[];
  dueEntryByRemoteId: ReadonlyMap<string, LedgerEntry>;
}): readonly {
  documentRemoteId: string;
  amount: number;
}[] => {
  const documentAmountMap = new Map<string, number>();
  let remainingAmount = Number(amount.toFixed(2));

  const allocateToCandidate = (
    candidateRemoteId: string,
    maxAmount: number,
  ) => {
    if (remainingAmount <= 0 || maxAmount <= 0) {
      return;
    }

    const dueEntry = dueEntryByRemoteId.get(candidateRemoteId);
    const documentRemoteId = dueEntry?.linkedDocumentRemoteId ?? null;
    if (!documentRemoteId) {
      return;
    }

    const allocatedAmount = Math.min(remainingAmount, maxAmount);
    if (allocatedAmount <= 0) {
      return;
    }

    remainingAmount = Number((remainingAmount - allocatedAmount).toFixed(2));
    documentAmountMap.set(
      documentRemoteId,
      Number(
        (
          (documentAmountMap.get(documentRemoteId) ?? 0) + allocatedAmount
        ).toFixed(2),
      ),
    );
  };

  if (selectedDueRemoteId) {
    const selectedCandidate = settlementCandidates.find(
      (candidate) => candidate.remoteId === selectedDueRemoteId,
    );
    if (selectedCandidate) {
      allocateToCandidate(
        selectedCandidate.remoteId,
        selectedCandidate.outstandingAmount,
      );
    }
  } else {
    for (const candidate of settlementCandidates) {
      if (remainingAmount <= 0) {
        break;
      }
      allocateToCandidate(candidate.remoteId, candidate.outstandingAmount);
    }
  }

  return Array.from(documentAmountMap.entries()).map(
    ([documentRemoteId, allocatedAmount]) => ({
      documentRemoteId,
      amount: allocatedAmount,
    }),
  );
};

const mapEffectError = (message: string): LedgerError => ({
  type: LedgerErrorType.UnknownError,
  message,
});

export const createSaveLedgerEntryWithSettlementUseCase = ({
  addLedgerEntryUseCase,
  updateLedgerEntryUseCase,
  getMoneyAccountsUseCase,
  postBusinessTransactionUseCase,
  deleteBusinessTransactionUseCase,
  saveBillingDocumentUseCase,
  replaceBillingDocumentAllocationsForSettlementEntryUseCase,
  deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
}: CreateSaveLedgerEntryWithSettlementUseCaseParams): SaveLedgerEntryWithSettlementUseCase => ({
  async execute(
    payload: SaveLedgerEntryWithSettlementPayload,
  ): Promise<LedgerEntryResult> {
    const ledgerRemoteId = payload.ledgerEntry.remoteId.trim();
    const businessAccountRemoteId =
      payload.ledgerEntry.businessAccountRemoteId.trim();

    if (!ledgerRemoteId) {
      return {
        success: false,
        error: LedgerValidationError("Ledger entry id is missing."),
      };
    }

    const isSettlementAction = isSettlementEntryType(
      payload.ledgerEntry.entryType,
    );
    const isDueAction = isDueEntryType(payload.ledgerEntry.entryType);
    const selectedSettlementAccountRemoteId =
      payload.selectedSettlementAccountRemoteId?.trim() ?? "";
    let settlementMoneyAccountRemoteId: string | null = null;
    let settlementMoneyAccountDisplayNameSnapshot: string | null = null;
    let resolvedPaymentMode: SaveLedgerEntryPayload["paymentMode"] = null;
    let linkedTransactionRemoteId = payload.ledgerEntry.linkedTransactionRemoteId;
    let linkedDocumentRemoteId = isDueAction
      ? (payload.ledgerEntry.linkedDocumentRemoteId ?? null)
      : null;
    let createdTransactionRemoteId: string | null = null;
    let transactionToDeleteAfterSave: string | null = null;
    let hasPreparedSettlementAllocations = false;

    if (isSettlementAction) {
      if (!selectedSettlementAccountRemoteId) {
        return {
          success: false,
          error: LedgerValidationError(
            "Money account is required for this action.",
          ),
        };
      }

      const moneyAccountsResult =
        await getMoneyAccountsUseCase.execute(businessAccountRemoteId);
      if (!moneyAccountsResult.success) {
        return {
          success: false,
          error: mapEffectError(moneyAccountsResult.error.message),
        };
      }

      const settlementMoneyAccount = moneyAccountsResult.value
        .filter((moneyAccount) => moneyAccount.isActive)
        .find(
          (moneyAccount) =>
            moneyAccount.remoteId === selectedSettlementAccountRemoteId,
        );

      if (!settlementMoneyAccount) {
        return {
          success: false,
          error: LedgerValidationError(
            INVALID_LEDGER_SETTLEMENT_ACCOUNT_MESSAGE,
          ),
        };
      }

      settlementMoneyAccountRemoteId = settlementMoneyAccount.remoteId;
      settlementMoneyAccountDisplayNameSnapshot = settlementMoneyAccount.name;
      resolvedPaymentMode = derivePaymentModeFromMoneyAccount(
        settlementMoneyAccount,
      );
    }

    if (isSettlementAction) {
      const transactionRemoteId =
        linkedTransactionRemoteId ?? createTransactionRemoteId();
      const transactionPayload = buildSettlementTransactionPayload({
        remoteId: transactionRemoteId,
        ownerUserRemoteId: payload.ledgerEntry.ownerUserRemoteId,
        businessAccountRemoteId,
        businessAccountDisplayName: payload.businessAccountDisplayName,
        entryType: payload.ledgerEntry.entryType,
        partyName: payload.ledgerEntry.partyName,
        amount: payload.ledgerEntry.amount,
        currencyCode: payload.ledgerEntry.currencyCode,
        note: payload.ledgerEntry.note,
        happenedAt: payload.ledgerEntry.happenedAt,
        sourceRemoteId: ledgerRemoteId,
        settlementMoneyAccountRemoteId,
        settlementMoneyAccountDisplayNameSnapshot,
      });

      const transactionResult =
        await postBusinessTransactionUseCase.execute(transactionPayload);

      if (!transactionResult.success) {
        return {
          success: false,
          error: mapEffectError(transactionResult.error.message),
        };
      }

      if (!linkedTransactionRemoteId) {
        linkedTransactionRemoteId = transactionRemoteId;
        createdTransactionRemoteId = transactionRemoteId;
      }
    } else if (linkedTransactionRemoteId) {
      transactionToDeleteAfterSave = linkedTransactionRemoteId;
      linkedTransactionRemoteId = null;
    }

    if (isDueAction) {
      const nextLinkedDocumentRemoteId =
        linkedDocumentRemoteId ?? createBillingDocumentRemoteId();
      const saveDocumentResult = await saveBillingDocumentUseCase.execute({
        remoteId: nextLinkedDocumentRemoteId,
        accountRemoteId: businessAccountRemoteId,
        documentNumber: buildLedgerDocumentNumber({
          entryType: payload.ledgerEntry.entryType,
          remoteId: ledgerRemoteId,
          happenedAt: payload.ledgerEntry.happenedAt,
        }),
        documentType: resolveBillingDocumentTypeForEntryType(
          payload.ledgerEntry.entryType,
        ),
        templateType: resolveBillingTemplateTypeForEntryType(
          payload.ledgerEntry.entryType,
        ),
        customerName: payload.ledgerEntry.partyName,
        contactRemoteId: payload.ledgerEntry.contactRemoteId ?? null,
        status: BillingDocumentStatus.Pending,
        taxRatePercent: 0,
        notes: payload.ledgerEntry.note,
        issuedAt: payload.ledgerEntry.happenedAt,
        dueAt: payload.ledgerEntry.dueAt,
        sourceModule: TransactionSourceModule.Ledger,
        sourceRemoteId: ledgerRemoteId,
        linkedLedgerEntryRemoteId: ledgerRemoteId,
        items: [
          {
            remoteId: `${ledgerRemoteId}-line-1`,
            itemName: buildLedgerDocumentItemName(
              payload.ledgerEntry.entryType,
            ),
            quantity: 1,
            unitRate: payload.ledgerEntry.amount,
            lineOrder: 0,
          },
        ],
      });

      if (!saveDocumentResult.success) {
        if (createdTransactionRemoteId) {
          await deleteBusinessTransactionUseCase.execute(
            createdTransactionRemoteId,
          );
        }

        return {
          success: false,
          error: mapEffectError(saveDocumentResult.error.message),
        };
      }

      linkedDocumentRemoteId = saveDocumentResult.value.remoteId;
    } else {
      linkedDocumentRemoteId = null;
    }

    if (isSettlementAction) {
      const dueEntryByRemoteId = new Map<string, LedgerEntry>(
        payload.existingLedgerEntries
          .filter((entry) => isDueEntryType(entry.entryType))
          .map((entry) => [entry.remoteId, entry]),
      );
      const allocationPlan = buildDocumentAllocationPlan({
        amount: payload.ledgerEntry.amount,
        selectedDueRemoteId: payload.ledgerEntry.settledAgainstEntryRemoteId,
        settlementCandidates: payload.settlementCandidates,
        dueEntryByRemoteId,
      });

      const replaceAllocationsResult =
        await replaceBillingDocumentAllocationsForSettlementEntryUseCase.execute(
          {
            accountRemoteId: businessAccountRemoteId,
            settlementLedgerEntryRemoteId: ledgerRemoteId,
            settlementTransactionRemoteId: linkedTransactionRemoteId,
            settledAt: payload.ledgerEntry.happenedAt,
            note: payload.ledgerEntry.note,
            allocations: allocationPlan,
          },
        );

      if (!replaceAllocationsResult.success) {
        if (createdTransactionRemoteId) {
          await deleteBusinessTransactionUseCase.execute(
            createdTransactionRemoteId,
          );
        }

        return {
          success: false,
          error: mapEffectError(replaceAllocationsResult.error.message),
        };
      }

      hasPreparedSettlementAllocations = true;
    }

    const ledgerEntryPayload: SaveLedgerEntryPayload = {
      ...payload.ledgerEntry,
      linkedDocumentRemoteId,
      linkedTransactionRemoteId,
      paymentMode: resolvedPaymentMode,
      settlementAccountRemoteId: settlementMoneyAccountRemoteId,
      settlementAccountDisplayNameSnapshot:
        settlementMoneyAccountDisplayNameSnapshot,
    };

    const result =
      payload.mode === "create"
        ? await addLedgerEntryUseCase.execute(ledgerEntryPayload)
        : await updateLedgerEntryUseCase.execute(ledgerEntryPayload);

    if (!result.success) {
      if (createdTransactionRemoteId) {
        await deleteBusinessTransactionUseCase.execute(
          createdTransactionRemoteId,
        );
      }
      if (hasPreparedSettlementAllocations) {
        await deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase.execute(
          ledgerRemoteId,
        );
      }

      return result;
    }

    if (transactionToDeleteAfterSave) {
      await deleteBusinessTransactionUseCase.execute(
        transactionToDeleteAfterSave,
      );
    }
    if (!isSettlementAction) {
      await deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase.execute(
        ledgerRemoteId,
      );
    }

    return result;
  },
});
