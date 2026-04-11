import { describe, expect, it } from "vitest";
import { BillingDocumentModel } from "@/feature/billing/data/dataSource/db/billingDocument.model";
import { BillingDocumentItemModel } from "@/feature/billing/data/dataSource/db/billingDocumentItem.model";
import { mapBillingDocumentModelToDomain } from "@/feature/billing/data/repository/mapper/billing.mapper";
import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import { LedgerEntryModel } from "@/feature/ledger/data/dataSource/db/ledger.model";
import { mapLedgerEntryModelToDomain } from "@/feature/ledger/data/repository/mapper/ledger.mapper";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
  LedgerPaymentMode,
} from "@/feature/ledger/types/ledger.entity.types";

describe("contactRemoteId model mapping", () => {
  it("maps BillingDocument.contactRemoteId into the domain document", () => {
    const document = {
      remoteId: "bill-1",
      accountRemoteId: "business-1",
      documentNumber: "INV-2026-001",
      documentType: BillingDocumentType.Invoice,
      templateType: BillingTemplateType.StandardInvoice,
      customerName: "Acme Traders",
      contactRemoteId: "contact-1",
      status: BillingDocumentStatus.Pending,
      taxRatePercent: 0,
      notes: null,
      subtotalAmount: 100,
      taxAmount: 0,
      totalAmount: 100,
      issuedAt: 1_710_000_000_000,
      dueAt: 1_710_086_400_000,
      sourceModule: null,
      sourceRemoteId: null,
      linkedLedgerEntryRemoteId: null,
      createdAt: new Date(1),
      updatedAt: new Date(2),
    } as BillingDocumentModel;
    const item = {
      remoteId: "line-1",
      itemName: "Service",
      quantity: 1,
      unitRate: 100,
      lineTotal: 100,
      lineOrder: 0,
    } as BillingDocumentItemModel;

    const result = mapBillingDocumentModelToDomain(document, [item]);

    expect(result.contactRemoteId).toBe("contact-1");
    expect(result.items).toHaveLength(1);
  });

  it("maps LedgerEntry.contactRemoteId into the domain entry", async () => {
    const entry = {
      remoteId: "led-1",
      businessAccountRemoteId: "business-1",
      ownerUserRemoteId: "user-1",
      partyName: "Acme Traders",
      partyPhone: null,
      contactRemoteId: "contact-1",
      entryType: LedgerEntryType.Collection,
      balanceDirection: LedgerBalanceDirection.Receive,
      title: "Receive Money - Acme Traders",
      amount: 100,
      currencyCode: "NPR",
      note: null,
      happenedAt: 1_710_000_000_000,
      dueAt: null,
      paymentMode: LedgerPaymentMode.Cash,
      referenceNumber: null,
      reminderAt: null,
      attachmentUri: null,
      settledAgainstEntryRemoteId: "due-1",
      linkedDocumentRemoteId: null,
      linkedTransactionRemoteId: "txn-1",
      settlementAccountRemoteId: "cash-1",
      settlementAccountDisplayNameSnapshot: "Cash Box",
      createdAt: new Date(1),
      updatedAt: new Date(2),
    } as LedgerEntryModel;

    const result = await mapLedgerEntryModelToDomain(entry);

    expect(result.contactRemoteId).toBe("contact-1");
    expect(result.linkedTransactionRemoteId).toBe("txn-1");
  });
});
