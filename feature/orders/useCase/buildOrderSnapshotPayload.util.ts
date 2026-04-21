import { Product } from "../../products/types/product.types";
import {
    Order,
    OrderStatus,
    SaveOrderLinePayload,
    SaveOrderPayload,
} from "../types/order.types";

type BuildOrderSnapshotPayloadParams = {
  payload: SaveOrderPayload;
  products: readonly Product[];
  existingOrder: Order | null;
};

type BuildOrderSnapshotPayloadResult =
  | { success: true; value: SaveOrderPayload }
  | { success: false; error: string };

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeString = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeNumber = (value: number | null | undefined): number | null => {
  return Number.isFinite(value) ? Number(value) : null;
};

export const validateOrderDraftPayload = (
  payload: SaveOrderPayload,
): string | null => {
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!payload.remoteId.trim()) return "Order remote id is required.";
  if (!payload.ownerUserRemoteId.trim()) return "User context is required.";
  if (!payload.accountRemoteId.trim())
    return "An active business account is required.";
  if (!payload.orderNumber.trim()) return "Order number is required.";
  if (!Number.isFinite(payload.orderDate) || payload.orderDate <= 0) {
    return "Order date is required.";
  }
  if (payload.status === OrderStatus.Delivered) {
    return "Use order status action to mark an order as delivered so inventory can be posted safely.";
  }

  if (payload.status === OrderStatus.Returned) {
    return "Use return action to mark an order as returned so inventory can be restocked safely.";
  }

  if (items.length === 0) return "Add at least one order item.";
  if (
    items.some(
      (item) =>
        !item.productRemoteId?.trim() ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0,
    )
  ) {
    return "Each order item must have a product and quantity greater than zero.";
  }

  return null;
};

export const buildOrderSnapshotPayload = ({
  payload,
  products,
  existingOrder,
}: BuildOrderSnapshotPayloadParams): BuildOrderSnapshotPayloadResult => {
  const productsByRemoteId = new Map(
    products.map((product) => [product.remoteId, product]),
  );
  const existingLinesByRemoteId = new Map(
    (existingOrder?.items ?? []).map((line) => [line.remoteId, line]),
  );

  const fallbackOrderTaxRatePercent =
    normalizeNumber(payload.taxRatePercent) ??
    normalizeNumber(existingOrder?.taxRatePercent) ??
    0;

  const normalizedItems: SaveOrderLinePayload[] = [];
  let subtotalAmount = 0;
  let taxAmount = 0;
  const discountAmount = 0;

  for (const item of payload.items) {
    const normalizedLineRemoteId = item.remoteId.trim();
    const normalizedProductRemoteId = item.productRemoteId.trim();
    const normalizedQuantity = Number(item.quantity);

    if (!normalizedLineRemoteId) {
      return { success: false, error: "Order item remote id is required." };
    }

    if (!normalizedProductRemoteId) {
      return { success: false, error: "Each order item must have a product." };
    }

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      return {
        success: false,
        error: "Each order item must have quantity greater than zero.",
      };
    }

    const existingLine = existingLinesByRemoteId.get(normalizedLineRemoteId);
    const linkedProduct = productsByRemoteId.get(normalizedProductRemoteId) ?? null;
    const canPreserveExistingSnapshot =
      !!existingLine && existingLine.productRemoteId === normalizedProductRemoteId;

    if (!canPreserveExistingSnapshot && !linkedProduct) {
      return {
        success: false,
        error: "One or more selected products no longer exist.",
      };
    }

    const productNameSnapshot = canPreserveExistingSnapshot
      ? normalizeString(existingLine?.productNameSnapshot) ??
        normalizeString(linkedProduct?.name)
      : normalizeString(item.productNameSnapshot) ??
        normalizeString(linkedProduct?.name);

    if (!productNameSnapshot) {
      return {
        success: false,
        error: "Each order item must include a product name snapshot.",
      };
    }

    const unitLabelSnapshot = canPreserveExistingSnapshot
      ? normalizeString(existingLine?.unitLabelSnapshot) ??
        normalizeString(linkedProduct?.unitLabel)
      : normalizeString(item.unitLabelSnapshot) ??
        normalizeString(linkedProduct?.unitLabel);

    const skuOrBarcodeSnapshot = canPreserveExistingSnapshot
      ? normalizeString(existingLine?.skuOrBarcodeSnapshot) ??
        normalizeString(linkedProduct?.skuOrBarcode)
      : normalizeString(item.skuOrBarcodeSnapshot) ??
        normalizeString(linkedProduct?.skuOrBarcode);

    const categoryNameSnapshot = canPreserveExistingSnapshot
      ? normalizeString(existingLine?.categoryNameSnapshot) ??
        normalizeString(linkedProduct?.categoryName)
      : normalizeString(item.categoryNameSnapshot) ??
        normalizeString(linkedProduct?.categoryName);

    const taxRateLabelSnapshot = canPreserveExistingSnapshot
      ? normalizeString(existingLine?.taxRateLabelSnapshot) ??
        normalizeString(linkedProduct?.taxRateLabel)
      : normalizeString(item.taxRateLabelSnapshot) ??
        normalizeString(linkedProduct?.taxRateLabel);

    const unitPriceSnapshot = canPreserveExistingSnapshot
      ? normalizeNumber(existingLine?.unitPriceSnapshot) ??
        normalizeNumber(linkedProduct?.salePrice)
      : normalizeNumber(item.unitPriceSnapshot) ??
        normalizeNumber(linkedProduct?.salePrice);

    if (unitPriceSnapshot === null || unitPriceSnapshot < 0) {
      return {
        success: false,
        error: "Each order item must include a valid unit price snapshot.",
      };
    }

    const taxRatePercentSnapshot = canPreserveExistingSnapshot
      ? normalizeNumber(existingLine?.taxRatePercentSnapshot) ??
        fallbackOrderTaxRatePercent
      : normalizeNumber(item.taxRatePercentSnapshot) ??
        fallbackOrderTaxRatePercent;

    if (taxRatePercentSnapshot === null || taxRatePercentSnapshot < 0) {
      return {
        success: false,
        error: "Each order item must include a valid tax rate snapshot.",
      };
    }

    const lineSubtotalAmount = roundMoney(
      normalizedQuantity * unitPriceSnapshot,
    );
    const lineTaxAmount = roundMoney(
      (lineSubtotalAmount * taxRatePercentSnapshot) / 100,
    );
    const lineTotalAmount = roundMoney(lineSubtotalAmount + lineTaxAmount);

    subtotalAmount += lineSubtotalAmount;
    taxAmount += lineTaxAmount;

    normalizedItems.push({
      remoteId: normalizedLineRemoteId,
      orderRemoteId: payload.remoteId.trim(),
      productRemoteId: normalizedProductRemoteId,
      productNameSnapshot,
      unitLabelSnapshot,
      skuOrBarcodeSnapshot,
      categoryNameSnapshot,
      taxRateLabelSnapshot,
      unitPriceSnapshot,
      taxRatePercentSnapshot,
      quantity: normalizedQuantity,
      lineSubtotalAmount,
      lineTaxAmount,
      lineTotalAmount,
      lineOrder: item.lineOrder,
    });
  }

  subtotalAmount = roundMoney(subtotalAmount);
  taxAmount = roundMoney(taxAmount);

  return {
    success: true,
    value: {
      ...payload,
      remoteId: payload.remoteId.trim(),
      ownerUserRemoteId: payload.ownerUserRemoteId.trim(),
      accountRemoteId: payload.accountRemoteId.trim(),
      orderNumber: payload.orderNumber.trim(),
      customerRemoteId: normalizeString(payload.customerRemoteId),
      deliveryOrPickupDetails: normalizeString(payload.deliveryOrPickupDetails),
      notes: normalizeString(payload.notes),
      tags: normalizeString(payload.tags),
      internalRemarks: normalizeString(payload.internalRemarks),
      taxRatePercent: fallbackOrderTaxRatePercent,
      subtotalAmount,
      taxAmount,
      discountAmount,
      totalAmount: roundMoney(subtotalAmount + taxAmount - discountAmount),
      items: normalizedItems,
    },
  };
};