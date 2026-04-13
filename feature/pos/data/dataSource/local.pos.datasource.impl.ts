import { InventoryMovementModel } from "@/feature/inventory/data/dataSource/db/inventoryMovement.model";
import {
    InventoryMovementType,
} from "@/feature/inventory/types/inventory.types";
import { ProductModel } from "@/feature/products/data/dataSource/db/product.model";
import { RecordSyncStatus } from "@/feature/session/types/authSession.types";
import { Database, Q } from "@nozbe/watermelondb";
import {
    PosApplyAmountAdjustmentParams,
    PosAssignProductToSlotParams,
    PosChangeQuantityParams,
    PosCompletePaymentParams,
    PosLoadBootstrapParams,
    PosRemoveSlotProductParams,
} from "../../types/pos.dto.types";
import {
    PosBootstrap,
    PosCartLine,
    PosLedgerEffect,
    PosProduct,
    PosReceipt,
    PosSlot,
    PosTotals,
} from "../../types/pos.entity.types";
import {
    PosBootstrapResult,
    PosCartLinesResult,
    PosError,
    PosErrorType,
    PosOperationResult,
    PosPaymentResult,
    PosTotalsResult,
} from "../../types/pos.error.types";
import { PosDatasource } from "./pos.datasource";

const PRODUCTS_TABLE = "products";
const INVENTORY_MOVEMENTS_TABLE = "inventory_movements";
const SLOT_COUNT = 16;

const createInitialSlots = (): PosSlot[] => {
  return Array.from({ length: SLOT_COUNT }, (_, index) => ({
    slotId: `slot-${index + 1}`,
    assignedProductId: null,
  }));
};

const cloneSlots = (slots: readonly PosSlot[]): PosSlot[] =>
  slots.map((slot) => ({ ...slot }));

const cloneCartLines = (cartLines: readonly PosCartLine[]): PosCartLine[] =>
  cartLines.map((line) => ({ ...line }));

const createValidationError = (message: string): PosError => ({
  type: PosErrorType.Validation,
  message,
});

const createUnknownError = (message: string): PosError => ({
  type: PosErrorType.Unknown,
  message,
});

const formatReceiptNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  return `RCPT-${timestamp}`;
};

const parseTaxRate = (taxRateLabel: string | null): number => {
  if (!taxRateLabel) {
    return 0;
  }

  const normalized = taxRateLabel.trim();
  if (!normalized) {
    return 0;
  }

  const numeric = Number(normalized.replace("%", ""));
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return Number((numeric / 100).toFixed(4));
};

const buildShortCode = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    return "P";
  }

  const words = trimmed
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "P";
  }

  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const mapProductModelToPosProduct = (product: ProductModel): PosProduct => ({
  id: product.remoteId,
  name: product.name,
  categoryLabel: product.categoryName ?? "General",
  unitLabel: product.unitLabel ?? null,
  price: product.salePrice,
  taxRate: parseTaxRate(product.taxRateLabel),
  shortCode: buildShortCode(product.name),
});

const calculateTotals = (
  cartLines: readonly PosCartLine[],
  discountAmount: number,
  surchargeAmount: number,
): PosTotals => {
  const gross = cartLines.reduce((sum, line) => sum + line.lineSubtotal, 0);
  const adjustedBase = Math.max(gross - discountAmount + surchargeAmount, 0);
  const effectiveTaxRate =
    cartLines.length === 0
      ? 0
      : cartLines.reduce(
          (sum, line) => sum + line.taxRate * line.lineSubtotal,
          0,
        ) / Math.max(gross, 1);
  const taxAmount = Number((adjustedBase * effectiveTaxRate).toFixed(2));
  const grandTotal = Number((adjustedBase + taxAmount).toFixed(2));

  return {
    itemCount: cartLines.reduce((sum, line) => sum + line.quantity, 0),
    gross: Number(gross.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    surchargeAmount: Number(surchargeAmount.toFixed(2)),
    taxAmount,
    grandTotal,
  };
};

const buildCartLine = (slotId: string, product: PosProduct): PosCartLine => ({
  lineId: `line-${slotId}`,
  slotId,
  productId: product.id,
  productName: product.name,
  categoryLabel: product.categoryLabel,
  shortCode: product.shortCode,
  quantity: 1,
  unitPrice: product.price,
  taxRate: product.taxRate,
  lineSubtotal: Number(product.price.toFixed(2)),
});

const setCreatedAndUpdatedAt = (
  record: InventoryMovementModel,
  now: number,
): void => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: ProductModel, now: number): void => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: ProductModel): void => {
  if (
    !record.recordSyncStatus ||
    record.recordSyncStatus === RecordSyncStatus.Synced
  ) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
  }
};

type CreateLocalPosDatasourceParams = {
  database: Database;
};

export const createLocalPosDatasource = ({
  database,
}: CreateLocalPosDatasourceParams): PosDatasource => {
  let activeBusinessAccountRemoteId: string | null = null;
  let activeSettlementAccountRemoteId: string | null = null;
  let activeOwnerUserRemoteId: string | null = null;
  let products: readonly PosProduct[] = [];
  let slots: PosSlot[] = createInitialSlots();
  let cartLines: PosCartLine[] = [];
  let discountAmount = 0;
  let surchargeAmount = 0;

  const getTotalsValue = (): PosTotals =>
    calculateTotals(cartLines, discountAmount, surchargeAmount);

  const resetSessionState = (): void => {
    slots = createInitialSlots();
    cartLines = [];
    discountAmount = 0;
    surchargeAmount = 0;
  };

  const loadActiveProducts = async (): Promise<readonly PosProduct[]> => {
    if (!activeBusinessAccountRemoteId) {
      products = [];
      return [];
    }

    const collection = database.get<ProductModel>(PRODUCTS_TABLE);
    const productModels = await collection
      .query(
        Q.where("account_remote_id", activeBusinessAccountRemoteId),
        Q.where("status", "active"),
        Q.where("deleted_at", Q.eq(null)),
        Q.sortBy("updated_at", Q.desc),
      )
      .fetch();

    products = productModels.map(mapProductModelToPosProduct);
    return products;
  };

  const getActiveProductById = async (
    productId: string,
  ): Promise<PosProduct | null> => {
    if (!activeBusinessAccountRemoteId) {
      return null;
    }

    const collection = database.get<ProductModel>(PRODUCTS_TABLE);
    const matchingProducts = await collection
      .query(
        Q.where("remote_id", productId),
        Q.where("account_remote_id", activeBusinessAccountRemoteId),
        Q.where("status", "active"),
        Q.where("deleted_at", Q.eq(null)),
      )
      .fetch();
    const product = matchingProducts[0];
    if (!product) {
      return null;
    }

    return mapProductModelToPosProduct(product);
  };

  const findSlotIndex = (slotId: string): number =>
    slots.findIndex((slot) => slot.slotId === slotId);

  return {
    async loadBootstrap(
      params: PosLoadBootstrapParams,
    ): Promise<PosBootstrapResult> {
      if (
        !params.activeBusinessAccountRemoteId ||
        !params.activeOwnerUserRemoteId ||
        !params.activeSettlementAccountRemoteId
      ) {
        let errorMessage = "POS requires an active business and settlement account before it can open.";
        
        if (!params.activeBusinessAccountRemoteId) {
          errorMessage = "Please select a business account to access POS.";
        } else if (!params.activeOwnerUserRemoteId) {
          errorMessage = "Please ensure you have a valid user session to access POS.";
        } else if (!params.activeSettlementAccountRemoteId) {
          errorMessage = "Please create at least one money account for this business to use POS. Go to Money Accounts to set up a settlement account.";
        }
        
        return {
          success: false,
          error: {
            type: PosErrorType.ContextRequired,
            message: errorMessage,
          },
        };
      }

      if (activeBusinessAccountRemoteId !== params.activeBusinessAccountRemoteId) {
        resetSessionState();
      }
      activeBusinessAccountRemoteId = params.activeBusinessAccountRemoteId;
      activeSettlementAccountRemoteId = params.activeSettlementAccountRemoteId;
      activeOwnerUserRemoteId = params.activeOwnerUserRemoteId;

      try {
        const loadedProducts = await loadActiveProducts();
        const bootstrap: PosBootstrap = {
          products: loadedProducts,
          slots: cloneSlots(slots),
          activeBusinessAccountRemoteId: params.activeBusinessAccountRemoteId,
          activeOwnerUserRemoteId: params.activeOwnerUserRemoteId,
          activeSettlementAccountRemoteId: params.activeSettlementAccountRemoteId,
        };
        return { success: true, value: bootstrap };
      } catch (error) {
        return {
          success: false,
          error: createUnknownError(
            error instanceof Error
              ? error.message
              : "Failed to load POS products.",
          ),
        };
      }
    },

    async searchProducts(searchTerm: string): Promise<readonly PosProduct[]> {
      const availableProducts = await loadActiveProducts();
      const normalizedSearchTerm = searchTerm.trim().toLowerCase();
      if (!normalizedSearchTerm) {
        return [...availableProducts];
      }

      return availableProducts.filter((product) => {
        return (
          product.name.toLowerCase().includes(normalizedSearchTerm) ||
          product.categoryLabel.toLowerCase().includes(normalizedSearchTerm)
        );
      });
    },

    async assignProductToSlot(
      params: PosAssignProductToSlotParams,
    ): Promise<PosCartLinesResult> {
      const slotIndex = findSlotIndex(params.slotId);
      if (slotIndex === -1) {
        return {
          success: false,
          error: {
            type: PosErrorType.SlotNotFound,
            message: "The selected slot was not found.",
          },
        };
      }

      const product = await getActiveProductById(params.productId);
      if (!product) {
        return {
          success: false,
          error: {
            type: PosErrorType.ProductNotFound,
            message: "The selected product was not found.",
          },
        };
      }

      slots = slots.map((slot, index) =>
        index === slotIndex
          ? { ...slot, assignedProductId: product.id }
          : slot,
      );

      if (!params.addToCart) {
        cartLines = cartLines.filter((line) => line.slotId !== params.slotId);
        return {
          success: true,
          value: cloneCartLines(cartLines),
        };
      }

      const existingLineIndex = cartLines.findIndex(
        (line) => line.slotId === params.slotId,
      );

      if (existingLineIndex === -1) {
        cartLines = [...cartLines, buildCartLine(params.slotId, product)];
      } else {
        cartLines = cartLines.map((line, index) => {
          if (index !== existingLineIndex) {
            return line;
          }

          if (line.productId !== product.id) {
            return buildCartLine(params.slotId, product);
          }

          const nextQuantity = line.quantity + 1;
          return {
            ...line,
            quantity: nextQuantity,
            lineSubtotal: Number((nextQuantity * line.unitPrice).toFixed(2)),
          };
        });
      }

      return {
        success: true,
        value: cloneCartLines(cartLines),
      };
    },

    async removeProductFromSlot(
      params: PosRemoveSlotProductParams,
    ): Promise<PosCartLinesResult> {
      const slotIndex = findSlotIndex(params.slotId);
      if (slotIndex === -1) {
        return {
          success: false,
          error: {
            type: PosErrorType.SlotNotFound,
            message: "The selected slot was not found.",
          },
        };
      }

      slots = slots.map((slot, index) =>
        index === slotIndex ? { ...slot, assignedProductId: null } : slot,
      );
      cartLines = cartLines.filter((line) => line.slotId !== params.slotId);

      return {
        success: true,
        value: cloneCartLines(cartLines),
      };
    },

    async changeCartLineQuantity(
      params: PosChangeQuantityParams,
    ): Promise<PosCartLinesResult> {
      const lineIndex = cartLines.findIndex(
        (line) => line.lineId === params.lineId,
      );
      if (lineIndex === -1) {
        return {
          success: false,
          error: {
            type: PosErrorType.CartLineNotFound,
            message: "The requested cart item was not found.",
          },
        };
      }

      if (params.nextQuantity <= 0) {
        const targetLine = cartLines[lineIndex];
        cartLines = cartLines.filter((line) => line.lineId !== params.lineId);
        slots = slots.map((slot) =>
          slot.slotId === targetLine.slotId
            ? { ...slot, assignedProductId: null }
            : slot,
        );

        return { success: true, value: cloneCartLines(cartLines) };
      }

      cartLines = cartLines.map((line, index) => {
        if (index !== lineIndex) {
          return line;
        }

        return {
          ...line,
          quantity: params.nextQuantity,
          lineSubtotal: Number((params.nextQuantity * line.unitPrice).toFixed(2)),
        };
      });

      return {
        success: true,
        value: cloneCartLines(cartLines),
      };
    },

    async applyDiscount(
      params: PosApplyAmountAdjustmentParams,
    ): Promise<PosTotalsResult> {
      if (params.amount < 0) {
        return {
          success: false,
          error: createValidationError("Discount cannot be negative."),
        };
      }

      discountAmount = params.amount;
      return { success: true, value: getTotalsValue() };
    },

    async applySurcharge(
      params: PosApplyAmountAdjustmentParams,
    ): Promise<PosTotalsResult> {
      if (params.amount < 0) {
        return {
          success: false,
          error: createValidationError("Surcharge cannot be negative."),
        };
      }

      surchargeAmount = params.amount;
      return { success: true, value: getTotalsValue() };
    },

    async clearCart(): Promise<PosOperationResult> {
      resetSessionState();
      return { success: true, value: true };
    },

    async getSlots(): Promise<readonly PosSlot[]> {
      return cloneSlots(slots);
    },

    async getCartLines(): Promise<readonly PosCartLine[]> {
      return cloneCartLines(cartLines);
    },

    async getTotals(): Promise<PosTotalsResult> {
      return { success: true, value: getTotalsValue() };
    },

    async completePayment(
      params: PosCompletePaymentParams,
    ): Promise<PosPaymentResult> {
      if (
        !activeBusinessAccountRemoteId ||
        !activeSettlementAccountRemoteId ||
        !activeOwnerUserRemoteId
      ) {
        return {
          success: false,
          error: {
            type: PosErrorType.ContextRequired,
            message:
              "POS requires an active settlement account before taking payment.",
          },
        };
      }

      const businessAccountRemoteId = activeBusinessAccountRemoteId;
      const settlementAccountRemoteId = activeSettlementAccountRemoteId;

      if (cartLines.length === 0) {
        return {
          success: false,
          error: {
            type: PosErrorType.EmptyCart,
            message: "Add at least one product before taking payment.",
          },
        };
      }

      if (params.paidAmount < 0) {
        return {
          success: false,
          error: createValidationError("Paid amount cannot be negative."),
        };
      }

      const totals = getTotalsValue();
      const dueAmount = Number(
        Math.max(totals.grandTotal - params.paidAmount, 0).toFixed(2),
      );
      const ledgerEffect: PosLedgerEffect =
        dueAmount > 0
          ? {
              type: "due_balance_pending",
              dueAmount,
              accountRemoteId: settlementAccountRemoteId,
            }
          : {
              type: "none",
              dueAmount: 0,
              accountRemoteId: settlementAccountRemoteId,
            };

      const receipt: PosReceipt = {
        receiptNumber: formatReceiptNumber(),
        issuedAt: new Date().toISOString(),
        lines: cloneCartLines(cartLines),
        totals,
        paidAmount: Number(params.paidAmount.toFixed(2)),
        dueAmount,
        ledgerEffect,
      };

      try {
        const productCollection = database.get<ProductModel>(PRODUCTS_TABLE);
        const movementCollection = database.get<InventoryMovementModel>(
          INVENTORY_MOVEMENTS_TABLE,
        );
        const soldQuantityByProductId = new Map<string, number>();
        for (const cartLine of cartLines) {
          soldQuantityByProductId.set(
            cartLine.productId,
            (soldQuantityByProductId.get(cartLine.productId) ?? 0) +
              cartLine.quantity,
          );
        }
        const soldProductIds = Array.from(soldQuantityByProductId.keys());

        await database.write(async () => {
          const matchingProducts = await productCollection
            .query(
              Q.where("remote_id", Q.oneOf(soldProductIds)),
              Q.where("account_remote_id", businessAccountRemoteId),
              Q.where("status", "active"),
              Q.where("deleted_at", Q.eq(null)),
            )
            .fetch();
          const productByRemoteId = new Map(
            matchingProducts.map((product) => [product.remoteId, product]),
          );
          const nextStockByProductId = new Map<string, number>();

          for (const [productId, soldQuantity] of soldQuantityByProductId) {
            const product = productByRemoteId.get(productId);
            if (!product) {
              throw new Error(
                "One or more cart products are no longer available.",
              );
            }
            if (product.kind !== "item") {
              continue;
            }

            const currentStock = product.stockQuantity ?? 0;
            if (currentStock < soldQuantity) {
              throw new Error(
                `Not enough stock for ${product.name}. Available: ${currentStock}.`,
              );
            }
            nextStockByProductId.set(productId, currentStock - soldQuantity);
          }

          for (const [productId, nextStock] of nextStockByProductId) {
            const product = productByRemoteId.get(productId);
            if (!product) {
              continue;
            }
            const now = Date.now();
            await product.update((record) => {
              record.stockQuantity = nextStock;
              updateSyncStatusOnMutation(record);
              setUpdatedAt(record, now);
            });
          }

          for (let index = 0; index < cartLines.length; index += 1) {
            const cartLine = cartLines[index];
            const product = productByRemoteId.get(cartLine.productId);
            if (!product || product.kind !== "item") {
              continue;
            }
            const now = Date.now();
            await movementCollection.create((record) => {
              record.remoteId = `${receipt.receiptNumber}-${index + 1}-${now}`;
              record.accountRemoteId = businessAccountRemoteId;
              record.productRemoteId = product.remoteId;
              record.productNameSnapshot = product.name;
              record.productUnitLabelSnapshot = product.unitLabel;
              record.movementType = InventoryMovementType.SaleOut;
              record.quantity = cartLine.quantity;
              record.deltaQuantity = cartLine.quantity * -1;
              record.unitRate = cartLine.unitPrice;
              record.reason = null;
              record.remark = `POS sale ${receipt.receiptNumber}`;
              record.movementAt = now;
              record.recordSyncStatus = RecordSyncStatus.PendingCreate;
              record.lastSyncedAt = null;
              record.deletedAt = null;
              setCreatedAndUpdatedAt(record, now);
            });
          }
        });
      } catch (error) {
        return {
          success: false,
          error: createValidationError(
            error instanceof Error
              ? error.message
              : "Failed to complete POS payment.",
          ),
        };
      }

      await loadActiveProducts();
      resetSessionState();
      return { success: true, value: receipt };
    },

    async printReceipt(_: PosReceipt): Promise<PosOperationResult> {
      return {
        success: false,
        error: {
          type: PosErrorType.UnsupportedOperation,
          message:
            "Receipt printing is not available in this build yet. Use the on-screen receipt for now.",
        },
      };
    },
  };
};
