import { StatusType } from "@/shared/types/status.types";
import {
  PosBootstrap,
  PosCartLine,
  PosProduct,
  PosReceipt,
  PosSlot,
  PosTotals,
} from "./pos.entity.types";

export type PosModalType =
  | "none"
  | "product-selection"
  | "create-product"
  | "discount"
  | "surcharge"
  | "payment"
  | "receipt"
  | "customer-create";

export type PosScreenState = {
  status: StatusType;
  bootstrap: PosBootstrap | null;
  products: readonly PosProduct[];
  filteredProducts: readonly PosProduct[];
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
  customerCreateForm: {
    fullName: string;
    phone: string;
    address: string;
  };
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
  isBusinessContextResolved: boolean;
  load: () => Promise<void>;
  onPressSlot: (slotId: string) => Promise<void>;
  onLongPressSlot: (slotId: string) => void;
  onRemoveSlotProduct: (slotId: string) => Promise<void>;
  onProductSearchChange: (value: string) => Promise<void>;
  onSelectProduct: (productId: string) => Promise<void>;
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
  onOpenSplitBillModal: () => void;
  onApplyDiscount: () => Promise<void>;
  onApplySurcharge: () => Promise<void>;
  onClearCart: () => Promise<void>;
  onCompletePayment: () => Promise<void>;
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
  customerOptions: readonly import("../ui/components/PosCustomerSelector").DropdownOption[];
};
