import { BillingDocumentStatus, BillingDocumentType } from "@/feature/billing/types/billing.types";
import { LedgerBalanceDirection } from "@/feature/ledger/types/ledger.entity.types";
import { PosSaleWorkflowStatus } from "@/feature/pos/types/posSale.constant";
import {
  TransactionDirection,
  TransactionPostingStatus,
} from "@/feature/transactions/types/transaction.entity.types";
import { createContactHistoryRepository } from "@/shared/readModel/contactHistory/data/repository/contactHistory.repository.impl";
import { describe, expect, it, vi } from "vitest";

describe("contactHistory.integration", () => {
  it("finds invoice, ledger, payment transaction, POS sale, and order history through contactRemoteId", async () => {
    const repository = createContactHistoryRepository({
      getDataset: vi.fn(async () => ({
        success: true as const,
        value: {
          contact: {
            remoteId: "contact-1",
            fullName: "Kapil Customer",
            accountRemoteId: "business-1",
          },
          transactions: [
            {
              remoteId: "txn-posted-in",
              title: "Payment received",
              settlementMoneyAccountDisplayNameSnapshot: "Cash",
              categoryLabel: "Sales",
              sourceModule: "ledger",
              happenedAt: 1_711_000_000_000,
              amount: 400,
              direction: TransactionDirection.In,
              postingStatus: TransactionPostingStatus.Posted,
            },
          ],
          billingDocuments: [
            {
              remoteId: "bill-open",
              documentNumber: "INV-001",
              customerName: "Kapil Customer",
              issuedAt: 1_713_000_000_000,
              totalAmount: 1000,
              documentType: BillingDocumentType.Invoice,
              status: BillingDocumentStatus.Pending,
            },
          ],
          ledgerEntries: [
            {
              remoteId: "led-1",
              title: "Customer due",
              referenceNumber: "INV-001",
              note: null,
              happenedAt: 1_715_000_000_000,
              amount: 600,
              balanceDirection: LedgerBalanceDirection.Receive,
              entryType: "sale",
            },
          ],
          orders: [
            {
              remoteId: "order-1",
              orderNumber: "ORD-001",
              deliveryOrPickupDetails: "Pickup",
              notes: null,
              orderDate: 1_717_000_000_000,
              totalAmount: 1000,
              status: "confirmed",
            },
          ],
          posSales: [
            {
              remoteId: "pos-posted",
              receiptNumber: "RCPT-002",
              customerNameSnapshot: "Kapil Customer",
              updatedAt: new Date(1_719_000_000_000),
              grandTotal: 1000,
              workflowStatus: PosSaleWorkflowStatus.Posted,
            },
          ],
        } as never,
      })),
    } as never);

    const result = await repository.getContactHistoryReadModel({
      accountRemoteId: "business-1",
      contactRemoteId: "contact-1",
      timelineLimit: 10,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.summary.totalMoneyIn).toBe(400);
    expect(result.value.summary.openBillingDocumentCount).toBe(1);
    expect(result.value.summary.ledgerEntryCount).toBe(1);
    expect(result.value.summary.orderCount).toBe(1);
    expect(result.value.summary.posSaleCount).toBe(1);
    expect(result.value.timelineItems.map((item) => item.sourceRemoteId)).toEqual(
      expect.arrayContaining([
        "txn-posted-in",
        "bill-open",
        "led-1",
        "order-1",
        "pos-posted",
      ]),
    );
  });
});
