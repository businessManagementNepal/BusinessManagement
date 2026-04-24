import { describe, expect, it, vi } from "vitest";
import { MoneyAccountType } from "@/feature/accounts/types/moneyAccount.types";
import { BillingDocumentType, BillingTemplateType } from "@/feature/billing/types/billing.types";
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
  INVALID_LEDGER_SETTLEMENT_ACCOUNT_MESSAGE,
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
  remoteId: "led-existing",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  partyName: "Acme Traders",
  partyPhone: null,
  contactRemoteId: "contact-1",
  entryType: LedgerEntryType.Sale,
  balanceDirection: LedgerBalanceDirection.Receive,
  title: "Sale Due - Acme Traders",
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
  linkedDocumentRemoteId: "bill-due-1",
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const buildLedgerPayload = (
  overrides: Partial<SaveLedgerEntryPayload> = {},
): SaveLedgerEntryPayload => ({
  remoteId: "led-1",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  partyName: "Acme Traders",
  partyPhone: null,
  contactRemoteId: "contact-1",
  entryType: LedgerEntryType.Collection,
  balanceDirection: LedgerBalanceDirection.Receive,
  title: "Receive Money - Acme Traders",
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
    execute: vi.fn(async (_accountRemoteId: string) => ({
      success: true as const,
      value: [buildMoneyAccount()],
    })),
  };
  const postBusinessTransactionUseCase: { execute: any } = {
    execute: vi.fn(async (_payload: any) => ({
      success: true as const,
      value: true,
    })),
  };
  const deleteBusinessTransactionUseCase: { execute: any } = {
    execute: vi.fn(async (_remoteId: string) => ({
      success: true as const,
      value: true,
    })),
  };
  const saveBillingDocumentUseCase: { execute: any } = {
    execute: vi.fn(async (_payload: any) => ({
      success: true as const,
      value: {
        remoteId: "bill-new-1",
        accountRemoteId: "business-1",
        documentNumber: "INV-2024-ABCD1234",
        documentType: BillingDocumentType.Invoice,
        templateType: BillingTemplateType.StandardInvoice,
        customerName: "Acme Traders",
        contactRemoteId: null,
        status: "pending",
        taxRatePercent: 0,
        notes: null,
        subtotalAmount: 80,
        taxAmount: 0,
        totalAmount: 80,
        paidAmount: 0,
        outstandingAmount: 80,
        isOverdue: false,
        issuedAt: 1_710_000_000_000,
        dueAt: 1_710_086_400_000,
        sourceModule: "ledger",
        sourceRemoteId: "led-1",
        linkedLedgerEntryRemoteId: "led-1",
        items: [],
        createdAt: 1,
        updatedAt: 1,
      },
    })),
  };
  const replaceBillingDocumentAllocationsForSettlementEntryUseCase: {
    execute: any;
  } = {
    execute: vi.fn(async (_params: any) => ({
      success: true as const,
      value: true,
    })),
  };
  const deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase: {
    execute: any;
  } = {
    execute: vi.fn(async (_remoteId: string) => ({
      success: true as const,
      value: true,
    })),
  };
  const deleteBillingDocumentUseCase: { execute: any } = {
    execute: vi.fn(async (_remoteId: string) => ({
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
    getMoneyAccountsUseCase,
    postBusinessTransactionUseCase,
    deleteBusinessTransactionUseCase,
    saveBillingDocumentUseCase,
    replaceBillingDocumentAllocationsForSettlementEntryUseCase,
    deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
    deleteBillingDocumentUseCase,
    recordAuditEventUseCase,
  };
};

describe("saveLedgerEntryWithSettlement.useCase", () => {
  it("creates settlement transaction, allocations, and explicit settlement linkage for a new settlement", async () => {
    const deps = createDependencies();
    const payload: SaveLedgerEntryWithSettlementPayload = {
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: "cash-1",
      ledgerEntry: buildLedgerPayload(),
      existingLedgerEntries: [
        buildLedgerEntry({
          remoteId: "due-1",
          linkedDocumentRemoteId: "bill-due-1",
        }),
      ],
      settlementCandidates: [{ remoteId: "due-1", outstandingAmount: 120 }],
    };

    const result = await deps.useCase.execute(payload);

    expect(result.success).toBe(true);
    expect(deps.getMoneyAccountsUseCase.execute).toHaveBeenCalledWith(
      "business-1",
    );
    expect(deps.postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(
      deps.replaceBillingDocumentAllocationsForSettlementEntryUseCase.execute,
    ).toHaveBeenCalledTimes(1);
    expect(deps.addLedgerEntryUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deps.saveBillingDocumentUseCase.execute).not.toHaveBeenCalled();
    expect(deps.deleteBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
    expect(
      deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase
        .execute,
    ).not.toHaveBeenCalled();

    const transactionPayload =
      deps.postBusinessTransactionUseCase.execute.mock.calls[0]![0];
    expect(transactionPayload).toMatchObject({
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      title: "Received from Acme Traders",
      amount: 80,
      currencyCode: "NPR",
      categoryLabel: "Ledger",
      note: "settlement note",
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      sourceModule: "ledger",
      sourceRemoteId: "led-1",
      sourceAction: "settlement",
      idempotencyKey: "ledger:led-1:settlement",
    });
    expect(transactionPayload.remoteId).toMatch(/^txn-ledger-/);

    expect(
      deps.replaceBillingDocumentAllocationsForSettlementEntryUseCase.execute,
    ).toHaveBeenCalledWith({
      accountRemoteId: "business-1",
      settlementLedgerEntryRemoteId: "led-1",
      settlementTransactionRemoteId: transactionPayload.remoteId,
      settledAt: 1_710_000_000_000,
      note: "settlement note",
      allocations: [{ documentRemoteId: "bill-due-1", amount: 80 }],
    });

    const savedLedgerPayload =
      deps.addLedgerEntryUseCase.execute.mock.calls[0]![0];
    expect(savedLedgerPayload).toMatchObject({
      remoteId: "led-1",
      contactRemoteId: "contact-1",
      linkedTransactionRemoteId: transactionPayload.remoteId,
      linkedDocumentRemoteId: null,
      paymentMode: LedgerPaymentMode.Cash,
      settlementAccountRemoteId: "cash-1",
      settlementAccountDisplayNameSnapshot: "Cash Box",
    });
  });

  it("reuses the existing linked transaction id on settlement update", async () => {
    const deps = createDependencies();
    const payload: SaveLedgerEntryWithSettlementPayload = {
      mode: "update",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: "cash-1",
      ledgerEntry: buildLedgerPayload({
        linkedTransactionRemoteId: "txn-existing",
        amount: 50,
        settledAgainstEntryRemoteId: null,
      }),
      existingLedgerEntries: [
        buildLedgerEntry({
          remoteId: "due-1",
          linkedDocumentRemoteId: "bill-due-1",
        }),
      ],
      settlementCandidates: [{ remoteId: "due-1", outstandingAmount: 90 }],
    };

    const result = await deps.useCase.execute(payload);

    expect(result.success).toBe(true);
    expect(deps.postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(
      deps.postBusinessTransactionUseCase.execute.mock.calls[0]![0].remoteId,
    ).toBe("txn-existing");
    expect(
      deps.replaceBillingDocumentAllocationsForSettlementEntryUseCase.execute,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        settlementTransactionRemoteId: "txn-existing",
      }),
    );
    expect(deps.updateLedgerEntryUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedTransactionRemoteId: "txn-existing",
        paymentMode: LedgerPaymentMode.Cash,
      }),
    );
    expect(deps.deleteBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
    expect(
      deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase
        .execute,
    ).not.toHaveBeenCalled();
  });

  it("updates the existing linked billing document and carries the contact link for due entry edits", async () => {
    const deps = createDependencies();
    deps.saveBillingDocumentUseCase.execute = vi.fn(async (payload: any) => ({
      success: true as const,
      value: {
        remoteId: payload.remoteId,
        accountRemoteId: payload.accountRemoteId,
        documentNumber: payload.documentNumber,
        documentType: payload.documentType,
        templateType: payload.templateType,
        customerName: payload.customerName,
        contactRemoteId: payload.contactRemoteId ?? null,
        status: payload.status,
        taxRatePercent: payload.taxRatePercent,
        notes: payload.notes,
        subtotalAmount: payload.items[0]?.unitRate ?? 0,
        taxAmount: 0,
        totalAmount: payload.items[0]?.unitRate ?? 0,
        paidAmount: 0,
        outstandingAmount: payload.items[0]?.unitRate ?? 0,
        isOverdue: false,
        issuedAt: payload.issuedAt,
        dueAt: payload.dueAt,
        sourceModule: payload.sourceModule,
        sourceRemoteId: payload.sourceRemoteId,
        linkedLedgerEntryRemoteId: payload.linkedLedgerEntryRemoteId,
        items: [],
        createdAt: 1,
        updatedAt: 1,
      },
    }));
    const useCase = createSaveLedgerEntryWithSettlementUseCase({
      addLedgerEntryUseCase: deps.addLedgerEntryUseCase as any,
      updateLedgerEntryUseCase: deps.updateLedgerEntryUseCase as any,
      getMoneyAccountsUseCase: deps.getMoneyAccountsUseCase as any,
      postBusinessTransactionUseCase: deps.postBusinessTransactionUseCase as any,
      deleteBusinessTransactionUseCase:
        deps.deleteBusinessTransactionUseCase as any,
      saveBillingDocumentUseCase: deps.saveBillingDocumentUseCase as any,
      replaceBillingDocumentAllocationsForSettlementEntryUseCase:
        deps.replaceBillingDocumentAllocationsForSettlementEntryUseCase as any,
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase:
        deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase as any,
      deleteBillingDocumentUseCase: deps.deleteBillingDocumentUseCase as any,
      recordAuditEventUseCase: deps.recordAuditEventUseCase as any,
    });

    const result = await useCase.execute({
      mode: "update",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: null,
      ledgerEntry: buildLedgerPayload({
        entryType: LedgerEntryType.Sale,
        balanceDirection: LedgerBalanceDirection.Receive,
        title: "Sale Due - Acme Traders",
        amount: 120,
        dueAt: 1_710_086_400_000,
        settledAgainstEntryRemoteId: null,
        linkedDocumentRemoteId: "bill-existing-1",
        linkedTransactionRemoteId: null,
        contactRemoteId: "contact-1",
      }),
      existingLedgerEntries: [],
      settlementCandidates: [],
    });

    expect(result.success).toBe(true);
    expect(deps.postBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
    expect(deps.saveBillingDocumentUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deps.saveBillingDocumentUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "bill-existing-1",
        accountRemoteId: "business-1",
        customerName: "Acme Traders",
        contactRemoteId: "contact-1",
        sourceModule: "ledger",
        sourceRemoteId: "led-1",
        linkedLedgerEntryRemoteId: "led-1",
      }),
    );
    expect(deps.updateLedgerEntryUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedDocumentRemoteId: "bill-existing-1",
        linkedTransactionRemoteId: null,
        contactRemoteId: "contact-1",
      }),
    );
    expect(deps.deleteBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
  });

  it("cleans up stale settlement side effects when an entry stops being a settlement action", async () => {
    const deps = createDependencies();
    const payload: SaveLedgerEntryWithSettlementPayload = {
      mode: "update",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: null,
      ledgerEntry: buildLedgerPayload({
        entryType: LedgerEntryType.Sale,
        balanceDirection: LedgerBalanceDirection.Receive,
        title: "Sale Due - Acme Traders",
        amount: 80,
        dueAt: 1_710_086_400_000,
        linkedTransactionRemoteId: "txn-old",
        settledAgainstEntryRemoteId: null,
      }),
      existingLedgerEntries: [],
      settlementCandidates: [],
    };

    const result = await deps.useCase.execute(payload);

    expect(result.success).toBe(true);
    expect(deps.postBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
    expect(
      deps.replaceBillingDocumentAllocationsForSettlementEntryUseCase.execute,
    ).not.toHaveBeenCalled();
    expect(deps.saveBillingDocumentUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deps.saveBillingDocumentUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: expect.stringMatching(/^bill-ledger-/),
        accountRemoteId: "business-1",
        customerName: "Acme Traders",
        sourceModule: "ledger",
        sourceRemoteId: "led-1",
        linkedLedgerEntryRemoteId: "led-1",
      }),
    );
    expect(deps.updateLedgerEntryUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedTransactionRemoteId: null,
        linkedDocumentRemoteId: "bill-new-1",
        settlementAccountRemoteId: null,
        settlementAccountDisplayNameSnapshot: null,
      }),
    );
    expect(deps.deleteBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      "txn-old",
    );
    expect(
      deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase
        .execute,
    ).toHaveBeenCalledWith("led-1");
  });

  it("rolls back the created transaction when settlement allocation replacement fails", async () => {
    const deps = createDependencies();
    deps.replaceBillingDocumentAllocationsForSettlementEntryUseCase.execute =
      vi.fn(async () => ({
        success: false as const,
        error: {
          type: "UNKNOWN_ERROR" as const,
          message: "allocation replace failed",
        },
      }));
    const useCase = createSaveLedgerEntryWithSettlementUseCase({
      addLedgerEntryUseCase: deps.addLedgerEntryUseCase as any,
      updateLedgerEntryUseCase: deps.updateLedgerEntryUseCase as any,
      getMoneyAccountsUseCase: deps.getMoneyAccountsUseCase as any,
      postBusinessTransactionUseCase: deps.postBusinessTransactionUseCase as any,
      deleteBusinessTransactionUseCase:
        deps.deleteBusinessTransactionUseCase as any,
      saveBillingDocumentUseCase: deps.saveBillingDocumentUseCase as any,
      replaceBillingDocumentAllocationsForSettlementEntryUseCase:
        deps.replaceBillingDocumentAllocationsForSettlementEntryUseCase as any,
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase:
        deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase as any,
      deleteBillingDocumentUseCase: deps.deleteBillingDocumentUseCase as any,
      recordAuditEventUseCase: deps.recordAuditEventUseCase as any,
    });

    const result = await useCase.execute({
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: "cash-1",
      ledgerEntry: buildLedgerPayload(),
      existingLedgerEntries: [
        buildLedgerEntry({
          remoteId: "due-1",
          linkedDocumentRemoteId: "bill-due-1",
        }),
      ],
      settlementCandidates: [{ remoteId: "due-1", outstandingAmount: 120 }],
    });

    expect(result.success).toBe(false);
    const transactionPayload =
      deps.postBusinessTransactionUseCase.execute.mock.calls[0]![0];
    expect(deps.deleteBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      transactionPayload.remoteId,
    );
    expect(deps.addLedgerEntryUseCase.execute).not.toHaveBeenCalled();
    expect(
      deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase
        .execute,
    ).not.toHaveBeenCalled();
  });

  it("rolls back the created transaction and prepared allocations when ledger save fails after settlement prep", async () => {
    const deps = createDependencies();
    deps.addLedgerEntryUseCase.execute = vi.fn(async (_payload: any) => ({
      success: false as const,
      error: LedgerValidationError("ledger save failed"),
    }));
    const useCase = createSaveLedgerEntryWithSettlementUseCase({
      addLedgerEntryUseCase: deps.addLedgerEntryUseCase as any,
      updateLedgerEntryUseCase: deps.updateLedgerEntryUseCase as any,
      getMoneyAccountsUseCase: deps.getMoneyAccountsUseCase as any,
      postBusinessTransactionUseCase: deps.postBusinessTransactionUseCase as any,
      deleteBusinessTransactionUseCase:
        deps.deleteBusinessTransactionUseCase as any,
      saveBillingDocumentUseCase: deps.saveBillingDocumentUseCase as any,
      replaceBillingDocumentAllocationsForSettlementEntryUseCase:
        deps.replaceBillingDocumentAllocationsForSettlementEntryUseCase as any,
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase:
        deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase as any,
      deleteBillingDocumentUseCase: deps.deleteBillingDocumentUseCase as any,
      recordAuditEventUseCase: deps.recordAuditEventUseCase as any,
    });

    const result = await useCase.execute({
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: "cash-1",
      ledgerEntry: buildLedgerPayload(),
      existingLedgerEntries: [
        buildLedgerEntry({
          remoteId: "due-1",
          linkedDocumentRemoteId: "bill-due-1",
        }),
      ],
      settlementCandidates: [{ remoteId: "due-1", outstandingAmount: 120 }],
    });

    expect(result.success).toBe(false);
    const transactionPayload =
      deps.postBusinessTransactionUseCase.execute.mock.calls[0]![0];
    expect(deps.deleteBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      transactionPayload.remoteId,
    );
    expect(
      deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase
        .execute,
    ).toHaveBeenCalledWith("led-1");

    if (!result.success) {
      expect(result.error.message).toBe("ledger save failed");
    }
  });

  it("rolls back a newly created billing document when due ledger save fails", async () => {
    const deps = createDependencies();
    deps.addLedgerEntryUseCase.execute = vi.fn(async (_payload: any) => ({
      success: false as const,
      error: LedgerValidationError("ledger save failed"),
    }));

    const result = await deps.useCase.execute({
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: null,
      ledgerEntry: buildLedgerPayload({
        entryType: LedgerEntryType.Sale,
        balanceDirection: LedgerBalanceDirection.Receive,
        title: "Sale Due - Acme Traders",
        amount: 120,
        dueAt: 1_710_086_400_000,
        settledAgainstEntryRemoteId: null,
        linkedDocumentRemoteId: null,
        linkedTransactionRemoteId: null,
      }),
      existingLedgerEntries: [],
      settlementCandidates: [],
    });

    expect(result.success).toBe(false);
    expect(deps.saveBillingDocumentUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deps.deleteBillingDocumentUseCase.execute).toHaveBeenCalledWith(
      "bill-new-1",
    );
    expect(deps.deleteBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
    expect(
      deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase
        .execute,
    ).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.message).toBe("ledger save failed");
    }
  });

  it("returns rollback failure when due ledger save rollback cannot delete the created billing document", async () => {
    const deps = createDependencies();
    deps.addLedgerEntryUseCase.execute = vi.fn(async (_payload: any) => ({
      success: false as const,
      error: LedgerValidationError("ledger save failed"),
    }));
    deps.deleteBillingDocumentUseCase.execute = vi.fn(async () => ({
      success: false as const,
      error: {
        type: "UNKNOWN_ERROR" as const,
        message: "billing delete failed",
      },
    }));

    const result = await deps.useCase.execute({
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: null,
      ledgerEntry: buildLedgerPayload({
        entryType: LedgerEntryType.Sale,
        balanceDirection: LedgerBalanceDirection.Receive,
        title: "Sale Due - Acme Traders",
        amount: 120,
        dueAt: 1_710_086_400_000,
        settledAgainstEntryRemoteId: null,
        linkedDocumentRemoteId: null,
        linkedTransactionRemoteId: null,
      }),
      existingLedgerEntries: [],
      settlementCandidates: [],
    });

    expect(result.success).toBe(false);
    expect(deps.deleteBillingDocumentUseCase.execute).toHaveBeenCalledWith(
      "bill-new-1",
    );

    if (!result.success) {
      expect(result.error.message).toContain(
        "Ledger settlement rollback failed after save error:",
      );
      expect(result.error.message).toContain(
        "could not remove created billing document bill-new-1: billing delete failed",
      );
    }
  });

  it("returns the invalid settlement account message when the selected money account is missing or inactive", async () => {
    const deps = createDependencies();
    deps.getMoneyAccountsUseCase.execute = vi.fn(
      async (_accountRemoteId: string) => ({
        success: true as const,
        value: [
          buildMoneyAccount({
            remoteId: "cash-1",
            isActive: false,
          }),
        ],
      }),
    );
    const useCase = createSaveLedgerEntryWithSettlementUseCase({
      addLedgerEntryUseCase: deps.addLedgerEntryUseCase as any,
      updateLedgerEntryUseCase: deps.updateLedgerEntryUseCase as any,
      getMoneyAccountsUseCase: deps.getMoneyAccountsUseCase as any,
      postBusinessTransactionUseCase: deps.postBusinessTransactionUseCase as any,
      deleteBusinessTransactionUseCase:
        deps.deleteBusinessTransactionUseCase as any,
      saveBillingDocumentUseCase: deps.saveBillingDocumentUseCase as any,
      replaceBillingDocumentAllocationsForSettlementEntryUseCase:
        deps.replaceBillingDocumentAllocationsForSettlementEntryUseCase as any,
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase:
        deps.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase as any,
      deleteBillingDocumentUseCase: deps.deleteBillingDocumentUseCase as any,
      recordAuditEventUseCase: deps.recordAuditEventUseCase as any,
    });

    const result = await useCase.execute({
      mode: "create",
      businessAccountDisplayName: "Main Business",
      selectedSettlementAccountRemoteId: "cash-1",
      ledgerEntry: buildLedgerPayload(),
      existingLedgerEntries: [],
      settlementCandidates: [],
    });

    expect(result.success).toBe(false);
    expect(deps.postBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
    expect(deps.addLedgerEntryUseCase.execute).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.message).toBe(
        INVALID_LEDGER_SETTLEMENT_ACCOUNT_MESSAGE,
      );
    }
  });
});
