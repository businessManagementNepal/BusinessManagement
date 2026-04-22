import type { BillingDocument } from "@/feature/billing/types/billing.types";
import { StatusType } from "@/shared/types/status.types";
import type {
    PosBootstrap,
    PosCartLine,
    PosCustomer,
    PosProduct,
    PosReceipt,
    PosSplitDraftPart,
    PosTotals,
} from "./pos.entity.types";
import type { PosCustomerOption, PosMoneyAccountOption } from "./pos.ui.types";
import type {
    PosCheckoutSubmissionKind,
    PosModalType,
} from "./pos.workflow.types";

export type PosQuickProductFieldName = "name" | "salePrice";

export type PosQuickProductFieldErrors = Partial<
  Record<PosQuickProductFieldName, string>
>;

export type PosCatalogState = {
  products: readonly PosProduct[];
  filteredProducts: readonly PosProduct[];
  recentProducts: readonly PosProduct[];
  productSearchTerm: string;
  quickProductNameInput: string;
  quickProductPriceInput: string;
  quickProductCategoryInput: string;
  quickProductFieldErrors: PosQuickProductFieldErrors;
};

export type PosCartState = {
  cartLines: readonly PosCartLine[];
  totals: PosTotals;
  discountInput: string;
  surchargeInput: string;
};

export type PosCustomerState = {
  selectedCustomer: PosCustomer | null;
  customerSearchTerm: string;
  customerOptions: readonly PosCustomerOption[];
  customerCreateForm: {
    fullName: string;
    phone: string;
    address: string;
  };
  isCreatingCustomer: boolean;
};

export type PosCheckoutState = {
  paymentInput: string;
  selectedSettlementAccountRemoteId: string;
  moneyAccountOptions: readonly PosMoneyAccountOption[];
  isCheckoutSubmitting: boolean;
  checkoutSubmissionKind: PosCheckoutSubmissionKind | null;
};

export type PosSplitBillState = {
  splitBillDraftParts: readonly PosSplitDraftPart[];
  splitBillErrorMessage: string | null;
};

export type PosReceiptState = {
  receipt: PosReceipt | null;
};

export type PosSaleHistoryState = {
  receipts: readonly BillingDocument[];
  filteredReceipts: readonly BillingDocument[];
  isLoading: boolean;
  searchTerm: string;
  selectedReceipt: BillingDocument | null;
  errorMessage: string | null;
};

export type PosScreenCoordinatorState = {
  status: StatusType;
  bootstrap: PosBootstrap | null;
  activeModal: PosModalType;
  infoMessage: string | null;
  errorMessage: string | null;
  products: readonly PosProduct[];
  filteredProducts: readonly PosProduct[];
  recentProducts: readonly PosProduct[];
  cartLines: readonly PosCartLine[];
  totals: PosTotals;
  productSearchTerm: string;
  discountInput: string;
  surchargeInput: string;
  paymentInput: string;
  quickProductNameInput: string;
  quickProductPriceInput: string;
  quickProductCategoryInput: string;
  quickProductFieldErrors: PosQuickProductFieldErrors;
  receipt: PosReceipt | null;
  selectedCustomer: PosCustomer | null;
  customerSearchTerm: string;
  customerOptions: readonly PosCustomerOption[];
  selectedSettlementAccountRemoteId: string;
  moneyAccountOptions: readonly PosMoneyAccountOption[];
  customerCreateForm: {
    fullName: string;
    phone: string;
    address: string;
  };
  isCreatingCustomer: boolean;
  splitBillDraftParts: readonly PosSplitDraftPart[];
  splitBillErrorMessage: string | null;
  isCheckoutSubmitting: boolean;
  checkoutSubmissionKind: PosCheckoutSubmissionKind | null;
};
