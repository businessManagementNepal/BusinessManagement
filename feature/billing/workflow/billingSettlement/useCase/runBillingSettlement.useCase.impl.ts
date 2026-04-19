import {
  BillingDocument,
  BillingDocumentStatus,
  BillingDocumentType,
  BillingValidationError,
} from "@/feature/billing/types/billing.types";
import { GetBillingDocumentByRemoteIdUseCase } from "@/feature/billing/useCase/getBillingDocumentByRemoteId.useCase";
import { LinkBillingDocumentLedgerEntryUseCase } from "@/feature/billing/useCase/linkBillingDocumentLedgerEntry.useCase";
import { PayBillingDocumentPayload } from "@/feature/billing/useCase/payBillingDocument.useCase";
import {
  LedgerBalanceDirection,
  LedgerEntry,
  LedgerEntryType,
  LedgerEntryTypeValue,
} from "@/feature/ledger/types/ledger.entity.types";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { SaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase";
import { RunBillingSettlementUseCase } from "./runBillingSettlement.useCase";

type CreateRunBillingSettlementUseCaseParams = {
  getBillingDocumentByRemoteIdUseCase: GetBillingDocumentByRemoteIdUseCase;
  linkBillingDocumentLedgerEntryUseCase: LinkBillingDocumentLedgerEntryUseCase;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  addLedgerEntryUseCase: AddLedgerEntryUseCase;
  saveLedgerEntryWithSettlementUseCase: SaveLedgerEntryWithSettlementUseCase;
};

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const createLedgerEntryRemoteId = (prefix: string): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `${prefix}-${randomId}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const resolveDueEntryTypeForDocument = (
  documentType: BillingDocument["documentType"],
): LedgerEntryTypeValue =>
  documentType === BillingDocumentType.Invoice
    ? LedgerEntryType.Sale
    : LedgerEntryType.Purchase;

const resolveSettlementEntryTypeForDocument = (
  documentType: BillingDocument["documentType"],
): LedgerEntryTypeValue =>
  documentType === BillingDocumentType.Invoice
    ? LedgerEntryType.Collection
    : LedgerEntryType.PaymentOut;

const resolveBalanceDirectionForDocument = (
  documentType: BillingDocument["documentType"],
) =>
  documentType === BillingDocumentType.Invoice
    ? LedgerBalanceDirection.Receive
    : LedgerBalanceDirection.Pay;

const resolveRecoveredDueAt = (document: BillingDocument): number =>
  document.dueAt ?? document.issuedAt;

const buildRecoveredDueTitle = (document: BillingDocument): string =>
  document.documentType === BillingDocumentType.Invoice
    ? `Invoice ${document.documentNumber}`
    : `Bill ${document.documentNumber}`;

const buildSettlementTitle = (document: BillingDocument): string =>
  document.documentType === BillingDocumentType.Invoice
    ? `Received for ${document.documentNumber}`
    : `Paid for ${document.documentNumber}`;

const isCompatibleDueEntry = ({
  document,
  entry,
}: {
  document: BillingDocument;
  entry: LedgerEntry;
}): boolean => {
  return (
    entry.entryType === resolveDueEntryTypeForDocument(document.documentType) &&
    entry.linkedDocumentRemoteId === document.remoteId
  );
};

const findDueEntry = ({
  document,
  entries,
}: {
  document: BillingDocument;
  entries: readonly LedgerEntry[];
}): LedgerEntry | null => {
  if (document.linkedLedgerEntryRemoteId) {
    const linkedEntry =
      entries.find(
        (entry) => entry.remoteId === document.linkedLedgerEntryRemoteId,
      ) ?? null;

    if (linkedEntry && isCompatibleDueEntry({ document, entry: linkedEntry })) {
      return linkedEntry;
    }
  }

  return (
    entries.find((entry) => isCompatibleDueEntry({ document, entry })) ?? null
  );
};

const toBillingFailure = (message: string) => ({
  success: false as const,
  error: BillingValidationError(message),
});

export const createRunBillingSettlementUseCase = ({
  getBillingDocumentByRemoteIdUseCase,
  linkBillingDocumentLedgerEntryUseCase,
  getLedgerEntriesUseCase,
  addLedgerEntryUseCase,
  saveLedgerEntryWithSettlementUseCase,
}: CreateRunBillingSettlementUseCaseParams): RunBillingSettlementUseCase => ({
  async execute(payload: PayBillingDocumentPayload) {
    const billingDocumentRemoteId = normalizeRequired(
      payload.billingDocumentRemoteId,
    );
    const accountRemoteId = normalizeRequired(payload.accountRemoteId);
    const accountDisplayNameSnapshot = normalizeRequired(
      payload.accountDisplayNameSnapshot,
    );
    const ownerUserRemoteId = normalizeRequired(payload.ownerUserRemoteId);
    const settlementMoneyAccountRemoteId = normalizeRequired(
      payload.settlementMoneyAccountRemoteId,
    );
    const normalizedNote = normalizeOptional(payload.note);

    if (!billingDocumentRemoteId) {
      return toBillingFailure("Billing document id is required.");
    }

    if (!accountRemoteId) {
      return toBillingFailure("Account context is required.");
    }

    if (!accountDisplayNameSnapshot) {
      return toBillingFailure("Account display name is required.");
    }

    if (!ownerUserRemoteId) {
      return toBillingFailure("User context is required.");
    }

    if (!settlementMoneyAccountRemoteId) {
      return toBillingFailure("Settlement money account is required.");
    }

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      return toBillingFailure("Payment amount must be greater than zero.");
    }

    const billingDocumentResult =
      await getBillingDocumentByRemoteIdUseCase.execute(billingDocumentRemoteId);

    if (!billingDocumentResult.success) {
      return toBillingFailure(billingDocumentResult.error.message);
    }

    const billingDocument = billingDocumentResult.value;

    if (billingDocument.accountRemoteId !== accountRemoteId) {
      return toBillingFailure(
        "Billing document does not belong to the active account.",
      );
    }

    if (billingDocument.status === BillingDocumentStatus.Draft) {
      return toBillingFailure("Draft billing documents cannot be settled.");
    }

    if (billingDocument.outstandingAmount <= 0.0001) {
      return toBillingFailure("This billing document is already fully settled.");
    }

    if (payload.amount > billingDocument.outstandingAmount + 0.0001) {
      return toBillingFailure(
        "Payment amount cannot be greater than outstanding amount.",
      );
    }

    const ledgerEntriesResult = await getLedgerEntriesUseCase.execute({
      businessAccountRemoteId: accountRemoteId,
    });

    if (!ledgerEntriesResult.success) {
      return toBillingFailure(ledgerEntriesResult.error.message);
    }

    const existingLedgerEntries = ledgerEntriesResult.value;

    let resolvedDueEntry = findDueEntry({
      document: billingDocument,
      entries: existingLedgerEntries,
    });

    let settlementLedgerEntries = existingLedgerEntries;

    if (!resolvedDueEntry) {
      const createRecoveredDueResult = await addLedgerEntryUseCase.execute({
        remoteId: createLedgerEntryRemoteId("led-billing-due"),
        businessAccountRemoteId: accountRemoteId,
        ownerUserRemoteId,
        partyName: billingDocument.customerName,
        partyPhone: null,
        contactRemoteId: billingDocument.contactRemoteId,
        entryType: resolveDueEntryTypeForDocument(
          billingDocument.documentType,
        ),
        balanceDirection: resolveBalanceDirectionForDocument(
          billingDocument.documentType,
        ),
        title: buildRecoveredDueTitle(billingDocument),
        amount: Number(billingDocument.outstandingAmount.toFixed(2)),
        currencyCode: null,
        note:
          billingDocument.notes ??
          `Recovered due entry for ${billingDocument.documentNumber}.`,
        happenedAt: billingDocument.issuedAt,
        dueAt: resolveRecoveredDueAt(billingDocument),
        paymentMode: null,
        referenceNumber: billingDocument.documentNumber,
        reminderAt: null,
        attachmentUri: null,
        settledAgainstEntryRemoteId: null,
        linkedDocumentRemoteId: billingDocument.remoteId,
        linkedTransactionRemoteId: null,
        settlementAccountRemoteId: null,
        settlementAccountDisplayNameSnapshot: null,
      });

      if (!createRecoveredDueResult.success) {
        return toBillingFailure(createRecoveredDueResult.error.message);
      }

      resolvedDueEntry = createRecoveredDueResult.value;
      settlementLedgerEntries = [...existingLedgerEntries, resolvedDueEntry];
    }

    if (billingDocument.linkedLedgerEntryRemoteId !== resolvedDueEntry.remoteId) {
      const linkResult = await linkBillingDocumentLedgerEntryUseCase.execute(
        billingDocument.remoteId,
        resolvedDueEntry.remoteId,
      );

      if (!linkResult.success) {
        return toBillingFailure(linkResult.error.message);
      }
    }

    const settlementResult = await saveLedgerEntryWithSettlementUseCase.execute({
      mode: "create",
      businessAccountDisplayName: accountDisplayNameSnapshot,
      selectedSettlementAccountRemoteId: settlementMoneyAccountRemoteId,
      ledgerEntry: {
        remoteId: createLedgerEntryRemoteId("led-billing-settlement"),
        businessAccountRemoteId: accountRemoteId,
        ownerUserRemoteId,
        partyName: billingDocument.customerName,
        partyPhone: null,
        contactRemoteId: billingDocument.contactRemoteId,
        entryType: resolveSettlementEntryTypeForDocument(
          billingDocument.documentType,
        ),
        balanceDirection: resolveBalanceDirectionForDocument(
          billingDocument.documentType,
        ),
        title: buildSettlementTitle(billingDocument),
        amount: Number(payload.amount.toFixed(2)),
        currencyCode: null,
        note: normalizedNote,
        happenedAt: payload.settledAt,
        dueAt: null,
        paymentMode: null,
        referenceNumber: billingDocument.documentNumber,
        reminderAt: null,
        attachmentUri: null,
        settledAgainstEntryRemoteId: resolvedDueEntry.remoteId,
        linkedDocumentRemoteId: null,
        linkedTransactionRemoteId: null,
        settlementAccountRemoteId: null,
        settlementAccountDisplayNameSnapshot: null,
      },
      existingLedgerEntries: settlementLedgerEntries,
      settlementCandidates: [
        {
          remoteId: resolvedDueEntry.remoteId,
          outstandingAmount: Number(billingDocument.outstandingAmount.toFixed(2)),
        },
      ],
    });

    if (!settlementResult.success) {
      return toBillingFailure(settlementResult.error.message);
    }

    return {
      success: true,
      value: true,
    };
  },
});
