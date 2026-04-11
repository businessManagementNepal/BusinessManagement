import { describe, expect, it, vi } from "vitest";
import { BillingDatasource } from "@/feature/billing/data/dataSource/billing.datasource";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingErrorType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";

const createDatasource = (
  linkResult: Awaited<
    ReturnType<BillingDatasource["linkBillingDocumentContactRemoteId"]>
  >,
) =>
  ({
    linkBillingDocumentContactRemoteId: vi.fn(async () => linkResult),
  }) as unknown as BillingDatasource & {
    linkBillingDocumentContactRemoteId: ReturnType<typeof vi.fn>;
  };

describe("billing.repository contact link", () => {
  it("forwards contact link updates to the datasource", async () => {
    const datasource = createDatasource({
      success: true as const,
      value: true,
    });
    const repository = createBillingRepository(datasource);

    const result = await repository.linkBillingDocumentContactRemoteId(
      "bill-1",
      "contact-1",
    );

    expect(result.success).toBe(true);
    expect(datasource.linkBillingDocumentContactRemoteId).toHaveBeenCalledWith(
      "bill-1",
      "contact-1",
    );
  });

  it("supports clearing the contact link", async () => {
    const datasource = createDatasource({
      success: true as const,
      value: true,
    });
    const repository = createBillingRepository(datasource);

    const result = await repository.linkBillingDocumentContactRemoteId(
      "bill-1",
      null,
    );

    expect(result.success).toBe(true);
    expect(datasource.linkBillingDocumentContactRemoteId).toHaveBeenCalledWith(
      "bill-1",
      null,
    );
  });

  it("maps datasource failures through the Billing error shape", async () => {
    const datasource = createDatasource({
      success: false as const,
      error: new Error("Billing document not found"),
    });
    const repository = createBillingRepository(datasource);

    const result = await repository.linkBillingDocumentContactRemoteId(
      "bill-404",
      "contact-1",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(BillingErrorType.DocumentNotFound);
      expect(result.error.message).toBe(
        "The requested billing document was not found.",
      );
    }
  });

  it("passes contactRemoteId through document save payloads", async () => {
    const datasource = {
      saveBillingDocument: vi.fn(async (payload: any) => ({
        success: true as const,
        value: {
          document: {
            remoteId: payload.remoteId,
            accountRemoteId: payload.accountRemoteId,
            documentNumber: payload.documentNumber,
            documentType: payload.documentType,
            templateType: payload.templateType,
            customerName: payload.customerName,
            contactRemoteId: payload.contactRemoteId,
            status: payload.status,
            taxRatePercent: payload.taxRatePercent,
            notes: payload.notes,
            subtotalAmount: 100,
            taxAmount: 0,
            totalAmount: 100,
            issuedAt: payload.issuedAt,
            dueAt: payload.dueAt,
            sourceModule: null,
            sourceRemoteId: null,
            linkedLedgerEntryRemoteId: null,
            createdAt: new Date(1),
            updatedAt: new Date(2),
          },
          items: [
            {
              remoteId: "line-1",
              itemName: "Service",
              quantity: 1,
              unitRate: 100,
              lineTotal: 100,
              lineOrder: 0,
            },
          ],
        },
      })),
    } as unknown as BillingDatasource & {
      saveBillingDocument: ReturnType<typeof vi.fn>;
    };
    const repository = createBillingRepository(datasource);

    const result = await repository.saveBillingDocument({
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
      issuedAt: 1_710_000_000_000,
      dueAt: 1_710_086_400_000,
      items: [
        {
          remoteId: "line-1",
          itemName: "Service",
          quantity: 1,
          unitRate: 100,
          lineOrder: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(datasource.saveBillingDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        contactRemoteId: "contact-1",
      }),
    );
    if (result.success) {
      expect(result.value.contactRemoteId).toBe("contact-1");
    }
  });
});
