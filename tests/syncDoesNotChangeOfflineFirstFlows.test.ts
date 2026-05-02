import { createSaveContactUseCase } from "@/feature/contacts/useCase/saveContact.useCase.impl";
import { createSaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createCreateOrderUseCase } from "@/feature/orders/useCase/createOrder.useCase.impl";
import { createCreatePosSaleDraftUseCase } from "@/feature/pos/useCase/createPosSaleDraft.useCase.impl";
import { createAddTransactionUseCase } from "@/feature/transactions/useCase/addTransaction.useCase.impl";
import {
  ContactBalanceDirection,
  ContactType,
} from "@/feature/contacts/types/contact.types";
import {
  ProductKind,
  ProductStatus,
} from "@/feature/products/types/product.types";
import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import { OrderStatus } from "@/feature/orders/types/order.types";
import { PosSaleWorkflowStatus } from "@/feature/pos/types/posSale.constant";
import {
  TransactionDirection,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { describe, expect, it, vi } from "vitest";

describe("sync does not change offline-first flows", () => {
  it("saves manual transactions locally through the existing posting use case", async () => {
    const postMoneyMovementUseCase = {
      execute: vi.fn(async (payload: any) => ({
        success: true as const,
        value: payload,
      })),
    };
    const useCase = createAddTransactionUseCase(postMoneyMovementUseCase as never);

    const result = await useCase.execute({
      remoteId: "txn-1",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "account-1",
      accountDisplayNameSnapshot: "Main",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: "Manual sale",
      amount: 500,
      currencyCode: "NPR",
      categoryLabel: null,
      note: null,
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: null,
      settlementMoneyAccountDisplayNameSnapshot: null,
    });

    expect(result.success).toBe(true);
    expect(postMoneyMovementUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("saves contacts without any sync runtime dependency", async () => {
    const repository = {
      saveContact: vi.fn(async (payload: any) => ({
        success: true as const,
        value: payload,
      })),
    };
    const useCase = createSaveContactUseCase(repository as never);

    const result = await useCase.execute({
      remoteId: "contact-1",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "account-1",
      accountType: "business",
      contactType: ContactType.Customer,
      fullName: "Hari",
      phoneNumber: "9800000000",
      emailAddress: null,
      address: null,
      taxId: null,
      openingBalanceAmount: 100,
      openingBalanceDirection: ContactBalanceDirection.Receive,
      notes: null,
      isArchived: false,
    });

    expect(result.success).toBe(true);
    expect(repository.saveContact).toHaveBeenCalledTimes(1);
  });

  it("saves products without any sync runtime dependency", async () => {
    const repository = {
      saveProduct: vi.fn(async (payload: any) => ({
        success: true as const,
        value: payload,
      })),
    };
    const useCase = createSaveProductUseCase(repository as never);

    const result = await useCase.execute({
      remoteId: "product-1",
      accountRemoteId: "account-1",
      name: "Rice Bag",
      kind: ProductKind.Item,
      categoryName: "Groceries",
      salePrice: 100,
      costPrice: 80,
      unitLabel: "bag",
      skuOrBarcode: null,
      taxRateLabel: null,
      description: null,
      imageUrl: null,
      status: ProductStatus.Active,
    });

    expect(result.success).toBe(true);
    expect(repository.saveProduct).toHaveBeenCalledTimes(1);
  });

  it("saves billing drafts directly to the local repository path", async () => {
    const repository = {
      saveBillingDocument: vi.fn(async (payload: any) => ({
        success: true as const,
        value: payload,
      })),
    };
    const useCase = createSaveBillingDocumentUseCase(repository as never);

    const result = await useCase.execute({
      remoteId: "bill-1",
      accountRemoteId: "account-1",
      documentNumber: "INV-001",
      documentType: BillingDocumentType.Invoice,
      templateType: BillingTemplateType.StandardInvoice,
      customerName: "Hari",
      contactRemoteId: null,
      status: BillingDocumentStatus.Draft,
      taxRatePercent: 13,
      notes: null,
      issuedAt: 1_710_000_000_000,
      dueAt: null,
      items: [],
    });

    expect(result.success).toBe(true);
    expect(repository.saveBillingDocument).toHaveBeenCalledTimes(1);
  });

  it("saves ledger entries through the existing local ledger repository path", async () => {
    const repository = {
      saveLedgerEntry: vi.fn(async (payload: any) => ({
        success: true as const,
        value: payload,
      })),
      getLedgerEntryByLinkedDocumentRemoteId: vi.fn(),
    };
    const useCase = createAddLedgerEntryUseCase(repository as never);

    const result = await useCase.execute({
      remoteId: "ledger-1",
      businessAccountRemoteId: "account-1",
      ownerUserRemoteId: "user-1",
      partyName: "Hari",
      partyPhone: null,
      contactRemoteId: null,
      entryType: LedgerEntryType.Advance,
      balanceDirection: LedgerBalanceDirection.Receive,
      title: "Advance entry",
      amount: 500,
      currencyCode: "NPR",
      note: null,
      happenedAt: 1_710_000_000_000,
      dueAt: null,
      paymentMode: null,
      referenceNumber: null,
      reminderAt: null,
      attachmentUri: null,
      settledAgainstEntryRemoteId: null,
      linkedDocumentRemoteId: null,
      linkedTransactionRemoteId: null,
      settlementAccountRemoteId: null,
      settlementAccountDisplayNameSnapshot: null,
    });

    expect(result.success).toBe(true);
    expect(repository.saveLedgerEntry).toHaveBeenCalledTimes(1);
  });

  it("creates order drafts without any remote sync datasource", async () => {
    const repository = {
      saveOrder: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "order-1",
          ownerUserRemoteId: "user-1",
          accountRemoteId: "account-1",
          orderNumber: "ORD-001",
          orderDate: 1_710_000_000_000,
          customerRemoteId: null,
          deliveryOrPickupDetails: null,
          notes: null,
          tags: null,
          internalRemarks: null,
          status: OrderStatus.Draft,
          taxRatePercent: null,
          subtotalAmount: 100,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: 100,
          linkedBillingDocumentRemoteId: null,
          linkedLedgerDueEntryRemoteId: null,
          items: [],
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };
    const getProductsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "product-1",
            accountRemoteId: "account-1",
            name: "Rice Bag",
            kind: ProductKind.Item,
            categoryName: "Groceries",
            salePrice: 100,
            costPrice: 80,
            stockQuantity: 10,
            unitLabel: "bag",
            skuOrBarcode: null,
            taxRateLabel: null,
            description: null,
            imageUrl: null,
            status: ProductStatus.Active,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      })),
    };
    const rollbackOrderDraftCreateUseCase = {
      execute: vi.fn(async () => ({ success: true as const, value: true })),
    };
    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(),
    };
    const useCase = createCreateOrderUseCase({
      repository: repository as never,
      getProductsUseCase: getProductsUseCase as never,
      rollbackOrderDraftCreateUseCase: rollbackOrderDraftCreateUseCase as never,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as never,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "account-1",
      orderNumber: "ORD-001",
      orderDate: 1_710_000_000_000,
      customerRemoteId: null,
      deliveryOrPickupDetails: null,
      notes: null,
      tags: null,
      internalRemarks: null,
      status: OrderStatus.Draft,
      taxRatePercent: null,
      items: [
        {
          remoteId: "line-1",
          orderRemoteId: "order-1",
          productRemoteId: "product-1",
          quantity: 1,
          lineOrder: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(repository.saveOrder).toHaveBeenCalledTimes(1);
  });

  it("creates local POS drafts without any remote sync datasource", async () => {
    const repository = {
      createPosSaleRecord: vi.fn(async (payload: any) => ({
        success: true as const,
        value: {
          ...payload,
          workflowStatus: PosSaleWorkflowStatus.PendingValidation,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };
    const useCase = createCreatePosSaleDraftUseCase(repository as never);

    const result = await useCase.execute({
      remoteId: "pos-1",
      receiptNumber: "RCPT-001",
      businessAccountRemoteId: "account-1",
      ownerUserRemoteId: "user-1",
      idempotencyKey: "pos-1",
      customerRemoteId: null,
      customerNameSnapshot: null,
      customerPhoneSnapshot: null,
      currencyCode: "NPR",
      countryCode: null,
      cartLinesSnapshot: [],
      totalsSnapshot: {
        itemCount: 0,
        gross: 0,
        discountAmount: 0,
        surchargeAmount: 0,
        taxAmount: 0,
        grandTotal: 0,
      },
      paymentParts: [],
      receipt: null,
    });

    expect(result.success).toBe(true);
    expect(repository.createPosSaleRecord).toHaveBeenCalledTimes(1);
  });
});
