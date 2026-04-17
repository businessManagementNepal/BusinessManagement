import type {
  MoneyAccount,
  MoneyAccountTypeValue,
} from "@/feature/accounts/types/moneyAccount.types";
import { Status } from "@/shared/types/status.types";
import type { PosSaveSessionParams } from "../../types/pos.dto.types";
import type {
  PosCartLine,
  PosCustomer,
  PosProduct,
  PosSplitDraftPart,
  PosTotals,
} from "../../types/pos.entity.types";
import type { PosScreenCoordinatorState } from "../../types/pos.state.types";
import type { PosMoneyAccountOption } from "../../types/pos.ui.types";
import {
  POS_DEFAULT_QUICK_PRODUCT_PRICE_INPUT,
  POS_MIN_SPLIT_PARTS,
} from "../../types/pos.constant";

export const EMPTY_TOTALS: PosTotals = {
  itemCount: 0,
  gross: 0,
  discountAmount: 0,
  surchargeAmount: 0,
  taxAmount: 0,
  grandTotal: 0,
};

export const INITIAL_POS_SCREEN_COORDINATOR_STATE: PosScreenCoordinatorState = {
  status: Status.Idle,
  bootstrap: null,
  products: [],
  filteredProducts: [],
  recentProducts: [],
  cartLines: [],
  totals: EMPTY_TOTALS,
  activeModal: "none",
  productSearchTerm: "",
  discountInput: "",
  surchargeInput: "",
  paymentInput: "",
  quickProductNameInput: "",
  quickProductPriceInput: POS_DEFAULT_QUICK_PRODUCT_PRICE_INPUT,
  quickProductCategoryInput: "",
  receipt: null,
  infoMessage: null,
  errorMessage: null,
  selectedCustomer: null,
  customerSearchTerm: "",
  customerOptions: [],
  selectedSettlementAccountRemoteId: "",
  moneyAccountOptions: [],
  customerCreateForm: {
    fullName: "",
    phone: "",
    address: "",
  },
  isCreatingCustomer: false,
  splitBillDraftParts: [],
  splitBillErrorMessage: null,
  isCheckoutSubmitting: false,
  checkoutSubmissionKind: null,
};

export type PosSessionStateOverrides = Partial<PosSaveSessionParams["sessionData"]>;

export const parseAmountInput = (value: string): number => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return 0;
  }

  const parsed = Number(normalizedValue);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
};

export const calculateTotals = (
  cartLines: readonly PosCartLine[],
  discountAmount: number,
  surchargeAmount: number,
): PosTotals => {
  const gross = cartLines.reduce((sum, line) => sum + line.lineSubtotal, 0);
  const adjustedBase = Math.max(gross - discountAmount + surchargeAmount, 0);
  const weightedTaxRate =
    cartLines.length === 0
      ? 0
      : cartLines.reduce(
          (sum, line) => sum + line.taxRate * line.lineSubtotal,
          0,
        ) / Math.max(gross, 1);
  const taxAmount = Number((adjustedBase * weightedTaxRate).toFixed(2));
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

export const buildNextRecentProducts = (
  currentRecentProducts: readonly PosProduct[],
  product: PosProduct,
): readonly PosProduct[] => {
  const filteredRecent = currentRecentProducts.filter(
    (item) => item.id !== product.id,
  );

  return [product, ...filteredRecent];
};

export const buildEqualSplitDraftParts = (
  count: number,
  grandTotal: number,
  defaultSettlementAccountRemoteId: string,
): readonly PosSplitDraftPart[] => {
  const safeCount = Math.max(count, POS_MIN_SPLIT_PARTS);
  const base = Number((grandTotal / safeCount).toFixed(2));

  const parts = Array.from({ length: safeCount }, (_, index) => ({
    paymentPartId: `part-${index + 1}`,
    payerLabel: `Friend ${index + 1}`,
    amountInput: base.toFixed(2),
    settlementAccountRemoteId: defaultSettlementAccountRemoteId,
  }));

  const allocated = parts.reduce(
    (sum, part) => sum + Number(part.amountInput || "0"),
    0,
  );
  const diff = Number((grandTotal - allocated).toFixed(2));

  if (diff !== 0 && parts.length > 0) {
    const last = parts[parts.length - 1];
    parts[parts.length - 1] = {
      ...last,
      amountInput: (Number(last.amountInput) + diff).toFixed(2),
    };
  }

  return parts;
};

export const getSplitDraftSummary = (
  parts: readonly PosSplitDraftPart[],
  grandTotal: number,
): { allocatedAmount: number; remainingAmount: number } => {
  const allocatedAmount = parts.reduce(
    (sum, part) => sum + parseAmountInput(part.amountInput),
    0,
  );

  return {
    allocatedAmount: Number(allocatedAmount.toFixed(2)),
    remainingAmount: Number((grandTotal - allocatedAmount).toFixed(2)),
  };
};

export const validateSplitBillDraft = (
  parts: readonly PosSplitDraftPart[],
  grandTotal: number,
  selectedCustomer: PosCustomer | null,
): string | null => {
  if (parts.length < POS_MIN_SPLIT_PARTS) {
    return "Add at least two payment parts for split bill.";
  }

  let allocated = 0;
  for (const part of parts) {
    const amount = parseAmountInput(part.amountInput);

    if (amount <= 0) {
      return "Each split row must have an amount greater than zero.";
    }

    if (!part.settlementAccountRemoteId.trim()) {
      return "Each split row must have a settlement money account.";
    }

    allocated += amount;
  }

  const remaining = Number((grandTotal - allocated).toFixed(2));
  if (remaining < 0) {
    return "Split payment total cannot exceed grand total.";
  }

  if (remaining > 0 && !selectedCustomer) {
    return "Select a customer when split payment leaves a due amount.";
  }

  return null;
};

const getMoneyAccountTypeLabel = (type: MoneyAccountTypeValue): string =>
  type === "cash" ? "Cash" : type === "bank" ? "Bank" : "Wallet";

export const mapMoneyAccountToOption = (
  moneyAccount: MoneyAccount,
): PosMoneyAccountOption => {
  const typeLabel = getMoneyAccountTypeLabel(moneyAccount.type);
  const primarySuffix = moneyAccount.isPrimary ? " (Primary)" : "";

  return {
    label: `${moneyAccount.name} | ${typeLabel}${primarySuffix}`,
    value: moneyAccount.remoteId,
  };
};
