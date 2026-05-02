import {
  ImportPreviewRowStatus,
  ImportRowPreview,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import {
  ProductKind,
  ProductStatus,
} from "@/feature/products/types/product.types";
import {
  getNumberValue,
  getTextValue,
} from "../parser/importParser.shared";

const getOptionalText = (
  row: Record<string, unknown>,
  aliases: readonly string[],
): string | null => {
  return getTextValue(row, aliases);
};

type ProductValidationContext = {
  existingSkuValues: Set<string>;
  seenSkuValues: Set<string>;
};

export const validateProductImportRow = (
  rowNumber: number,
  row: Record<string, unknown>,
  context: ProductValidationContext,
): ImportRowPreview => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = getTextValue(row, ["name", "product_name"]);
  const kindValue =
    getOptionalText(row, ["kind", "product_type", "type"]) ?? ProductKind.Item;
  const kind =
    kindValue.toLowerCase() === ProductKind.Service
      ? ProductKind.Service
      : ProductKind.Item;
  const salePrice = getNumberValue(row, [
    "selling_price",
    "sale_price",
    "price",
  ]);
  const costPrice = getNumberValue(row, ["cost_price", "purchase_price"]);
  const openingStockQuantity = getNumberValue(row, [
    "opening_stock",
    "opening_stock_quantity",
    "stock",
  ]);
  const unitLabel = getOptionalText(row, ["unit", "unit_label"]);
  const skuOrBarcode = getOptionalText(row, [
    "sku",
    "sku_or_barcode",
    "barcode",
  ]);
  const categoryName = getOptionalText(row, ["category", "category_name"]);
  const taxRateLabel = getOptionalText(row, ["tax_rate", "tax_rate_label"]);
  const description = getOptionalText(row, ["description", "notes"]);

  if (!name) {
    errors.push("Product name is required.");
  }

  if (salePrice === null || !Number.isFinite(salePrice)) {
    errors.push("Selling price must be a valid number.");
  } else if (salePrice < 0) {
    errors.push("Selling price cannot be negative.");
  }

  if (costPrice !== null && costPrice < 0) {
    errors.push("Cost price cannot be negative.");
  }

  if (openingStockQuantity !== null && openingStockQuantity < 0) {
    errors.push("Opening stock cannot be negative.");
  }

  if (kind === ProductKind.Item && !unitLabel) {
    errors.push("Item products require a unit label.");
  }

  if (kind === ProductKind.Service && openingStockQuantity !== null && openingStockQuantity > 0) {
    errors.push("Service products cannot include opening stock.");
  }

  const normalizedSku = skuOrBarcode?.trim().toLowerCase() ?? null;
  if (normalizedSku) {
    if (context.existingSkuValues.has(normalizedSku)) {
      errors.push("SKU or barcode already exists in this account.");
    }

    if (context.seenSkuValues.has(normalizedSku)) {
      errors.push("SKU or barcode is duplicated in this import file.");
    }
  }

  if (errors.length === 0 && normalizedSku) {
    context.seenSkuValues.add(normalizedSku);
  }

  const normalizedData = {
    name: name ?? "",
    kind,
    categoryName,
    salePrice: salePrice ?? 0,
    costPrice,
    openingStockQuantity,
    unitLabel,
    skuOrBarcode,
    taxRateLabel,
    description,
    status: ProductStatus.Active,
  };

  const status =
    errors.some((message) => {
      const normalized = message.toLowerCase();
      return (
        normalized.includes("duplicate") || normalized.includes("already exists")
      );
    })
      ? ImportPreviewRowStatus.Duplicate
      : errors.length > 0
        ? ImportPreviewRowStatus.Invalid
        : warnings.length > 0
          ? ImportPreviewRowStatus.Warning
          : ImportPreviewRowStatus.Valid;

  return {
    rowNumber,
    status,
    errors,
    warnings,
    normalizedData,
  };
};
