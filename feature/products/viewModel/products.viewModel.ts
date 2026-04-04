import {
    Product,
    ProductKindValue,
} from "@/feature/products/types/product.types";

export type ProductFormState = {
  remoteId: string | null;
  name: string;
  kind: ProductKindValue;
  categoryName: string;
  salePrice: string;
  costPrice: string;
  stockQuantity: string;
  unitLabel: string;
  skuOrBarcode: string;
  taxRateLabel: string;
  description: string;
  imageUrl: string;
};

export interface ProductsViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  canManage: boolean;
  currencyCode: string;
  countryCode: string | null;
  searchQuery: string;
  selectedKind: "all" | ProductKindValue;
  summary: {
    totalProducts: number;
    totalItems: number;
    totalServices: number;
    lowStockCount: number;
  };
  products: readonly Product[];
  isEditorVisible: boolean;
  editorMode: "create" | "edit";
  form: ProductFormState;
  categoryOptions: readonly string[];
  unitOptions: readonly string[];
  taxRateOptions: readonly string[];
  onRefresh: () => Promise<void>;
  onSearchChange: (value: string) => void;
  onKindFilterChange: (value: "all" | ProductKindValue) => void;
  onOpenCreate: () => void;
  onOpenEdit: (product: Product) => void;
  onCloseEditor: () => void;
  onFormChange: (field: keyof ProductFormState, value: string) => void;
  onSubmit: () => Promise<void>;
  onDelete: (product: Product) => Promise<void>;
}

