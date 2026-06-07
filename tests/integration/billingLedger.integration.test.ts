import { MoneyAccountType } from "@/feature/accounts/types/moneyAccount.types";
import {
  BillingErrorType,
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
  type BillingDocument,
} from "@/feature/billing/types/billing.types";
import { createRunBillingDocumentIssueUseCase } from "@/feature/billing/workflow/billingDocumentIssue/useCase/runBillingDocumentIssue.useCase.impl";
import { createRunBillingSettlementUseCase } from "@/feature/billing/workflow/billingSettlement/useCase/runBillingSettlement.useCase.impl";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
  type LedgerEntry,
  type SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";
import { createSaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase.impl";
import { describe, expect, it, vi } from "vitest";

const buildIssuePayload = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "bill-1",
  accountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  documentType: BillingDocumentType.Invoice,
  desiredStatus: BillingDocumentStatus.Pending,
  customerName: "Acme Traders",
  taxRatePercent: 0,
  notes: null,
  issuedAt: 1_710_000_000_000,
  dueAt: 1_710_086_400_000,
  items: [
    {
      remoteId: "line-1",
      itemName: "Consulting",
      quantity: 1,
      unitRate: 1000,
      lineOrder: 0,
    },
  ],
  ...overrides,
});

const buildSettlementPayload = (overrides: Record<string, unknown> = {}) => ({
  billingDocumentRemoteId: "bill-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Main Business",
  ownerUserRemoteId: "user-1",
  settlementMoneyAccountRemoteId: "cash-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Drawer",
  amount: 1000,
  settledAt: 1_710_000_050_000,
  note: "payment note",
  documentType: BillingDocumentType.Invoice,
  documentNumber: "INV-001",
  ...overrides,
});

const createHarness = (params?: { allocationReplaceFails?: boolean }) => {
  const contacts = new Map<string, { remoteId: string; fullName: string }>();
  const billingDocuments = new Map<string, BillingDocument>();
  const ledgerEntries = new Map<string, LedgerEntry>();
  const transactions = new Map<string, Record<string, unknown>>();
  const allocations: Array<{
    settlementLedgerEntryRemoteId: string;
    settlementTransactionRemoteId: string | null;
    documentRemoteId: string;
    amount: number;
    settledAt: number;
    note: string | null;
  }> = [];

  const getOutstandingAmount = (documentRemoteId: string) => {
    const document = billingDocuments.get(documentRemoteId);
    if (!document) {
      throw new Error(`Missing billing document ${documentRemoteId}`);
    }

    const paidAmount = allocations
      .filter((allocation) => allocation.documentRemoteId === documentRemoteId)
      .reduce((sum, allocation) => sum + allocation.amount, 0);

    return Number((document.totalAmount - paidAmount).toFixed(2));
  };

  const getBillingDocumentByRemoteIdUseCase = {
    execute: vi.fn(async (remoteId: string) => {
      const document = billingDocuments.get(remoteId);
      if (!document) {
        return {
          success: false as const,
          error: {
            type: BillingErrorType.DocumentNotFound,
            message: "The requested billing document was not found.",
          },
        };
      }

      return {
        success: true as const,
        value: {
          ...document,
          paidAmount: Number((document.totalAmount - getOutstandingAmount(remoteId)).toFixed(2)),
          outstandingAmount: getOutstandingAmount(remoteId),
        },
      };
    }),
  };

  const saveBillingDocumentUseCase = {
    execute: vi.fn(async (payload: any) => {
      const subtotalAmount = Number(
        payload.items
          .reduce(
            (sum: number, item: { quantity: number; unitRate: number }) =>
              sum + item.quantity * item.unitRate,
            0,
          )
          .toFixed(2),
      );
      const taxAmount = Number(
        ((subtotalAmount * payload.taxRatePercent) / 100).toFixed(2),
      );
      const totalAmount = Number((subtotalAmount + taxAmount).toFixed(2));
      const currentOutstanding = billingDocuments.has(payload.remoteId)
        ? getOutstandingAmount(payload.remoteId)
        : totalAmount;
      const paidAmount = Number((totalAmount - currentOutstanding).toFixed(2));

      const next: BillingDocument = {
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
        subtotalAmount,
        taxAmount,
        totalAmount,
        paidAmount,
        outstandingAmount: Number((totalAmount - paidAmount).toFixed(2)),
        isOverdue: false,
        issuedAt: payload.issuedAt,
        dueAt: payload.dueAt ?? null,
        sourceModule: payload.sourceModule ?? null,
        sourceRemoteId: payload.sourceRemoteId ?? null,
        linkedLedgerEntryRemoteId: payload.linkedLedgerEntryRemoteId ?? null,
        items: payload.items,
        createdAt: billingDocuments.get(payload.remoteId)?.createdAt ?? 1,
        updatedAt: (billingDocuments.get(payload.remoteId)?.updatedAt ?? 0) + 1,
      };

      billingDocuments.set(next.remoteId, next);
      return {
        success: true as const,
        value: next,
      };
    }),
  };

  const deleteBillingDocumentUseCase = {
    execute: vi.fn(async (remoteId: string) => {
      billingDocuments.delete(remoteId);
      return {
        success: true as const,
        value: true,
      };
    }),
  };

  const getOrCreateBusinessContactUseCase = {
    execute: vi.fn(async (payload: any) => {
      const existing =
        [...contacts.values()].find((contact) => contact.fullName === payload.fullName) ??
        null;
      if (existing) {
        return {
          success: true as const,
          value: existing,
        };
      }

      const created = {
        remoteId: `contact-${contacts.size + 1}`,
        fullName: payload.fullName,
      };
      contacts.set(created.remoteId, created);
      return {
        success: true as const,
        value: created,
      };
    }),
  };

  const getLedgerEntriesUseCase = {
    execute: vi.fn(async (payload: { businessAccountRemoteId: string }) => ({
      success: true as const,
      value: [...ledgerEntries.values()].filter(
        (entry) => entry.businessAccountRemoteId === payload.businessAccountRemoteId,
      ),
    })),
  };

  const toLedgerEntry = (payload: SaveLedgerEntryPayload): LedgerEntry => ({
    remoteId: payload.remoteId,
    businessAccountRemoteId: payload.businessAccountRemoteId,
    ownerUserRemoteId: payload.ownerUserRemoteId,
    partyName: payload.partyName,
    partyPhone: payload.partyPhone,
    contactRemoteId: payload.contactRemoteId ?? null,
    entryType: payload.entryType,
    balanceDirection: payload.balanceDirection,
    title: payload.title,
    amount: payload.amount,
    currencyCode: payload.currencyCode,
    note: payload.note,
    happenedAt: payload.happenedAt,
    dueAt: payload.dueAt,
    paymentMode: payload.paymentMode,
    referenceNumber: payload.referenceNumber,
    reminderAt: payload.reminderAt,
    attachmentUri: payload.attachmentUri,
    settledAgainstEntryRemoteId: payload.settledAgainstEntryRemoteId,
    linkedDocumentRemoteId: payload.linkedDocumentRemoteId ?? null,
    linkedTransactionRemoteId: payload.linkedTransactionRemoteId,
    settlementAccountRemoteId: payload.settlementAccountRemoteId,
    settlementAccountDisplayNameSnapshot:
      payload.settlementAccountDisplayNameSnapshot,
    createdAt: ledgerEntries.get(payload.remoteId)?.createdAt ?? 1,
    updatedAt: (ledgerEntries.get(payload.remoteId)?.updatedAt ?? 0) + 1,
  });

  const addLedgerEntryUseCase = {
    execute: vi.fn(async (payload: SaveLedgerEntryPayload) => {
      const entry = toLedgerEntry(payload);
      ledgerEntries.set(entry.remoteId, entry);
      return {
        success: true as const,
        value: entry,
      };
    }),
  };

  const updateLedgerEntryUseCase = {
    execute: vi.fn(async (payload: SaveLedgerEntryPayload) => {
      const entry = toLedgerEntry(payload);
      ledgerEntries.set(entry.remoteId, entry);
      return {
        success: true as const,
        value: entry,
      };
    }),
  };

  const deleteLedgerEntryUseCase = {
    execute: vi.fn(async (remoteId: string) => {
      ledgerEntries.delete(remoteId);
      return {
        success: true as const,
        value: true,
      };
    }),
  };

  const linkBillingDocumentLedgerEntryUseCase = {
    execute: vi.fn(async (documentRemoteId: string, ledgerRemoteId: string) => {
      const existing = billingDocuments.get(documentRemoteId);
      if (!existing) {
        return {
          success: false as const,
          error: {
            type: "VALIDATION_ERROR" as const,
            message: "Billing document missing.",
          },
        };
      }

      billingDocuments.set(documentRemoteId, {
        ...existing,
        linkedLedgerEntryRemoteId: ledgerRemoteId,
      });
      return {
        success: true as const,
        value: true,
      };
    }),
  };

  const getMoneyAccountsUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: [
        {
          remoteId: "cash-1",
          ownerUserRemoteId: "user-1",
          scopeAccountRemoteId: "business-1",
          name: "Cash Drawer",
          type: MoneyAccountType.Cash,
          currentBalance: 1000,
          description: null,
          currencyCode: "NPR",
          isPrimary: true,
          isActive: true,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    })),
  };

  const postBusinessTransactionUseCase = {
    execute: vi.fn(async (payload: any) => {
      transactions.set(payload.remoteId, payload);
      return {
        success: true as const,
        value: payload,
      };
    }),
  };

  const deleteBusinessTransactionUseCase = {
    execute: vi.fn(async (remoteId: string) => {
      transactions.delete(remoteId);
      return {
        success: true as const,
        value: true,
      };
    }),
  };

  const replaceBillingDocumentAllocationsForSettlementEntryUseCase = {
    execute: vi.fn(async (payload: any) => {
      if (params?.allocationReplaceFails) {
        return {
          success: false as const,
          error: {
            type: "UNKNOWN_ERROR" as const,
            message: "allocation replace failed",
          },
        };
      }

      for (let index = allocations.length - 1; index >= 0; index -= 1) {
        if (allocations[index]?.settlementLedgerEntryRemoteId === payload.settlementLedgerEntryRemoteId) {
          allocations.splice(index, 1);
        }
      }

      payload.allocations.forEach((allocation: { documentRemoteId: string; amount: number }) => {
        allocations.push({
          settlementLedgerEntryRemoteId: payload.settlementLedgerEntryRemoteId,
          settlementTransactionRemoteId: payload.settlementTransactionRemoteId,
          documentRemoteId: allocation.documentRemoteId,
          amount: allocation.amount,
          settledAt: payload.settledAt,
          note: payload.note,
        });
      });

      return {
        success: true as const,
        value: true,
      };
    }),
  };

  const deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase = {
    execute: vi.fn(async (remoteId: string) => {
      for (let index = allocations.length - 1; index >= 0; index -= 1) {
        if (allocations[index]?.settlementLedgerEntryRemoteId === remoteId) {
          allocations.splice(index, 1);
        }
      }
      return {
        success: true as const,
        value: true,
      };
    }),
  };

  const recordAuditEventUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {} as never,
    })),
  };

  const saveLedgerEntryWithSettlementUseCase = createSaveLedgerEntryWithSettlementUseCase({
    addLedgerEntryUseCase: addLedgerEntryUseCase as any,
    updateLedgerEntryUseCase: updateLedgerEntryUseCase as any,
    getMoneyAccountsUseCase: getMoneyAccountsUseCase as any,
    postBusinessTransactionUseCase: postBusinessTransactionUseCase as any,
    deleteBusinessTransactionUseCase: deleteBusinessTransactionUseCase as any,
    saveBillingDocumentUseCase: saveBillingDocumentUseCase as any,
    replaceBillingDocumentAllocationsForSettlementEntryUseCase:
      replaceBillingDocumentAllocationsForSettlementEntryUseCase as any,
    deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase:
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase as any,
    deleteBillingDocumentUseCase: deleteBillingDocumentUseCase as any,
    recordAuditEventUseCase: recordAuditEventUseCase as any,
  });

  const issueUseCase = createRunBillingDocumentIssueUseCase({
    getBillingDocumentByRemoteIdUseCase:
      getBillingDocumentByRemoteIdUseCase as any,
    saveBillingDocumentUseCase: saveBillingDocumentUseCase as any,
    deleteBillingDocumentUseCase: deleteBillingDocumentUseCase as any,
    getOrCreateBusinessContactUseCase:
      getOrCreateBusinessContactUseCase as any,
    getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
    addLedgerEntryUseCase: addLedgerEntryUseCase as any,
    deleteLedgerEntryUseCase: deleteLedgerEntryUseCase as any,
    updateLedgerEntryUseCase: updateLedgerEntryUseCase as any,
    linkBillingDocumentLedgerEntryUseCase:
      linkBillingDocumentLedgerEntryUseCase as any,
  });

  const settlementUseCase = createRunBillingSettlementUseCase({
    getBillingDocumentByRemoteIdUseCase:
      getBillingDocumentByRemoteIdUseCase as any,
    linkBillingDocumentLedgerEntryUseCase:
      linkBillingDocumentLedgerEntryUseCase as any,
    getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
    addLedgerEntryUseCase: addLedgerEntryUseCase as any,
    saveLedgerEntryWithSettlementUseCase:
      saveLedgerEntryWithSettlementUseCase as any,
  });

  return {
    issueUseCase,
    settlementUseCase,
    billingDocuments,
    ledgerEntries,
    transactions,
    allocations,
    getOutstandingAmount,
    spies: {
      saveBillingDocumentExecute: saveBillingDocumentUseCase.execute,
      addLedgerEntryExecute: addLedgerEntryUseCase.execute,
      postBusinessTransactionExecute: postBusinessTransactionUseCase.execute,
      deleteBusinessTransactionExecute: deleteBusinessTransactionUseCase.execute,
      replaceAllocationsExecute:
        replaceBillingDocumentAllocationsForSettlementEntryUseCase.execute,
    },
  };
};

describe("billingLedger.integration", () => {
  it("issues an unpaid invoice and creates a linked ledger due entry", async () => {
    const harness = createHarness();

    const result = await harness.issueUseCase.execute(buildIssuePayload());

    expect(result.success).toBe(true);
    expect(harness.billingDocuments.size).toBe(1);
    expect(harness.ledgerEntries.size).toBe(1);

    const document = harness.billingDocuments.get("bill-1");
    const dueEntry = [...harness.ledgerEntries.values()][0];

    expect(document?.linkedLedgerEntryRemoteId).toBe(dueEntry?.remoteId);
    expect(document?.contactRemoteId).toBe(dueEntry?.contactRemoteId);
    expect(dueEntry?.linkedDocumentRemoteId).toBe("bill-1");
  });

  it("settles a full invoice payment by creating a transaction, settlement entry, and allocation", async () => {
    const harness = createHarness();
    await harness.issueUseCase.execute(buildIssuePayload());

    const result = await harness.settlementUseCase.execute(
      buildSettlementPayload({
        amount: 1000,
      }),
    );

    expect(result.success).toBe(true);
    expect(harness.transactions.size).toBe(1);
    expect(harness.allocations).toHaveLength(1);
    expect(harness.getOutstandingAmount("bill-1")).toBe(0);
    expect(
      [...harness.ledgerEntries.values()].some(
        (entry) =>
          entry.entryType === LedgerEntryType.Collection &&
          entry.settledAgainstEntryRemoteId,
      ),
    ).toBe(true);
  });

  it("keeps the outstanding balance equal to the unpaid remainder after a partial settlement", async () => {
    const harness = createHarness();
    await harness.issueUseCase.execute(buildIssuePayload());

    const result = await harness.settlementUseCase.execute(
      buildSettlementPayload({
        amount: 400,
      }),
    );

    expect(result.success).toBe(true);
    expect(harness.transactions.size).toBe(1);
    expect(harness.allocations).toHaveLength(1);
    expect(harness.allocations[0]?.amount).toBe(400);
    expect(harness.getOutstandingAmount("bill-1")).toBe(600);
    expect(
      [...harness.transactions.values()][0]?.amount,
    ).toBe(400);
  });

  it("rolls back the created payment transaction when downstream allocation replacement fails", async () => {
    const harness = createHarness({
      allocationReplaceFails: true,
    });
    await harness.issueUseCase.execute(buildIssuePayload());

    const result = await harness.settlementUseCase.execute(
      buildSettlementPayload({
        amount: 400,
      }),
    );

    expect(result.success).toBe(false);
    expect(harness.spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(harness.spies.replaceAllocationsExecute).toHaveBeenCalledTimes(1);
    expect(harness.spies.deleteBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(harness.transactions.size).toBe(0);
    expect(harness.allocations).toHaveLength(0);
    expect(
      [...harness.ledgerEntries.values()].filter(
        (entry) => entry.entryType === LedgerEntryType.Collection,
      ),
    ).toHaveLength(0);
  });
});
