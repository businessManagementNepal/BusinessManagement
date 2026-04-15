import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { StatusType } from "@/shared/types/status.types";
import {
    PosBootstrap,
    PosCartLine,
    PosProduct,
    PosReceipt,
    PosSlot,
    PosTotals,
} from "./pos.entity.types";

export type PosCheckoutMode = "payment" | "split-bill";

export type PosCheckoutSubmissionKind = "payment" | "split-bill";

export type PosModalType =
  | "none"
  | "product-selection"
  | "create-product"
  | "discount"
  | "surcharge"
  | "payment"
  | "split-bill"
  | "receipt"
  | "customer-create";

export type PosScreenState = {
  status: StatusType;
  bootstrap: PosBootstrap | null;
  products: readonly PosProduct[];
  filteredProducts: readonly PosProduct[];
  recentProducts: readonly PosProduct[];
  slots: readonly PosSlot[];
  cartLines: readonly PosCartLine[];
  totals: PosTotals;
  activeSlotId: string | null;
  selectedSlotId: string | null;
  activeModal: PosModalType;
  productSearchTerm: string;
  discountInput: string;
  surchargeInput: string;
  paymentInput: string;
  paymentSplitCountInput: string;
  quickProductNameInput: string;
  quickProductPriceInput: string;
  quickProductCategoryInput: string;
  receipt: PosReceipt | null;
  infoMessage: string | null;
  errorMessage: string | null;
  selectedCustomer: import("./pos.entity.types").PosCustomer | null;
  customerSearchTerm: string;
  customerOptions: readonly import("../ui/components/PosCustomerSelector").DropdownOption[];
  selectedSettlementAccountRemoteId: string;
  moneyAccountOptions: readonly import("../ui/components/PosCustomerSelector").DropdownOption[];
  customerCreateForm: {
    fullName: string;
    phone: string;
    address: string;
  };
  isCreatingCustomer: boolean;
  splitBillDraftParts: readonly import("./pos.entity.types").PosSplitDraftPart[];
  splitBillErrorMessage: string | null;
  isCheckoutSubmitting: boolean;
  checkoutSubmissionKind: PosCheckoutSubmissionKind | null;
};

export type PosScreenViewModel = {
  status: StatusType;
  screenTitle: string;
  currencyCode: string;
  countryCode: string | null;
  taxSummaryLabel: string;
  slots: readonly PosSlot[];
  cartLines: readonly PosCartLine[];
  totals: PosTotals;
  products: readonly PosProduct[];
  filteredProducts: readonly PosProduct[];
  recentProducts: readonly PosProduct[];
  activeSlotId: string | null;
  selectedSlotId: string | null;
  activeModal: PosModalType;
  productSearchTerm: string;
  discountInput: string;
  surchargeInput: string;
  paymentInput: string;
  paymentSplitCountInput: string;
  quickProductNameInput: string;
  quickProductPriceInput: string;
  quickProductCategoryInput: string;
  receipt: PosReceipt | null;
  infoMessage: string | null;
  errorMessage: string | null;
  selectedCustomer: import("./pos.entity.types").PosCustomer | null;
  customerSearchTerm: string;
  customerCreateForm: {
    fullName: string;
    phone: string;
    address: string;
  };
  selectedSettlementAccountRemoteId: string;
  moneyAccountOptions: readonly DropdownOption[];
  isBusinessContextResolved: boolean;
  load: () => Promise<void>;
  onPressSlot: (slotId: string) => Promise<void>;
  onLongPressSlot: (slotId: string) => void;
  onRemoveSlotProduct: (slotId: string) => Promise<void>;
  onProductSearchChange: (value: string) => Promise<void>;
  onSelectProduct: (productId: string) => Promise<void>;
  onAddProductToCart: (productId: string) => Promise<void>;
  onOpenCreateProductModal: () => void;
  onCloseCreateProductModal: () => void;
  onQuickProductNameInputChange: (value: string) => void;
  onQuickProductPriceInputChange: (value: string) => void;
  onQuickProductCategoryInputChange: (value: string) => void;
  onCreateProductFromPos: () => Promise<void>;
  onCloseModal: () => void;
  onIncreaseQuantity: (lineId: string) => Promise<void>;
  onDecreaseQuantity: (lineId: string) => Promise<void>;
  onRemoveCartLine: (lineId: string) => Promise<void>;
  onDiscountInputChange: (value: string) => void;
  onSurchargeInputChange: (value: string) => void;
  onPaymentInputChange: (value: string) => void;
  onPaymentSplitCountInputChange: (value: string) => void;
  onOpenDiscountModal: () => void;
  onOpenSurchargeModal: () => void;
  onOpenPaymentModal: () => void;
  onClosePaymentModal: () => void;
  onOpenSplitBillModal: () => void;
  onCloseSplitBillModal: () => void;
  onApplyEqualSplit: (count: number) => Promise<void>;
  onAddSplitBillPart: () => Promise<void>;
  onRemoveSplitBillPart: (paymentPartId: string) => Promise<void>;
  onChangeSplitBillPartPayerLabel: (
    paymentPartId: string,
    value: string,
  ) => Promise<void>;
  onChangeSplitBillPartAmount: (
    paymentPartId: string,
    value: string,
  ) => Promise<void>;
  onChangeSplitBillPartSettlementAccount: (
    paymentPartId: string,
    settlementAccountRemoteId: string,
  ) => Promise<void>;
  onCompleteSplitBillPayment: () => Promise<void>;
  onApplyDiscount: () => Promise<void>;
  onApplySurcharge: () => Promise<void>;
  onClearCart: () => Promise<void>;
  onCompletePayment: () => Promise<void>;
  onConfirmPayment: () => Promise<void>;
  onOpenReceiptModal: () => void;
  onCloseReceiptModal: () => void;
  onPrintReceipt: () => Promise<void>;
  onShareReceipt: () => Promise<void>;
  onSelectCustomer: (
    customer: import("./pos.entity.types").PosCustomer,
  ) => void;
  onClearCustomer: () => void;
  onCustomerSearchChange: (searchTerm: string) => void;
  onOpenCustomerCreateModal: () => void;
  onCloseCustomerCreateModal: () => void;
  onCustomerCreateFormChange: (
    field: "fullName" | "phone" | "address",
    value: string,
  ) => void;
  onCreateCustomer: () => Promise<void>;
  onSettlementAccountChange: (settlementAccountRemoteId: string) => void;
  customerOptions: readonly import("../ui/components/PosCustomerSelector").DropdownOption[];
  isCreatingCustomer: boolean;
  splitBillDraftParts: readonly import("./pos.entity.types").PosSplitDraftPart[];
  splitBillAllocatedAmount: number;
  splitBillRemainingAmount: number;
  splitBillErrorMessage: string | null;
  isCheckoutSubmitting: boolean;
  isPaymentSubmitting: boolean;
  isSplitBillSubmitting: boolean;
};
