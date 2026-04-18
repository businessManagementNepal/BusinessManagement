import { InventoryMovementModel } from "@/feature/inventory/data/dataSource/db/inventoryMovement.model";
import { InventoryMovementType } from "@/feature/inventory/types/inventory.types";
import { ProductModel } from "@/feature/products/data/dataSource/db/product.model";
import { RecordSyncStatus } from "@/feature/session/types/authSession.types";
import { Database, Q } from "@nozbe/watermelondb";
import {
    PosAddProductToCartParams,
    PosApplyAmountAdjustmentParams,
    PosChangeQuantityParams,
    PosClearSessionParams,
    PosCommitSaleInventoryMutationsParams,
    PosLoadBootstrapParams,
    PosLoadSessionParams,
    PosSaveSessionParams,
    PosSessionData,
    PosSessionResult
} from "../../types/pos.dto.types";
import {
    PosBootstrap,
    PosCartLine,
    PosProduct,
    PosTotals,
} from "../../types/pos.entity.types";
import {
    PosBootstrapResult,
    PosCartLinesResult,
    PosError,
    PosErrorType,
    PosOperationResult,
    PosTotalsResult,
} from "../../types/pos.error.types";
import { PosDatasource } from "./pos.datasource";

const PRODUCTS_TABLE = "products";
const INVENTORY_MOVEMENTS_TABLE = "inventory_movements";

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

const buildCartLine = (product: PosProduct): PosCartLine => ({
  lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
  let products: readonly PosProduct[] = [];
  let cartLines: PosCartLine[] = [];
  let discountAmount = 0;
  let surchargeAmount = 0;

  const getTotalsValue = (): PosTotals =>
    calculateTotals(cartLines, discountAmount, surchargeAmount);

  const resetSessionState = (): void => {
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

  const getActiveProductModelById = async (
    productId: string,
  ): Promise<ProductModel | null> => {
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

    return matchingProducts[0] ?? null;
  };

  const getActiveProductById = async (
    productId: string,
  ): Promise<PosProduct | null> => {
    const product = await getActiveProductModelById(productId);
    if (!product) {
      return null;
    }

    return mapProductModelToPosProduct(product);
  };

  
  return {
    async loadBootstrap(
      params: PosLoadBootstrapParams,
    ): Promise<PosBootstrapResult> {
      if (
        !params.activeBusinessAccountRemoteId ||
        !params.activeOwnerUserRemoteId ||
        !params.activeSettlementAccountRemoteId
      ) {
        let errorMessage =
          "POS requires an active business and settlement account before it can open.";

        if (!params.activeBusinessAccountRemoteId) {
          errorMessage = "Please select a business account to access POS.";
        } else if (!params.activeOwnerUserRemoteId) {
          errorMessage =
            "Please ensure you have a valid user session to access POS.";
        } else if (!params.activeSettlementAccountRemoteId) {
          errorMessage =
            "Please create at least one money account for this business to use POS. Go to Money Accounts to set up a settlement account.";
        }

        return {
          success: false,
          error: {
            type: PosErrorType.ContextRequired,
            message: errorMessage,
          },
        };
      }

      if (
        activeBusinessAccountRemoteId !== params.activeBusinessAccountRemoteId
      ) {
        resetSessionState();
      }
      activeBusinessAccountRemoteId = params.activeBusinessAccountRemoteId;

      try {
        const loadedProducts = await loadActiveProducts();
        const bootstrap: PosBootstrap = {
          products: loadedProducts,
          activeBusinessAccountRemoteId: params.activeBusinessAccountRemoteId,
          activeOwnerUserRemoteId: params.activeOwnerUserRemoteId,
          activeSettlementAccountRemoteId:
            params.activeSettlementAccountRemoteId,
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

    async addProductToCart(
      params: PosAddProductToCartParams,
    ): Promise<PosCartLinesResult> {
      if (!activeBusinessAccountRemoteId) {
        return {
          success: false,
          error: {
            type: PosErrorType.ContextRequired,
            message: "Business account context is required to add products.",
          },
        };
      }

      const productModel = await getActiveProductModelById(params.productId);

      if (!productModel) {
        return {
          success: false,
          error: {
            type: PosErrorType.ProductNotFound,
            message: "The selected product was not found.",
          },
        };
      }

      const isInventoryTracked = productModel.kind === "item";

      if (isInventoryTracked) {
        const currentStock = productModel.stockQuantity ?? 0;

        const existingLineIndex = cartLines.findIndex(
          (line) => line.productId === params.productId,
        );

        const quantityAlreadyInCart =
          existingLineIndex !== -1
            ? cartLines[existingLineIndex].quantity
            : 0;

        const nextQuantity = quantityAlreadyInCart + 1;

        if (nextQuantity > currentStock) {
          const available = currentStock - quantityAlreadyInCart;
          if (available <= 0) {
            return {
              success: false,
              error: {
                type: PosErrorType.OutOfStock,
                message:
                  currentStock <= 0
                    ? `${productModel.name} is out of stock.` 
                    : `Only ${currentStock} unit(s) of ${productModel.name} available. You already have ${quantityAlreadyInCart} in your cart.`,
              },
            };
          }
        }
      }

      const product = mapProductModelToPosProduct(productModel);

      const existingLineIndex = cartLines.findIndex(
        (line) => line.productId === params.productId,
      );

      if (existingLineIndex !== -1) {
        const existingLine = cartLines[existingLineIndex];
        const nextQuantity = existingLine.quantity + 1;

        cartLines = cartLines.map((line, index) =>
          index === existingLineIndex
            ? {
                ...line,
                quantity: nextQuantity,
                lineSubtotal: Number(
                  (nextQuantity * line.unitPrice).toFixed(2),
                ),
              }
            : line,
        );

        return {
          success: true,
          value: cloneCartLines(cartLines),
        };
      }

      const newLine = buildCartLine(product);
      cartLines = [...cartLines, newLine];

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
        cartLines = cartLines.filter((line) => line.lineId !== params.lineId);
        return { success: true, value: cloneCartLines(cartLines) };
      }

      const targetLine = cartLines[lineIndex];
      const productModel = await getActiveProductModelById(targetLine.productId);

      if (!productModel) {
        return {
          success: false,
          error: {
            type: PosErrorType.ProductNotFound,
            message: "The selected product was not found.",
          },
        };
      }

      if (productModel.kind === "item") {
        const currentStock = productModel.stockQuantity ?? 0;
        if (params.nextQuantity > currentStock) {
          return {
            success: false,
            error: {
              type: PosErrorType.OutOfStock,
              message:
                currentStock <= 0
                  ? `${productModel.name} is out of stock.`
                  : `Only ${currentStock} unit(s) of ${productModel.name} available.`,
            },
          };
        }
      }

      cartLines = cartLines.map((line, index) => {
        if (index !== lineIndex) {
          return line;
        }

        return {
          ...line,
          quantity: params.nextQuantity,
          lineSubtotal: Number(
            (params.nextQuantity * line.unitPrice).toFixed(2),
          ),
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

    async getCartLines(): Promise<readonly PosCartLine[]> {
      return cloneCartLines(cartLines);
    },

    async getTotals(): Promise<PosTotalsResult> {
      return { success: true, value: getTotalsValue() };
    },

    async commitSaleInventoryMutations(
      params: PosCommitSaleInventoryMutationsParams,
    ): Promise<PosOperationResult> {
      const businessAccountRemoteId = params.businessAccountRemoteId?.trim();
      if (!businessAccountRemoteId) {
        return {
          success: false,
          error: {
            type: PosErrorType.ContextRequired,
            message:
              "Business account context is required for inventory commit.",
          },
        };
      }

      if (params.cartLines.length === 0) {
        resetSessionState();
        return { success: true, value: true };
      }

      try {
        const productCollection = database.get<ProductModel>(PRODUCTS_TABLE);
        const movementCollection = database.get<InventoryMovementModel>(
          INVENTORY_MOVEMENTS_TABLE,
        );
        const soldQuantityByProductId = new Map<string, number>();
        for (const cartLine of params.cartLines) {
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

          for (let index = 0; index < params.cartLines.length; index += 1) {
            const cartLine = params.cartLines[index];
            const product = productByRemoteId.get(cartLine.productId);
            if (!product || product.kind !== "item") {
              continue;
            }
            const now = Date.now();
            await movementCollection.create((record) => {
              record.remoteId = `${params.saleReferenceNumber}-${index + 1}-${now}`;
              record.accountRemoteId = businessAccountRemoteId;
              record.productRemoteId = product.remoteId;
              record.productNameSnapshot = product.name;
              record.productUnitLabelSnapshot = product.unitLabel;
              record.movementType = InventoryMovementType.SaleOut;
              record.quantity = cartLine.quantity;
              record.deltaQuantity = cartLine.quantity * -1;
              record.unitRate = cartLine.unitPrice;
              record.reason = null;
              record.remark = `POS sale ${params.saleReferenceNumber}`;
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
              : "Failed to commit POS inventory mutations.",
          ),
        };
      }

      activeBusinessAccountRemoteId = businessAccountRemoteId;
      await loadActiveProducts();
      resetSessionState();
      return { success: true, value: true };
    },

    async saveSession(params: PosSaveSessionParams): Promise<PosOperationResult> {
      try {
        const sessionKey = `pos_session_${params.businessAccountRemoteId}`;
        const sessionData = JSON.stringify(params.sessionData);
        
        await database.write(async () => {
          await database.adapter.setLocal(sessionKey, sessionData);
        });

        return { success: true, value: true };
      } catch (error) {
        return {
          success: false,
          error: createValidationError(
            error instanceof Error
              ? error.message
              : "Failed to save POS session.",
          ),
        };
      }
    },

    async loadSession(params: PosLoadSessionParams): Promise<PosSessionResult> {
      try {
        const sessionKey = `pos_session_${params.businessAccountRemoteId}`;
        
        const sessionData = await database.read(async () => {
          return await database.adapter.getLocal(sessionKey);
        });

        if (!sessionData) {
          return { success: false, error: { type: PosErrorType.Validation, message: "No session found" } };
        }

        const parsedSession = JSON.parse(sessionData) as PosSessionData;
        return { success: true, value: parsedSession };
      } catch (error) {
        return {
          success: false,
          error: createValidationError(
            error instanceof Error
              ? error.message
              : "Failed to load POS session.",
          ),
        };
      }
    },

    async clearSession(params: PosClearSessionParams): Promise<PosOperationResult> {
      try {
        const sessionKey = `pos_session_${params.businessAccountRemoteId}`;
        
        await database.write(async () => {
          await database.adapter.removeLocal(sessionKey);
        });

        return { success: true, value: true };
      } catch (error) {
        return {
          success: false,
          error: createValidationError(
            error instanceof Error
              ? error.message
              : "Failed to clear POS session.",
          ),
        };
      }
    },
  };
};
