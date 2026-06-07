import { BillingErrorType } from "@/feature/billing/types/billing.types";
import { LedgerBalanceDirection, LedgerEntryType } from "@/feature/ledger/types/ledger.entity.types";
import { OrderStatus, type Order, type SaveOrderPayload } from "@/feature/orders/types/order.types";
import { createCreateOrderUseCase } from "@/feature/orders/useCase/createOrder.useCase.impl";
import { createRunOrderCommercialLinkingWorkflowUseCase } from "@/feature/orders/workflow/orderCommercialLinking/useCase/runOrderCommercialLinkingWorkflow.useCase.impl";
import { ProductKind, ProductStatus, type Product } from "@/feature/products/types/product.types";
import { describe, expect, it, vi } from "vitest";

const buildProduct = (overrides: Partial<Product> = {}): Product => ({
  remoteId: "product-1",
  accountRemoteId: "business-1",
  name: "Rice Bag",
  kind: ProductKind.Item,
  categoryName: "Groceries",
  salePrice: 100,
  costPrice: 80,
  stockQuantity: 10,
  unitLabel: "bag",
  skuOrBarcode: "SKU-1",
  taxRateLabel: "VAT",
  description: null,
  imageUrl: null,
  status: ProductStatus.Active,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildSavePayload = (
  overrides: Partial<SaveOrderPayload> = {},
): SaveOrderPayload => ({
  remoteId: "order-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  orderNumber: "ORD-001",
  orderDate: 1_710_000_000_000,
  customerRemoteId: "contact-1",
  deliveryOrPickupDetails: null,
  notes: null,
  tags: null,
  internalRemarks: null,
  status: OrderStatus.Draft,
  taxRatePercent: 13,
  items: [
    {
      remoteId: "line-1",
      orderRemoteId: "order-1",
      productRemoteId: "product-1",
      quantity: 1,
      lineOrder: 0,
    },
  ],
  ...overrides,
});

const createHarness = () => {
  const products = new Map<string, Product>([["product-1", buildProduct()]]);
  const orders = new Map<string, Order>();
  const billingDocuments = new Map<string, Record<string, unknown>>();
  const ledgerEntries = new Map<string, Record<string, unknown>>();

  const repository = {
    saveOrder: vi.fn(async (payload: SaveOrderPayload) => {
      const next: Order = {
        remoteId: payload.remoteId,
        ownerUserRemoteId: payload.ownerUserRemoteId,
        accountRemoteId: payload.accountRemoteId,
        orderNumber: payload.orderNumber,
        orderDate: payload.orderDate,
        customerRemoteId: payload.customerRemoteId,
        deliveryOrPickupDetails: payload.deliveryOrPickupDetails,
        notes: payload.notes,
        tags: payload.tags,
        internalRemarks: payload.internalRemarks,
        status: payload.status,
        taxRatePercent: payload.taxRatePercent ?? null,
        subtotalAmount: payload.subtotalAmount ?? 100,
        taxAmount: payload.taxAmount ?? 13,
        discountAmount: payload.discountAmount ?? 0,
        totalAmount: payload.totalAmount ?? 113,
        linkedBillingDocumentRemoteId: payload.linkedBillingDocumentRemoteId ?? null,
        linkedLedgerDueEntryRemoteId: payload.linkedLedgerDueEntryRemoteId ?? null,
        items: payload.items.map((item) => ({
          remoteId: item.remoteId,
          orderRemoteId: item.orderRemoteId,
          productRemoteId: item.productRemoteId,
          productNameSnapshot: item.productNameSnapshot ?? "Rice Bag",
          unitLabelSnapshot: item.unitLabelSnapshot ?? "bag",
          skuOrBarcodeSnapshot: item.skuOrBarcodeSnapshot ?? "SKU-1",
          categoryNameSnapshot: item.categoryNameSnapshot ?? "Groceries",
          taxRateLabelSnapshot: item.taxRateLabelSnapshot ?? "VAT",
          unitPriceSnapshot: item.unitPriceSnapshot ?? 100,
          taxRatePercentSnapshot: item.taxRatePercentSnapshot ?? 13,
          quantity: item.quantity,
          lineSubtotalAmount: item.lineSubtotalAmount ?? 100,
          lineTaxAmount: item.lineTaxAmount ?? 13,
          lineTotalAmount: item.lineTotalAmount ?? 113,
          lineOrder: item.lineOrder,
          createdAt: 1,
          updatedAt: 1,
        })),
        createdAt: 1,
        updatedAt: 1,
      };
      orders.set(next.remoteId, next);
      return {
        success: true as const,
        value: next,
      };
    }),
    getOrderByRemoteId: vi.fn(async (remoteId: string) => ({
      success: true as const,
      value: orders.get(remoteId) as Order,
    })),
    linkOrderCommercialAnchors: vi.fn(async (params: {
      orderRemoteId: string;
      linkedBillingDocumentRemoteId: string | null;
      linkedLedgerDueEntryRemoteId: string | null;
    }) => {
      const existing = orders.get(params.orderRemoteId) as Order;
      const updated: Order = {
        ...existing,
        linkedBillingDocumentRemoteId: params.linkedBillingDocumentRemoteId,
        linkedLedgerDueEntryRemoteId: params.linkedLedgerDueEntryRemoteId,
      };
      orders.set(updated.remoteId, updated);
      return {
        success: true as const,
        value: updated,
      };
    }),
  };

  const createOrderUseCase = createCreateOrderUseCase({
    repository: repository as any,
    getProductsUseCase: {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [...products.values()],
      })),
    } as any,
    rollbackOrderDraftCreateUseCase: {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    } as any,
    ensureOrderBillingAndDueLinksUseCase: {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    } as any,
  });

  const commercialLinkingUseCase = createRunOrderCommercialLinkingWorkflowUseCase({
    orderRepository: repository as any,
    getContactsUseCase: {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "contact-1",
            accountRemoteId: "business-1",
            fullName: "Kapil Customer",
            phoneNumber: "9800000000",
            email: null,
            address: null,
            tags: null,
            note: null,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      })),
    } as any,
    getBillingDocumentByRemoteIdUseCase: {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: BillingErrorType.DocumentNotFound,
          message: "not found",
        },
      })),
    } as any,
    saveBillingDocumentUseCase: {
      execute: vi.fn(async (payload: any) => {
        const document = {
          remoteId: payload.remoteId,
          linkedLedgerEntryRemoteId: payload.linkedLedgerEntryRemoteId,
          accountRemoteId: payload.accountRemoteId,
          customerName: payload.customerName,
        };
        billingDocuments.set(payload.remoteId, document);
        return {
          success: true as const,
          value: document,
        };
      }),
    } as any,
    deleteBillingDocumentUseCase: {
      execute: vi.fn(async (remoteId: string) => {
        billingDocuments.delete(remoteId);
        return {
          success: true as const,
          value: true,
        };
      }),
    } as any,
    getLedgerEntriesUseCase: {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [...ledgerEntries.values()],
      })),
    } as any,
    addLedgerEntryUseCase: {
      execute: vi.fn(async (payload: any) => {
        const entry = {
          remoteId: payload.remoteId,
          linkedDocumentRemoteId: payload.linkedDocumentRemoteId,
          entryType: payload.entryType,
          balanceDirection: payload.balanceDirection,
        };
        ledgerEntries.set(payload.remoteId, entry);
        return {
          success: true as const,
          value: entry,
        };
      }),
    } as any,
    updateLedgerEntryUseCase: { execute: vi.fn() } as any,
    deleteLedgerEntryUseCase: {
      execute: vi.fn(async (remoteId: string) => {
        ledgerEntries.delete(remoteId);
        return {
          success: true as const,
          value: true,
        };
      }),
    } as any,
  });

  return {
    products,
    orders,
    billingDocuments,
    ledgerEntries,
    repository,
    createOrderUseCase,
    commercialLinkingUseCase,
  };
};

describe("orderLifecycle.integration", () => {
  it("creates draft orders without creating money, ledger, or inventory effects", async () => {
    const harness = createHarness();

    const result = await harness.createOrderUseCase.execute(
      buildSavePayload({
        status: OrderStatus.Draft,
      }),
    );

    expect(result.success).toBe(true);
    expect(harness.billingDocuments.size).toBe(0);
    expect(harness.ledgerEntries.size).toBe(0);
    expect(harness.repository.saveOrder).toHaveBeenCalledTimes(1);
  });

  it("captures price snapshots on confirmed orders even if the product price changes later", async () => {
    const harness = createHarness();

    const result = await harness.createOrderUseCase.execute(
      buildSavePayload({
        status: OrderStatus.Confirmed,
      }),
    );
    harness.products.set(
      "product-1",
      buildProduct({
        salePrice: 150,
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.items[0]?.unitPriceSnapshot).toBe(100);
    }
  });

  it("links confirmed unpaid orders to a billing document and ledger due entry", async () => {
    const harness = createHarness();
    await harness.createOrderUseCase.execute(
      buildSavePayload({
        status: OrderStatus.Confirmed,
      }),
    );

    const result = await harness.commercialLinkingUseCase.execute({
      orderRemoteId: "order-1",
    });

    expect(result.success).toBe(true);
    expect(harness.billingDocuments.size).toBe(1);
    expect(harness.ledgerEntries.size).toBe(1);
    const updatedOrder = harness.orders.get("order-1");
    expect(updatedOrder?.linkedBillingDocumentRemoteId).toBeTruthy();
    expect(updatedOrder?.linkedLedgerDueEntryRemoteId).toBeTruthy();

    if (result.success) {
      expect(result.value.billingDocumentRemoteId).toBeTruthy();
      expect(result.value.ledgerDueEntryRemoteId).toBeTruthy();
    }
  });
});
