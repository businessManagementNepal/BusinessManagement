import { Result } from "../../../shared/types/result.types";

export const ProductKind = {
  Item: "item",
  Service: "service",
} as const;

export type ProductKindValue = (typeof ProductKind)[keyof typeof ProductKind];

export const ProductStatus = {
  Active: "active",
  Inactive: "inactive",
} as const;

export type ProductStatusValue =
  (typeof ProductStatus)[keyof typeof ProductStatus];

export type Product = {
  remoteId: string;
  accountRemoteId: string;
  name: string;
  kind: ProductKindValue;
  categoryName: string | null;
  salePrice: number;
  costPrice: number | null;
  stockQuantity: number | null;
  unitLabel: string | null;
  skuOrBarcode: string | null;
  taxRateLabel: string | null;
  description: string | null;
  imageUrl: string | null;
  status: ProductStatusValue;
  createdAt: number;
  updatedAt: number;
};

export type SaveProductPayload = {
  remoteId: string;
  accountRemoteId: string;
  name: string;
  kind: ProductKindValue;
  categoryName: string | null;
  salePrice: number;
  costPrice: number | null;
  stockQuantity: number | null;
  unitLabel: string | null;
  skuOrBarcode: string | null;
  taxRateLabel: string | null;
  description: string | null;
  imageUrl: string | null;
  status: ProductStatusValue;
};

export const ProductErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  ProductNotFound: "PRODUCT_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type ProductError = {
  type: (typeof ProductErrorType)[keyof typeof ProductErrorType];
  message: string;
};

export const ProductDatabaseError: ProductError = {
  type: ProductErrorType.DatabaseError,
  message: "Unable to process the product right now. Please try again.",
};

export const ProductValidationError = (message: string): ProductError => ({
  type: ProductErrorType.ValidationError,
  message,
});

export const ProductNotFoundError: ProductError = {
  type: ProductErrorType.ProductNotFound,
  message: "The requested product was not found.",
};

export const ProductUnknownError: ProductError = {
  type: ProductErrorType.UnknownError,
  message: "An unexpected product error occurred.",
};

export type ProductResult = Result<Product, ProductError>;
export type ProductsResult = Result<Product[], ProductError>;
export type ProductOperationResult = Result<boolean, ProductError>;

export const PRODUCT_CATEGORY_OPTIONS = [
  "Groceries",
  "Beverages",
  "Household",
  "Electronics",
  "Services",
  "General",
] as const;

export const PRODUCT_UNIT_OPTIONS = ["pcs", "kg", "bag", "bottle", "box", "ltr"] as const;
