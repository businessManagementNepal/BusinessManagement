import { describe, expect, it, vi } from "vitest";
import { MoneyAccountType } from "@/feature/accounts/types/moneyAccount.types";
import {
  LedgerBalanceDirection,
  LedgerEntry,
  LedgerEntryType,
  LedgerPaymentMode,
  SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";
import { LedgerValidationError } from "@/feature/ledger/types/ledger.error.types";
import {
  createSaveLedgerEntryWithSettlementUseCase,
} from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase.impl";
import {
  SaveLedgerEntryWithSettlementPayload,
} from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase";

const buildMoneyAccount = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "cash-1",
  ownerUserRemoteId: "user-1",
  scopeAccountRemoteId: "business-1",
  name: "Cash Box",
  type: MoneyAccountType.Cash,
  currentBalance: 0,
  description: null,
  currencyCode: "NPR",
  isPrimary: true,
  isActive: true,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const buildLedgerEntry = (overrides: Partial<LedgerEntry> = {}): LedgerEntry => ({
  remoteId: "due-1",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  partyName: "Acme Traders",
  partyPhone: null,
  contactRemoteId: "contact-1",
  entryType: LedgerEntryType.Sale,
  balanceDirection: LedgerBalanceDirection.Receive,
  title: "Sale Due",
  amount: 120,
  currencyCode: "NPR",
  note: null,
  happenedAt: 1_710_000_000_000,
  dueAt: null,
  paymentMode: null,
  referenceNumber: null,
  reminderAt: null,
  attachmentUri: null,
  settledAgainstEntryRemoteId: null,
  linkedDocumentRemoteId: "bill-due-1",
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const buildSettlementLedgerPayload = (
  overrides: Partial<SaveLedgerEntryPayload> = {},
): SaveLedgerEntryPayload => ({
  remoteId: "led-settle-1",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  partyName: "Acme Traders",
  partyPhone: null,
  contactRemoteId: "contact-1",
  entryType: LedgerEntryType.Collection,
  balanceDirection: LedgerBalanceDirection.Receive,
  title: "Settlement",
  amount: 80,
  currencyCode: "NPR",
  note: "settlement note",
  happenedAt: 1_710_000_000_000,
  dueAt: null,
  paymentMode: null,
  referenceNumber: null,
  reminderAt: null,
  attachmentUri: null,
  settledAgainstEntryRemoteId: "due-1",
  linkedDocumentRemoteId: null,
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  ...overrides,
});

const buildDueLedgerPayload = (
  overrides: Partial<SaveLedgerEntryPayload> = {},
): SaveLedgerEntryPayload => ({
  remoteId: "led-due-1",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  partyName: "Acme Traders",
  partyPhone: null,
  contactRemoteId: "contact-1",
  entryType: LedgerEntryType.Sale,
  balanceDirection: LedgerBalanceDirection.Receive,
  title: "Sale Due",
  amount: 120,
  currencyCode: "NPR",
  note: null,
  happenedAt: 1_710_000_000_000,
  dueAt: 1_710_086_400_000,
  paymentMode: null,
  referenceNumber: null,
  reminderAt: null,
  attachmentUri: null,
  settledAgainstEntryRemoteId: null,
  linkedDocumentRemoteId: null,
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  ...overrides,
});

const toLedgerEntryResultValue = (
  payload: SaveLedgerEntryPayload,
): LedgerEntry => ({
  ...buildLedgerEntry(),
  ...payload,
  contactRemoteId: payload.contactRemoteId ?? null,
  linkedDocumentRemoteId: payload.linkedDocumentRemoteId ?? null,
  paymentMode: payload.paymentMode,
  settlementAccountRemoteId: payload.settlementAccountRemoteId,
  settlementAccountDisplayNameSnapshot:
    payload.settlementAccountDisplayNameSnapshot,
  createdAt: 1,
  updatedAt: 1,
});

const createDependencies = () => {
  const addLedgerEntryUseCase: { execute: any } = {
    execute: vi.fn(async (payload: SaveLedgerEntryPayload) => ({
      success: true as const,
      value: toLedgerEntryResultValue(payload),
    })),
  };
  const updateLedgerEntryUseCase: { execute: any } = {
    execute: vi.fn(async (payload: SaveLedgerEntryPayload) => ({
      success: true as const,
      value: toLedgerEntryResultValue(payload),
    })),
  };
  const getMoneyAccountsUseCase: { execute: any } = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: [buildMoneyAccount()],
    })),
  };
  const postBusinessTransactionUseCase: { execute: any } = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };
  const deleteBusinessTransactionUseCase: { execute: any } = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };
  const saveBillingDocumentUseCase: { execute: any } = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {
        remoteId: "bill-new-1",
      },
    })),
  };
  const replaceBillingDocumentAllocationsForSettlementEntryUseCase: {
    execute: any;
  } = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };
  const deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase: {
    execute: any;
  } = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };
  const deleteBillingDocumentUseCase: { execute: any } = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };
  const recordAuditEventUseCase: { execute: any } = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {} as never,
    })),
  };

  const useCase = createSaveLedgerEntryWithSettlementUseCase({
    addLedgerEntryUseCase: addLedgerEntryUseCase as any,
    updateLedgerEntryUseCase: updateLedgerEntryUseCase as any,
    getMoneyAccountsUseCase: getMoneyAccountsUseCase as any,
    postBusinessTransactionUseCase: postBusinessTransactionUseCase as any,
    deleteBusinessTransactionUseCase:
      deleteBusinessTransactionUseCase as any,
    saveBillingDocumentUseCase: saveBillingDocumentUseCase as any,
    replaceBillingDocumentAllocationsForSettlementEntryUseCase:
      replaceBillingDocumentAllocationsForSettlementEntryUseCase as any,
    deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase:
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase as any,
    deleteBillingDocumentUseCase: deleteBillingDocumentUseCase as any,
    recordAuditEventUseCase: recordAuditEventUseCase as any,
  });

  return {
    useCase,
    addLedgerEntryUseCase,
    updateLedgerEntryUseCase,
    deleteBusinessTransactionUseCase,
    recordAuditEventUseCase,
  };
};

describe("ledger settlement workflow audit", () => {
  it("due create emits ledger_due_saved", async () => {
    const deps = createDependencies();

    const payload: SaveLedgerEntryWithSettlementPayload = {
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: null,
      ledgerEntry: buildDueLedgerPayload(),
      existingLedgerEntries: [],
      settlementCandidates: [],
    };

    const result = await deps.useCase.execute(payload);

    expect(result.success).toBe(true);
    expect(deps.recordAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ledger_due_saved",
        outcome: "success",
      }),
    );
  });

  it("settlement create/update emits ledger_settlement_saved", async () => {
    const deps = createDependencies();

    const createPayload: SaveLedgerEntryWithSettlementPayload = {
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: "cash-1",
      ledgerEntry: buildSettlementLedgerPayload(),
      existingLedgerEntries: [buildLedgerEntry()],
      settlementCandidates: [{ remoteId: "due-1", outstandingAmount: 120 }],
    };

    const createResult = await deps.useCase.execute(createPayload);

    const updatePayload: SaveLedgerEntryWithSettlementPayload = {
      mode: "update",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: "cash-1",
      ledgerEntry: buildSettlementLedgerPayload({
        linkedTransactionRemoteId: "txn-existing",
      }),
      existingLedgerEntries: [buildLedgerEntry()],
      settlementCandidates: [{ remoteId: "due-1", outstandingAmount: 120 }],
    };

    const updateResult = await deps.useCase.execute(updatePayload);

    expect(createResult.success).toBe(true);
    expect(updateResult.success).toBe(true);
    const actions = deps.recordAuditEventUseCase.execute.mock.calls.map(
      (call: [Record<string, unknown>]) => call[0].action,
    );
    expect(actions).toContain("ledger_settlement_saved");
  });

  it("rollback failure emits ledger_settlement_failed with rollback metadata", async () => {
    const deps = createDependencies();
    deps.addLedgerEntryUseCase.execute = vi.fn(async () => ({
      success: false as const,
      error: LedgerValidationError("ledger save failed"),
    }));
    deps.deleteBusinessTransactionUseCase.execute = vi.fn(async () => ({
      success: false as const,
      error: {
        type: "UNKNOWN_ERROR" as const,
        message: "delete failed",
      },
    }));

    const payload: SaveLedgerEntryWithSettlementPayload = {
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: "cash-1",
      ledgerEntry: buildSettlementLedgerPayload(),
      existingLedgerEntries: [buildLedgerEntry()],
      settlementCandidates: [{ remoteId: "due-1", outstandingAmount: 120 }],
    };

    const result = await deps.useCase.execute(payload);

    expect(result.success).toBe(false);
    const auditPayload = deps.recordAuditEventUseCase.execute.mock.calls[0]?.[0];
    const metadata = JSON.parse(auditPayload.metadataJson) as {
      rollbackMessage: string | null;
    };

    expect(auditPayload.action).toBe("ledger_settlement_failed");
    expect(metadata.rollbackMessage).toContain(
      "Ledger settlement rollback failed after save error",
    );
  });

  it("accepts typed external settlement payment mode without any-cast", async () => {
    const deps = createDependencies();

    const payload: SaveLedgerEntryWithSettlementPayload = {
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: "cash-1",
      externalSettlementTransaction: {
        remoteId: "txn-external-1",
        settlementMoneyAccountRemoteId: "cash-1",
        settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
        paymentMode: LedgerPaymentMode.Cash,
      },
      ledgerEntry: buildSettlementLedgerPayload(),
      existingLedgerEntries: [buildLedgerEntry()],
      settlementCandidates: [{ remoteId: "due-1", outstandingAmount: 120 }],
    };

    const result = await deps.useCase.execute(payload);

    expect(result.success).toBe(true);
  });
});
