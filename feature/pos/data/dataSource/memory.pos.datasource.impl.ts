import {
    PosAddProductToCartParams,
    PosApplyAmountAdjustmentParams,
    PosAssignProductToSlotParams,
    PosChangeQuantityParams,
    PosClearSessionParams,
    PosCompletePaymentParams,
    PosLoadBootstrapParams,
    PosLoadSessionParams,
    PosRemoveSlotProductParams,
    PosSaveSessionParams,
    PosSessionResult,
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

const SEED_PRODUCTS: readonly PosProduct[] = [
  {
    id: "product-basmati-rice-25kg",
    name: "Basmati Rice (25kg)",
    categoryLabel: "Grocery",
    unitLabel: null,
    price: 2500,
    taxRate: 0.13,
    shortCode: "B",
  },
  {
    id: "product-cooking-oil-5l",
    name: "Cooking Oil (5L)",
    categoryLabel: "Grocery",
    unitLabel: null,
    price: 850,
    taxRate: 0.13,
    shortCode: "C",
  },
  {
    id: "product-sugar-1kg",
    name: "Sugar (1kg)",
    categoryLabel: "Grocery",
    unitLabel: null,
    price: 95,
    taxRate: 0.13,
    shortCode: "S",
  },
  {
    id: "product-milk-1l",
    name: "Milk (1L)",
    categoryLabel: "Dairy",
    unitLabel: null,
    price: 110,
    taxRate: 0.13,
    shortCode: "M",
  },
  {
    id: "product-black-tea-500g",
    name: "Black Tea (500g)",
    categoryLabel: "Pantry",
    unitLabel: null,
    price: 330,
    taxRate: 0.13,
    shortCode: "T",
  },
  {
    id: "product-noodles-pack",
    name: "Noodles Pack",
    categoryLabel: "Snacks",
    unitLabel: null,
    price: 40,
    taxRate: 0.13,
    shortCode: "N",
  },
] as const;

const createInitialSlots = (): PosSlot[] => {
  return Array.from({ length: 16 }, (_, index) => ({
    slotId: `slot-${index + 1}`,
    assignedProductId: null,
  }));
};

const cloneSlots = (slots: readonly PosSlot[]): PosSlot[] =>
  slots.map((slot) => ({ ...slot }));

const cloneCartLines = (cartLines: readonly PosCartLine[]): PosCartLine[] =>
  cartLines.map((line) => ({ ...line }));

const formatReceiptNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  return `RCPT-${timestamp}`;
};

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

const createValidationError = (message: string): PosError => ({
  type: PosErrorType.Validation,
  message,
});

export const createMemoryPosDatasource = (): PosDatasource => {
  let products: readonly PosProduct[] = [...SEED_PRODUCTS];
  let slots: PosSlot[] = createInitialSlots();
  let cartLines: PosCartLine[] = [];
  let discountAmount = 0;
  let surchargeAmount = 0;

  const getTotalsValue = (): PosTotals =>
    calculateTotals(cartLines, discountAmount, surchargeAmount);

  const findProduct = (productId: string): PosProduct | undefined =>
    products.find((product) => product.id === productId);

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
        return {
          success: false,
          error: {
            type: PosErrorType.ContextRequired,
            message:
              "POS requires an active business and settlement account before it can open.",
          },
        };
      }

      const bootstrap: PosBootstrap = {
        products,
        slots: cloneSlots(slots),
        activeBusinessAccountRemoteId: params.activeBusinessAccountRemoteId,
        activeOwnerUserRemoteId: params.activeOwnerUserRemoteId,
        activeSettlementAccountRemoteId: params.activeSettlementAccountRemoteId,
      };

      return { success: true, value: bootstrap };
    },

    async searchProducts(searchTerm: string): Promise<readonly PosProduct[]> {
      const normalizedSearchTerm = searchTerm.trim().toLowerCase();

      if (!normalizedSearchTerm) {
        return [...products];
      }

      return products.filter((product) => {
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

      const product = findProduct(params.productId);
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

    async addProductToCart(
      params: PosAddProductToCartParams,
    ): Promise<PosCartLinesResult> {
      const product = findProduct(params.productId);
      if (!product) {
        return {
          success: false,
          error: {
            type: PosErrorType.ProductNotFound,
            message: "The selected product was not found.",
          },
        };
      }

      // Check if product already exists in cart
      const existingLineIndex = cartLines.findIndex(
        (line) => line.productId === params.productId,
      );

      if (existingLineIndex !== -1) {
        // Product exists in cart, increment quantity
        const existingLine = cartLines[existingLineIndex];
        const nextQuantity = existingLine.quantity + 1;
        
        cartLines = cartLines.map((line, index) =>
          index === existingLineIndex
            ? {
                ...line,
                quantity: nextQuantity,
                lineSubtotal: Number((nextQuantity * line.unitPrice).toFixed(2)),
              }
            : line,
        );
      } else {
        // Product not in cart, add new line
        // Use compatibility slotId for cart line shape but don't treat as real slot
        const compatibilitySlotId = `direct-${params.productId}`;
        const newLine = buildCartLine(compatibilitySlotId, product);
        cartLines = [...cartLines, newLine];
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
      const lineIndex = cartLines.findIndex((line) => line.lineId === params.lineId);
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
        return { success: false, error: createValidationError("Discount cannot be negative.") };
      }

      discountAmount = params.amount;
      return { success: true, value: getTotalsValue() };
    },

    async applySurcharge(
      params: PosApplyAmountAdjustmentParams,
    ): Promise<PosTotalsResult> {
      if (params.amount < 0) {
        return { success: false, error: createValidationError("Surcharge cannot be negative.") };
      }

      surchargeAmount = params.amount;
      return { success: true, value: getTotalsValue() };
    },

    async clearCart(): Promise<PosOperationResult> {
      slots = createInitialSlots();
      cartLines = [];
      discountAmount = 0;
      surchargeAmount = 0;
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
      if (cartLines.length === 0) {
        return {
          success: false,
          error: {
            type: PosErrorType.EmptyCart,
            message: "Add at least one product before taking payment.",
          },
        };
      }

      const totals = getTotalsValue();

      // Calculate paid amount from payment parts
      const paidAmount = Number(
        params.paymentParts.reduce((sum, part) => sum + part.amount, 0).toFixed(2),
      );

      const dueAmount = Number(Math.max(totals.grandTotal - paidAmount, 0).toFixed(2));
      
      // Get first payment part's settlement account for ledger effect
      const firstPaymentPart = params.paymentParts[0];
      const settlementAccountRemoteId = firstPaymentPart?.settlementAccountRemoteId ?? null;

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

      // Build payment breakdown for receipt
      const receiptPaymentParts = params.paymentParts.map((part) => ({
        paymentPartId: part.paymentPartId,
        payerLabel: part.payerLabel,
        amount: part.amount,
        settlementAccountRemoteId: part.settlementAccountRemoteId,
        settlementAccountLabel: null, // Will be populated in checkout use case
      }));

      const receipt: PosReceipt = {
        receiptNumber: formatReceiptNumber(),
        issuedAt: new Date().toISOString(),
        lines: cloneCartLines(cartLines),
        totals,
        paidAmount,
        dueAmount,
        ledgerEffect,
        customerName: params.selectedCustomer?.fullName ?? null,
        customerPhone: params.selectedCustomer?.phone ?? null,
        contactRemoteId: params.selectedCustomer?.remoteId ?? null,
        paymentParts: receiptPaymentParts,
      };

      slots = createInitialSlots();
      cartLines = [];
      discountAmount = 0;
      surchargeAmount = 0;

      return { success: true, value: receipt };
    },

    async printReceipt(_: PosReceipt): Promise<PosOperationResult> {
      return { success: true, value: true };
    },

    async saveSession(params: PosSaveSessionParams): Promise<PosOperationResult> {
      // In memory datasource, we'll store sessions in a simple object
      // In production, this would use the local datasource implementation
      return { success: true, value: true };
    },

    async loadSession(params: PosLoadSessionParams): Promise<PosSessionResult> {
      // In memory datasource, return no session (starts fresh)
      return { 
        success: false, 
        error: { 
          type: PosErrorType.Validation, 
          message: "No session found in memory datasource" 
        } 
      };
    },

    async clearSession(params: PosClearSessionParams): Promise<PosOperationResult> {
      // In memory datasource, nothing to clear
      return { success: true, value: true };
    },
  };
};
