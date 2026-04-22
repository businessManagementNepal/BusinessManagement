import { BillingErrorType } from "@/feature/billing/types/billing.types";
import { LedgerBalanceDirection, LedgerEntryType } from "@/feature/ledger/types/ledger.entity.types";
import { OrderStatus } from "@/feature/orders/types/order.types";
import { createRunOrderCommercialLinkingWorkflowUseCase } from "@/feature/orders/workflow/orderCommercialLinking/useCase/runOrderCommercialLinkingWorkflow.useCase.impl";
import { describe, expect, it, vi } from "vitest";

const buildOrder = (
  status: (typeof OrderStatus)[keyof typeof OrderStatus],
  overrides: Record<string, unknown> = {},
) => ({
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
  status,
  taxRatePercent: 13,
  subtotalAmount: 100,
  taxAmount: 13,
  discountAmount: 0,
  totalAmount: 113,
  linkedBillingDocumentRemoteId: null,
  linkedLedgerDueEntryRemoteId: null,
  items: [
    {
      remoteId: "line-1",
      orderRemoteId: "order-1",
      productRemoteId: "product-1",
      productNameSnapshot: "Rice Bag",
      unitLabelSnapshot: "bag",
      skuOrBarcodeSnapshot: "SKU-1",
      categoryNameSnapshot: "Groceries",
      taxRateLabelSnapshot: "VAT",
      unitPriceSnapshot: 100,
      taxRatePercentSnapshot: 13,
      quantity: 1,
      lineSubtotalAmount: 100,
      lineTaxAmount: 13,
      lineTotalAmount: 113,
      lineOrder: 0,
      createdAt: 1_710_000_000_000,
      updatedAt: 1_710_000_000_000,
    },
  ],
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildContact = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "contact-1",
  accountRemoteId: "business-1",
  fullName: "Kapil Customer",
  phoneNumber: "9800000000",
  email: null,
  address: null,
  tags: null,
  note: null,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildBillingDocument = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "bill-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  documentNumber: "INV-001",
  documentDate: 1_710_000_000_000,
  dueDate: null,
  documentType: "invoice",
  partyName: "Kapil Customer",
  partyPhone: "9800000000",
  contactRemoteId: "contact-1",
  linkedLedgerEntryRemoteId: "due-1",
  linkedOrderRemoteId: "order-1",
  subtotalAmount: 100,
  taxAmount: 13,
  discountAmount: 0,
  totalAmount: 113,
  outstandingAmount: 113,
  paidAmount: 0,
  status: "issued",
  currencyCode: "NPR",
  note: null,
  lineItems: [],
  items: [],
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildLedgerDueEntry = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "due-1",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  partyName: "Kapil Customer",
  partyPhone: "9800000000",
  contactRemoteId: "contact-1",
  entryType: LedgerEntryType.Sale,
  balanceDirection: LedgerBalanceDirection.Receive,
  title: "Order ORD-001",
  amount: 113,
  currencyCode: "NPR",
  note: null,
  happenedAt: 1_710_000_000_000,
  dueAt: null,
  paymentMode: null,
  referenceNumber: "ORD-001",
  reminderAt: null,
  attachmentUri: null,
  settledAgainstEntryRemoteId: null,
  linkedDocumentRemoteId: "bill-1",
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

describe("runOrderCommercialLinkingWorkflowUseCase validation", () => {
  it("rejects blank order remote id", async () => {
    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: { getOrderByRemoteId: vi.fn() } as any,
      getContactsUseCase: { execute: vi.fn() } as any,
      getBillingDocumentByRemoteIdUseCase: { execute: vi.fn() } as any,
      saveBillingDocumentUseCase: { execute: vi.fn() } as any,
      deleteBillingDocumentUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      addLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: buildLedgerDueEntry(), })) } as any,
      updateLedgerEntryUseCase: { execute: vi.fn() } as any,
      deleteLedgerEntryUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Order remote id is required");
    }
  });

  it("rejects non-financial order status", async () => {
    const orderRepository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Pending),
      })),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: orderRepository as any,
      getContactsUseCase: { execute: vi.fn() } as any,
      getBillingDocumentByRemoteIdUseCase: { execute: vi.fn() } as any,
      saveBillingDocumentUseCase: { execute: vi.fn() } as any,
      deleteBillingDocumentUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      addLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: buildLedgerDueEntry(), })) } as any,
      updateLedgerEntryUseCase: { execute: vi.fn() } as any,
      deleteLedgerEntryUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("confirmed business status");
    }
  });

  it("rejects order without selected customer contact", async () => {
    const orderRepository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Confirmed, { customerRemoteId: null }),
      })),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: orderRepository as any,
      getContactsUseCase: { execute: vi.fn() } as any,
      getBillingDocumentByRemoteIdUseCase: { execute: vi.fn() } as any,
      saveBillingDocumentUseCase: { execute: vi.fn() } as any,
      deleteBillingDocumentUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      addLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: buildLedgerDueEntry(), })) } as any,
      updateLedgerEntryUseCase: { execute: vi.fn() } as any,
      deleteLedgerEntryUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Select a customer contact");
    }
  });

  it("rejects missing persisted order total", async () => {
    const orderRepository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Confirmed, { totalAmount: 0 }),
      })),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: orderRepository as any,
      getContactsUseCase: { execute: vi.fn() } as any,
      getBillingDocumentByRemoteIdUseCase: { execute: vi.fn() } as any,
      saveBillingDocumentUseCase: { execute: vi.fn() } as any,
      deleteBillingDocumentUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      addLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: buildLedgerDueEntry(), })) } as any,
      updateLedgerEntryUseCase: { execute: vi.fn() } as any,
      deleteLedgerEntryUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Order total must be available");
    }
  });

  it("rejects when selected customer contact cannot be found", async () => {
    const orderRepository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Confirmed),
      })),
    };

    const getContactsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: orderRepository as any,
      getContactsUseCase: getContactsUseCase as any,
      getBillingDocumentByRemoteIdUseCase: { execute: vi.fn() } as any,
      saveBillingDocumentUseCase: { execute: vi.fn() } as any,
      deleteBillingDocumentUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      addLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: buildLedgerDueEntry(), })) } as any,
      updateLedgerEntryUseCase: { execute: vi.fn() } as any,
      deleteLedgerEntryUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("customer contact could not be found");
    }
  });
});

describe("runOrderCommercialLinkingWorkflowUseCase success", () => {
  it("creates billing document, ledger due entry, and links order anchors", async () => {
    const linkedOrder = buildOrder(OrderStatus.Confirmed, {
      linkedBillingDocumentRemoteId: "bill-1",
      linkedLedgerDueEntryRemoteId: "due-1",
    });

    const orderRepository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Confirmed),
      })),
      linkOrderCommercialAnchors: vi.fn(async () => ({
        success: true as const,
        value: linkedOrder,
      })),
    };

    const getContactsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [buildContact()],
      })),
    };

    const getBillingDocumentByRemoteIdUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: BillingErrorType.DocumentNotFound,
          message: "not found",
        },
      })),
    };

    const saveBillingDocumentUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: buildBillingDocument(),
      })),
    };

    const getLedgerEntriesUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
    };

    const addLedgerEntryUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: buildLedgerDueEntry(),
      })),
    };

    const updateLedgerEntryUseCase = { execute: vi.fn() };
    const deleteLedgerEntryUseCase = { execute: vi.fn() };
    const deleteBillingDocumentUseCase = { execute: vi.fn() };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: orderRepository as any,
      getContactsUseCase: getContactsUseCase as any,
      getBillingDocumentByRemoteIdUseCase:
        getBillingDocumentByRemoteIdUseCase as any,
      saveBillingDocumentUseCase: saveBillingDocumentUseCase as any,
      deleteBillingDocumentUseCase: deleteBillingDocumentUseCase as any,
      getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
      addLedgerEntryUseCase: addLedgerEntryUseCase as any,
      updateLedgerEntryUseCase: updateLedgerEntryUseCase as any,
      deleteLedgerEntryUseCase: deleteLedgerEntryUseCase as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(true);
    expect(saveBillingDocumentUseCase.execute).toHaveBeenCalledTimes(1);
    expect(addLedgerEntryUseCase.execute).toHaveBeenCalledTimes(1);
    expect(orderRepository.linkOrderCommercialAnchors).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.billingDocumentRemoteId).toBeTruthy();
      expect(result.value.ledgerDueEntryRemoteId).toBeTruthy();
      expect(result.value.contact.remoteId).toBe("contact-1");
    }
  });
});

describe("runOrderCommercialLinkingWorkflowUseCase rollback", () => {
  it("rolls back billing document if ledger entries lookup fails after billing save", async () => {
    const orderRepository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Confirmed),
      })),
      linkOrderCommercialAnchors: vi.fn(),
    };

    const saveBillingDocumentUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: buildBillingDocument(),
      })),
    };

    const deleteBillingDocumentUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const getLedgerEntriesUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "LEDGER_ERROR",
          message: "Unable to load ledger entries.",
        },
      })),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: orderRepository as any,
      getContactsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildContact()],
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
      saveBillingDocumentUseCase: saveBillingDocumentUseCase as any,
      deleteBillingDocumentUseCase: deleteBillingDocumentUseCase as any,
      getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
      addLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: buildLedgerDueEntry(), })) } as any,
      updateLedgerEntryUseCase: { execute: vi.fn() } as any,
      deleteLedgerEntryUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    expect(deleteBillingDocumentUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("rolls back billing document if ledger due save fails", async () => {
    const saveBillingDocumentUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: buildBillingDocument(),
      })),
    };

    const deleteBillingDocumentUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const addLedgerEntryUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR",
          message: "Unable to create due entry.",
        },
      })),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: {
        getOrderByRemoteId: vi.fn(async () => ({
          success: true as const,
          value: buildOrder(OrderStatus.Confirmed),
        })),
        linkOrderCommercialAnchors: vi.fn(),
      } as any,
      getContactsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildContact()],
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
      saveBillingDocumentUseCase: saveBillingDocumentUseCase as any,
      deleteBillingDocumentUseCase: deleteBillingDocumentUseCase as any,
      getLedgerEntriesUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [],
        })),
      } as any,
      addLedgerEntryUseCase: addLedgerEntryUseCase as any,
      updateLedgerEntryUseCase: { execute: vi.fn() } as any,
      deleteLedgerEntryUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    expect(deleteBillingDocumentUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("rolls back billing and ledger state if anchor linking fails", async () => {
    const previousBillingDocument = buildBillingDocument({ remoteId: "bill-restore" });
    const previousLedgerDueEntry = buildLedgerDueEntry({ remoteId: "due-restore" });

    const saveBillingDocumentUseCase = {
      execute: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildBillingDocument({ remoteId: "bill-new" }),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: previousBillingDocument,
        }),
    };

    const updateLedgerEntryUseCase = {
      execute: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildLedgerDueEntry({ remoteId: "due-new" }),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: previousLedgerDueEntry,
        }),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: {
        getOrderByRemoteId: vi.fn(async () => ({
          success: true as const,
          value: buildOrder(OrderStatus.Confirmed, {
            linkedBillingDocumentRemoteId: "bill-restore",
            linkedLedgerDueEntryRemoteId: "due-restore",
          }),
        })),
        linkOrderCommercialAnchors: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Unable to link anchors.",
          },
        })),
      } as any,
      getContactsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildContact()],
        })),
      } as any,
      getBillingDocumentByRemoteIdUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: previousBillingDocument,
        })),
      } as any,
      saveBillingDocumentUseCase: saveBillingDocumentUseCase as any,
      deleteBillingDocumentUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
      getLedgerEntriesUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [previousLedgerDueEntry],
        })),
      } as any,
      addLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: buildLedgerDueEntry(), })) } as any,
      updateLedgerEntryUseCase: updateLedgerEntryUseCase as any,
      deleteLedgerEntryUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    expect(saveBillingDocumentUseCase.execute).toHaveBeenCalledTimes(2);
    expect(updateLedgerEntryUseCase.execute).toHaveBeenCalledTimes(2);
  });
});

describe("runOrderCommercialLinkingWorkflowUseCase existing-state rollback", () => {
  it("restores previous billing document when previous billing existed", async () => {
    const previousBillingDocument = buildBillingDocument({ remoteId: "bill-restore" });

    const saveBillingDocumentUseCase = {
      execute: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildBillingDocument({ remoteId: "bill-new" }),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: previousBillingDocument,
        }),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: {
        getOrderByRemoteId: vi.fn(async () => ({
          success: true as const,
          value: buildOrder(OrderStatus.Confirmed, {
            linkedBillingDocumentRemoteId: "bill-restore",
          }),
        })),
        linkOrderCommercialAnchors: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Unable to link anchors.",
          },
        })),
      } as any,
      getContactsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildContact()],
        })),
      } as any,
      getBillingDocumentByRemoteIdUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: previousBillingDocument,
        })),
      } as any,
      saveBillingDocumentUseCase: saveBillingDocumentUseCase as any,
      deleteBillingDocumentUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
      getLedgerEntriesUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildLedgerDueEntry()],
        })),
      } as any,
      addLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: buildLedgerDueEntry(), })) } as any,
      updateLedgerEntryUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildLedgerDueEntry(),
        })),
      } as any,
      deleteLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    expect(saveBillingDocumentUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it("restores previous ledger due when previous due existed", async () => {
    const previousLedgerDueEntry = buildLedgerDueEntry({ remoteId: "due-restore" });

    const updateLedgerEntryUseCase = {
      execute: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildLedgerDueEntry({ remoteId: "due-new" }),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: previousLedgerDueEntry,
        }),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: {
        getOrderByRemoteId: vi.fn(async () => ({
          success: true as const,
          value: buildOrder(OrderStatus.Confirmed, {
            linkedLedgerDueEntryRemoteId: "due-restore",
          }),
        })),
        linkOrderCommercialAnchors: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Unable to link anchors.",
          },
        })),
      } as any,
      getContactsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildContact()],
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
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildBillingDocument(),
        })),
      } as any,
      deleteBillingDocumentUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
      getLedgerEntriesUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [previousLedgerDueEntry],
        })),
      } as any,
      addLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: buildLedgerDueEntry(), })) } as any,
      updateLedgerEntryUseCase: updateLedgerEntryUseCase as any,
      deleteLedgerEntryUseCase: { execute: vi.fn(async () => ({ success: true as const, value: true, })) } as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    expect(updateLedgerEntryUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it("deletes newly created ledger due entry when anchor linking fails and no previous due existed", async () => {
    const deleteLedgerEntryUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const saveBillingDocumentUseCase = {
      execute: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildBillingDocument({ remoteId: "bill-new" }),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: buildBillingDocument({ remoteId: "bill-restore" }),
        }),
    };

    const addLedgerEntryUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: buildLedgerDueEntry({ remoteId: "due-new" }),
      })),
    };

    const useCase = createRunOrderCommercialLinkingWorkflowUseCase({
      orderRepository: {
        getOrderByRemoteId: vi.fn(async () => ({
          success: true as const,
          value: buildOrder(OrderStatus.Confirmed),
        })),
        linkOrderCommercialAnchors: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Unable to link anchors.",
          },
        })),
      } as any,
      getContactsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildContact()],
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
      saveBillingDocumentUseCase: saveBillingDocumentUseCase as any,
      deleteBillingDocumentUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: true,
        })),
      } as any,
      getLedgerEntriesUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [],
        })),
      } as any,
      addLedgerEntryUseCase: addLedgerEntryUseCase as any,
      updateLedgerEntryUseCase: { execute: vi.fn() } as any,
      deleteLedgerEntryUseCase: deleteLedgerEntryUseCase as any,
    });

    const result = await useCase.execute({ orderRemoteId: "order-1" });

    expect(result.success).toBe(false);
    expect(addLedgerEntryUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deleteLedgerEntryUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deleteLedgerEntryUseCase.execute).toHaveBeenCalledWith("led-order-due-order-1");
  });
});
