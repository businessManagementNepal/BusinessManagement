import {
  Product,
  ProductFormFieldErrors,
  ProductFormState,
  ProductKindValue,
} from "@/feature/products/types/product.types";

export type { ProductFormFieldErrors, ProductFormState };

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
  fieldErrors: ProductFormFieldErrors;
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
  onPickImage: () => Promise<void>;
  onClearImage: () => void;
  onSubmit: () => Promise<void>;
  onDelete: (product: Product) => Promise<void>;
}
