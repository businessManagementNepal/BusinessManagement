import { ProductsResult } from "../types/product.types";

export interface GetProductsUseCase {
  execute(accountRemoteId: string): Promise<ProductsResult>;
}

