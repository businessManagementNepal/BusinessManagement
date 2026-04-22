import {
  CreateProductWithOpeningStockPayload,
  ProductResult,
} from "@/feature/products/types/product.types";

export interface CreateProductWithOpeningStockUseCase {
  execute(payload: CreateProductWithOpeningStockPayload): Promise<ProductResult>;
}
