import { describe, expect, it, vi } from "vitest";
import {
  BillingDocument,
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import { GetBillingDocumentByRemoteIdUseCase } from "@/feature/billing/useCase/getBillingDocumentByRemoteId.useCase";
import { LinkBillingDocumentLedgerEntryUseCase } from "@/feature/billing/useCase/linkBillingDocumentLedgerEntry.useCase";
import { PayBillingDocumentPayload } from "@/feature/billing/useCase/payBillingDocument.useCase";
import { createRunBillingSettlementUseCase } from "@/feature/billing/workflow/billingSettlement/useCase/runBillingSettlement.useCase.impl";
import {
  LedgerBalanceDirection,
  LedgerEntry,
  LedgerEntryType,
  SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { SaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase";

const buildBillingDocument = (
  overrides: Partial<BillingDocument> = {},
): BillingDocument => ({
  remoteId: "bill-1",
  accountRemoteId: "business-1",
  documentNumber: "INV-2026-001",
  documentType: BillingDocumentType.Invoice,
  templateType: BillingTemplateType.StandardInvoice,
  customerName: "Acme Traders",
  contactRemoteId: "contact-1",
  status: BillingDocumentStatus.Pending,
  taxRatePercent: 0,
  notes: "invoice note",
  subtotalAmount: 100,
  taxAmount: 0,
  totalAmount: 100,
  paidAmount: 0,
  outstandingAmount: 100,
  isOverdue: false,
  issuedAt: 1_710_000_000_000,
  dueAt: 1_710_086_400_000,
  sourceModule: null,
  sourceRemoteId: null,
  linkedLedgerEntryRemoteId: "due-1",
  items: [],
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
  amount: 100,
  currencyCode: null,
  note: null,
  happenedAt: 1_710_000_000_000,
  dueAt: 1_710_086_400_000,
  paymentMode: null,
  referenceNumber: "INV-2026-001",
  reminderAt: null,
  attachmentUri: null,
  settledAgainstEntryRemoteId: null,
  linkedDocumentRemoteId: "bill-1",
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const buildPayload = (
  overrides: Partial<PayBillingDocumentPayload> = {},
): PayBillingDocumentPayload => ({
  billingDocumentRemoteId: "bill-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Main Business",
  ownerUserRemoteId: "user-1",
  settlementMoneyAccountRemoteId: "cash-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
  amount: 100,
  settledAt: 1_710_000_050_000,
  note: "payment note",
  documentType: BillingDocumentType.Invoice,
  documentNumber: "INV-2026-001",
  ...overrides,
});

const createDependencies = () => {
  const getBillingDocumentByRemoteIdUseCase: { execute: any } = {
    execute: vi.fn(async (_remoteId: string) => ({
      success: true as const,
      value: buildBillingDocument(),
    })),
  };

  const linkBillingDocumentLedgerEntryUseCase: { execute: any } = {
    execute: vi.fn(async (_documentRemoteId: string, _ledgerRemoteId: string) => ({
      success: true as const,
      value: true,
    })),
  };

  const getLedgerEntriesUseCase: { execute: any } = {
    execute: vi.fn(async (_params: any) => ({
      success: true as const,
      value: [buildLedgerEntry()],
    })),
  };

  const addLedgerEntryUseCase: { execute: any } = {
    execute: vi.fn(async (payload: SaveLedgerEntryPayload) => ({
      success: true as const,
      value: buildLedgerEntry({
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
      }),
    })),
  };

  const saveLedgerEntryWithSettlementUseCase: { execute: any } = {
    execute: vi.fn(async (payload: any) => ({
      success: true as const,
      value: buildLedgerEntry({
        remoteId: payload.ledgerEntry.remoteId,
        businessAccountRemoteId: payload.ledgerEntry.businessAccountRemoteId,
        ownerUserRemoteId: payload.ledgerEntry.ownerUserRemoteId,
        partyName: payload.ledgerEntry.partyName,
        partyPhone: payload.ledgerEntry.partyPhone,
        contactRemoteId: payload.ledgerEntry.contactRemoteId,
        entryType: payload.ledgerEntry.entryType,
        balanceDirection: payload.ledgerEntry.balanceDirection,
        title: payload.ledgerEntry.title,
        amount: payload.ledgerEntry.amount,
        currencyCode: payload.ledgerEntry.currencyCode,
        note: payload.ledgerEntry.note,
        happenedAt: payload.ledgerEntry.happenedAt,
        dueAt: payload.ledgerEntry.dueAt,
        paymentMode: payload.ledgerEntry.paymentMode,
        referenceNumber: payload.ledgerEntry.referenceNumber,
        reminderAt: payload.ledgerEntry.reminderAt,
        attachmentUri: payload.ledgerEntry.attachmentUri,
        settledAgainstEntryRemoteId:
          payload.ledgerEntry.settledAgainstEntryRemoteId,
        linkedDocumentRemoteId: payload.ledgerEntry.linkedDocumentRemoteId,
        linkedTransactionRemoteId: payload.ledgerEntry.linkedTransactionRemoteId,
        settlementAccountRemoteId: payload.ledgerEntry.settlementAccountRemoteId,
        settlementAccountDisplayNameSnapshot:
          payload.ledgerEntry.settlementAccountDisplayNameSnapshot,
      }),
    })),
  };

  const useCase = createRunBillingSettlementUseCase({
    getBillingDocumentByRemoteIdUseCase:
      getBillingDocumentByRemoteIdUseCase as unknown as GetBillingDocumentByRemoteIdUseCase,
    linkBillingDocumentLedgerEntryUseCase:
      linkBillingDocumentLedgerEntryUseCase as unknown as LinkBillingDocumentLedgerEntryUseCase,
    getLedgerEntriesUseCase:
      getLedgerEntriesUseCase as unknown as GetLedgerEntriesUseCase,
    addLedgerEntryUseCase: addLedgerEntryUseCase as unknown as AddLedgerEntryUseCase,
    saveLedgerEntryWithSettlementUseCase:
      saveLedgerEntryWithSettlementUseCase as unknown as SaveLedgerEntryWithSettlementUseCase,
  });

  return {
    useCase,
    getBillingDocumentByRemoteIdUseCase,
    linkBillingDocumentLedgerEntryUseCase,
    getLedgerEntriesUseCase,
    addLedgerEntryUseCase,
    saveLedgerEntryWithSettlementUseCase,
  };
};

describe("runBillingSettlement.useCase", () => {
  it("pays invoice full amount through ledger settlement", async () => {
    const deps = createDependencies();

    const result = await deps.useCase.execute(buildPayload({ amount: 100 }));

    expect(result.success).toBe(true);
    expect(deps.addLedgerEntryUseCase.execute).not.toHaveBeenCalled();
    expect(deps.linkBillingDocumentLedgerEntryUseCase.execute).not.toHaveBeenCalled();
    expect(deps.saveLedgerEntryWithSettlementUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "create",
        selectedSettlementAccountRemoteId: "cash-1",
        ledgerEntry: expect.objectContaining({
          entryType: LedgerEntryType.Collection,
          balanceDirection: LedgerBalanceDirection.Receive,
          amount: 100,
          settledAgainstEntryRemoteId: "due-1",
          referenceNumber: "INV-2026-001",
        }),
      }),
    );
  });

  it("pays invoice partial amount through ledger settlement", async () => {
    const deps = createDependencies();
    deps.getBillingDocumentByRemoteIdUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: buildBillingDocument({
        totalAmount: 250,
        paidAmount: 50,
        outstandingAmount: 200,
      }),
    }));

    const result = await deps.useCase.execute(buildPayload({ amount: 80 }));

    expect(result.success).toBe(true);
    expect(deps.saveLedgerEntryWithSettlementUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ledgerEntry: expect.objectContaining({ amount: 80 }),
        settlementCandidates: [{ remoteId: "due-1", outstandingAmount: 200 }],
      }),
    );
  });

  it("pays supplier receipt full amount as payment-out", async () => {
    const deps = createDependencies();
    deps.getBillingDocumentByRemoteIdUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: buildBillingDocument({
        documentType: BillingDocumentType.Receipt,
        documentNumber: "RCPT-2026-001",
        templateType: BillingTemplateType.PosReceipt,
      }),
    }));
    deps.getLedgerEntriesUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: [
        buildLedgerEntry({
          remoteId: "due-rcpt-1",
          entryType: LedgerEntryType.Purchase,
          balanceDirection: LedgerBalanceDirection.Pay,
          linkedDocumentRemoteId: "bill-1",
        }),
      ],
    }));

    const result = await deps.useCase.execute(buildPayload({ amount: 100 }));

    expect(result.success).toBe(true);
    expect(deps.saveLedgerEntryWithSettlementUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ledgerEntry: expect.objectContaining({
          entryType: LedgerEntryType.PaymentOut,
          balanceDirection: LedgerBalanceDirection.Pay,
          settledAgainstEntryRemoteId: "due-rcpt-1",
        }),
      }),
    );
  });

  it("pays supplier receipt partial amount as payment-out", async () => {
    const deps = createDependencies();
    deps.getBillingDocumentByRemoteIdUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: buildBillingDocument({
        documentType: BillingDocumentType.Receipt,
        documentNumber: "RCPT-2026-002",
        totalAmount: 400,
        paidAmount: 80,
        outstandingAmount: 320,
        templateType: BillingTemplateType.PosReceipt,
      }),
    }));
    deps.getLedgerEntriesUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: [
        buildLedgerEntry({
          remoteId: "due-rcpt-2",
          entryType: LedgerEntryType.Purchase,
          balanceDirection: LedgerBalanceDirection.Pay,
          linkedDocumentRemoteId: "bill-1",
        }),
      ],
    }));

    const result = await deps.useCase.execute(buildPayload({ amount: 120 }));

    expect(result.success).toBe(true);
    expect(deps.saveLedgerEntryWithSettlementUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ledgerEntry: expect.objectContaining({ amount: 120 }),
        settlementCandidates: [{ remoteId: "due-rcpt-2", outstandingAmount: 320 }],
      }),
    );
  });

  it("recovers linkage when billing linked ledger id is inconsistent but due exists by document link", async () => {
    const deps = createDependencies();
    deps.getBillingDocumentByRemoteIdUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: buildBillingDocument({ linkedLedgerEntryRemoteId: "due-wrong" }),
    }));
    deps.getLedgerEntriesUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: [
        buildLedgerEntry({
          remoteId: "due-wrong",
          linkedDocumentRemoteId: "bill-other",
        }),
        buildLedgerEntry({
          remoteId: "due-real",
          linkedDocumentRemoteId: "bill-1",
        }),
      ],
    }));

    const result = await deps.useCase.execute(buildPayload({ amount: 50 }));

    expect(result.success).toBe(true);
    expect(deps.addLedgerEntryUseCase.execute).not.toHaveBeenCalled();
    expect(deps.linkBillingDocumentLedgerEntryUseCase.execute).toHaveBeenCalledWith(
      "bill-1",
      "due-real",
    );
  });

  it("creates missing due for outstanding amount only and links billing to recovered due", async () => {
    const deps = createDependencies();
    deps.getBillingDocumentByRemoteIdUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: buildBillingDocument({
        totalAmount: 300,
        paidAmount: 100,
        outstandingAmount: 200,
        dueAt: null,
        linkedLedgerEntryRemoteId: null,
      }),
    }));
    deps.getLedgerEntriesUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: [],
    }));

    const result = await deps.useCase.execute(buildPayload({ amount: 60 }));

    expect(result.success).toBe(true);
    expect(deps.addLedgerEntryUseCase.execute).toHaveBeenCalledTimes(1);

    const recoveredDuePayload = deps.addLedgerEntryUseCase.execute.mock.calls[0]![0];
    expect(recoveredDuePayload).toMatchObject({
      entryType: LedgerEntryType.Sale,
      amount: 200,
      linkedDocumentRemoteId: "bill-1",
      contactRemoteId: "contact-1",
      referenceNumber: "INV-2026-001",
      dueAt: 1_710_000_000_000,
    });

    const recoveredRemoteId = recoveredDuePayload.remoteId;
    expect(deps.linkBillingDocumentLedgerEntryUseCase.execute).toHaveBeenCalledWith(
      "bill-1",
      recoveredRemoteId,
    );
    expect(deps.saveLedgerEntryWithSettlementUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        settlementCandidates: [
          {
            remoteId: recoveredRemoteId,
            outstandingAmount: 200,
          },
        ],
      }),
    );
  });

  it("rejects already fully settled billing documents", async () => {
    const deps = createDependencies();
    deps.getBillingDocumentByRemoteIdUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: buildBillingDocument({
        status: BillingDocumentStatus.Paid,
        paidAmount: 100,
        outstandingAmount: 0,
      }),
    }));

    const result = await deps.useCase.execute(buildPayload({ amount: 1 }));

    expect(result.success).toBe(false);
    expect(deps.getLedgerEntriesUseCase.execute).not.toHaveBeenCalled();
    expect(deps.saveLedgerEntryWithSettlementUseCase.execute).not.toHaveBeenCalled();
    if (!result.success) {
      expect(result.error.message).toContain("already fully settled");
    }
  });

  it("rejects draft billing documents", async () => {
    const deps = createDependencies();
    deps.getBillingDocumentByRemoteIdUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: buildBillingDocument({ status: BillingDocumentStatus.Draft }),
    }));

    const result = await deps.useCase.execute(buildPayload({ amount: 20 }));

    expect(result.success).toBe(false);
    expect(deps.getLedgerEntriesUseCase.execute).not.toHaveBeenCalled();
    if (!result.success) {
      expect(result.error.message).toContain("Draft billing documents");
    }
  });

  it("rejects overpayment", async () => {
    const deps = createDependencies();
    deps.getBillingDocumentByRemoteIdUseCase.execute = vi.fn(async () => ({
      success: true as const,
      value: buildBillingDocument({ outstandingAmount: 50 }),
    }));

    const result = await deps.useCase.execute(buildPayload({ amount: 60 }));

    expect(result.success).toBe(false);
    expect(deps.getLedgerEntriesUseCase.execute).not.toHaveBeenCalled();
    if (!result.success) {
      expect(result.error.message).toContain(
        "greater than outstanding amount",
      );
    }
  });
});
