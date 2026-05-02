import { CreateProductWithOpeningStockPayload, ProductKind, ProductStatus } from "@/feature/products/types/product.types";

const createRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `prd-import-${randomId}`;
  }

  return `prd-import-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const mapProductImportData = (params: {
  normalizedData: Record<string, unknown>;
  activeAccountRemoteId: string;
}): CreateProductWithOpeningStockPayload => ({
  product: {
    remoteId: createRemoteId(),
    accountRemoteId: params.activeAccountRemoteId,
    name: String(params.normalizedData["name"] ?? "").trim(),
    kind:
      params.normalizedData["kind"] === ProductKind.Service
        ? ProductKind.Service
        : ProductKind.Item,
    categoryName: (params.normalizedData["categoryName"] as string | null) ?? null,
    salePrice: Number(params.normalizedData["salePrice"] ?? 0),
    costPrice:
      params.normalizedData["costPrice"] === null ||
      params.normalizedData["costPrice"] === undefined
        ? null
        : Number(params.normalizedData["costPrice"]),
    unitLabel: (params.normalizedData["unitLabel"] as string | null) ?? null,
    skuOrBarcode:
      (params.normalizedData["skuOrBarcode"] as string | null) ?? null,
    taxRateLabel:
      (params.normalizedData["taxRateLabel"] as string | null) ?? null,
    description: (params.normalizedData["description"] as string | null) ?? null,
    imageUrl: null,
    status: ProductStatus.Active,
  },
  openingStockQuantity:
    params.normalizedData["openingStockQuantity"] === null ||
    params.normalizedData["openingStockQuantity"] === undefined
      ? null
      : Number(params.normalizedData["openingStockQuantity"]),
});
