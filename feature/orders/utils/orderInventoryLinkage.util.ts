import {
  InventoryAdjustmentReason,
  InventoryMovement,
  InventoryMovementSourceModule,
  InventoryMovementType,
  InventorySourceLookupParams,
  SaveInventoryMovementPayload,
} from "@/feature/inventory/types/inventory.types";
import {
  Order,
  OrderLine,
  OrderReturnLineDisposition,
  OrderStatus,
  OrderStatusValue,
} from "@/feature/orders/types/order.types";
import { Product } from "@/feature/products/types/product.types";

export const ORDER_INVENTORY_SOURCE_ACTION = {
  DeliveryFulfillment: "delivery_fulfillment",
  ReturnRestock: "return_restock",
  ReturnNonSellable: "return_non_sellable",
} as const;

const safeTrim = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

const buildToken = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

export const canTransitionOrderToDelivered = (
  currentStatus: OrderStatusValue,
): boolean =>
  currentStatus === OrderStatus.Confirmed ||
  currentStatus === OrderStatus.Processing ||
  currentStatus === OrderStatus.Ready ||
  currentStatus === OrderStatus.Shipped ||
  currentStatus === OrderStatus.Delivered;

export const canTransitionOrderToReturned = (
  currentStatus: OrderStatusValue,
): boolean =>
  currentStatus === OrderStatus.Delivered ||
  currentStatus === OrderStatus.Returned;

export const buildOrderDeliveryInventoryMovementRemoteId = (params: {
  orderRemoteId: string;
  lineRemoteId: string;
}): string =>
  `inv-order-delivery-${buildToken(params.orderRemoteId)}-${buildToken(
    params.lineRemoteId,
  )}`;

export const buildOrderReturnInventoryMovementRemoteId = (params: {
  orderRemoteId: string;
  lineRemoteId: string;
}): string =>
  `inv-order-return-${buildToken(params.orderRemoteId)}-${buildToken(
    params.lineRemoteId,
  )}`;

export const buildOrderNonSellableReturnMovementRemoteId = (params: {
  orderRemoteId: string;
  lineRemoteId: string;
}): string =>
  `inv-order-return-nonsellable-${buildToken(
    params.orderRemoteId,
  )}-${buildToken(params.lineRemoteId)}`;

export const buildOrderInventorySourceLookupParams = (params: {
  accountRemoteId: string;
  orderRemoteId: string;
}): InventorySourceLookupParams => ({
  accountRemoteId: params.accountRemoteId,
  sourceModule: InventoryMovementSourceModule.Orders,
  sourceRemoteId: params.orderRemoteId,
});

export const getInventoryTrackedOrderLines = (params: {
  order: Order;
  productsByRemoteId: Map<string, Product>;
}): Array<{ line: OrderLine; product: Product }> => {
  const orderItems = Array.isArray(params.order.items) ? params.order.items : [];

  return orderItems.flatMap((line) => {
    const product = params.productsByRemoteId.get(line.productRemoteId);
    if (!product || product.kind !== "item") {
      return [];
    }

    return [{ line, product }];
  });
};

export const validateOrderReturnDispositions = (params: {
  trackedLines: readonly { line: OrderLine; product: Product }[];
  lineDispositions: readonly OrderReturnLineDisposition[];
}): void => {
  const trackedLineByRemoteId = new Map(
    params.trackedLines.map(({ line }) => [line.remoteId, line]),
  );
  const dispositionByLineRemoteId = new Map<string, OrderReturnLineDisposition>();

  for (const disposition of params.lineDispositions) {
    const lineRemoteId = disposition.lineRemoteId.trim();
    if (!lineRemoteId) {
      throw new Error("Return disposition line id is required");
    }

    if (dispositionByLineRemoteId.has(lineRemoteId)) {
      throw new Error("Duplicate return disposition line");
    }

    const line = trackedLineByRemoteId.get(lineRemoteId);
    if (!line) {
      throw new Error("Return disposition contains an unknown inventory item line");
    }

    if (
      !Number.isFinite(disposition.sellableQuantity) ||
      disposition.sellableQuantity < 0 ||
      !Number.isFinite(disposition.nonSellableQuantity) ||
      disposition.nonSellableQuantity < 0
    ) {
      throw new Error("Returned quantities cannot be negative");
    }

    const totalReturned =
      disposition.sellableQuantity + disposition.nonSellableQuantity;

    if (Math.abs(totalReturned - line.quantity) > 1e-9) {
      throw new Error(
        `Return quantities for ${line.productNameSnapshot ?? "item"} must total ${line.quantity}`,
      );
    }

    dispositionByLineRemoteId.set(lineRemoteId, {
      ...disposition,
      lineRemoteId,
    });
  }

  if (dispositionByLineRemoteId.size !== params.trackedLines.length) {
    throw new Error("Return disposition is required for every inventory item line");
  }
};

export const buildOrderDeliveryInventoryPayloads = (params: {
  order: Order;
  productsByRemoteId: Map<string, Product>;
  movementAt: number;
}): SaveInventoryMovementPayload[] =>
  getInventoryTrackedOrderLines(params).map(({ line, product }) => ({
    remoteId: buildOrderDeliveryInventoryMovementRemoteId({
      orderRemoteId: params.order.remoteId,
      lineRemoteId: line.remoteId,
    }),
    accountRemoteId: params.order.accountRemoteId,
    productRemoteId: product.remoteId,
    type: InventoryMovementType.SaleOut,
    quantity: line.quantity,
    unitRate: null,
    reason: null,
    remark: `Order ${safeTrim(params.order.orderNumber) || params.order.remoteId} delivered`,
    sourceModule: InventoryMovementSourceModule.Orders,
    sourceRemoteId: params.order.remoteId,
    sourceLineRemoteId: line.remoteId,
    sourceAction: ORDER_INVENTORY_SOURCE_ACTION.DeliveryFulfillment,
    movementAt: params.movementAt,
  }));

export const buildOrderReturnInventoryPayloads = (params: {
  order: Order;
  productsByRemoteId: Map<string, Product>;
  lineDispositions: readonly OrderReturnLineDisposition[];
  movementAt: number;
}): SaveInventoryMovementPayload[] => {
  const dispositionByLineRemoteId = new Map(
    params.lineDispositions.map((disposition) => [
      disposition.lineRemoteId,
      disposition,
    ]),
  );
  const payloads: SaveInventoryMovementPayload[] = [];

  for (const { line, product } of getInventoryTrackedOrderLines(params)) {
    const disposition = dispositionByLineRemoteId.get(line.remoteId);
    if (!disposition) {
      continue;
    }

    if (disposition.sellableQuantity > 0) {
      payloads.push({
        remoteId: buildOrderReturnInventoryMovementRemoteId({
          orderRemoteId: params.order.remoteId,
          lineRemoteId: line.remoteId,
        }),
        accountRemoteId: params.order.accountRemoteId,
        productRemoteId: product.remoteId,
        type: InventoryMovementType.StockIn,
        quantity: disposition.sellableQuantity,
        unitRate: null,
        reason: null,
        remark: `Order ${safeTrim(params.order.orderNumber) || params.order.remoteId} sellable return`,
        sourceModule: InventoryMovementSourceModule.Orders,
        sourceRemoteId: params.order.remoteId,
        sourceLineRemoteId: line.remoteId,
        sourceAction: ORDER_INVENTORY_SOURCE_ACTION.ReturnRestock,
        movementAt: params.movementAt,
      });
    }

    if (disposition.nonSellableQuantity > 0) {
      payloads.push({
        remoteId: buildOrderNonSellableReturnMovementRemoteId({
          orderRemoteId: params.order.remoteId,
          lineRemoteId: line.remoteId,
        }),
        accountRemoteId: params.order.accountRemoteId,
        productRemoteId: product.remoteId,
        type: InventoryMovementType.Adjustment,
        quantity: disposition.nonSellableQuantity,
        unitRate: null,
        reason: InventoryAdjustmentReason.ReturnedNonSellable,
        remark: `Order ${safeTrim(params.order.orderNumber) || params.order.remoteId} damaged/non-sellable return`,
        sourceModule: InventoryMovementSourceModule.Orders,
        sourceRemoteId: params.order.remoteId,
        sourceLineRemoteId: line.remoteId,
        sourceAction: ORDER_INVENTORY_SOURCE_ACTION.ReturnNonSellable,
        movementAt: params.movementAt,
      });
    }
  }

  return payloads;
};

export const mapOrderInventoryMovementsByLineAndAction = (
  movements: readonly InventoryMovement[],
): Map<string, InventoryMovement> => {
  const map = new Map<string, InventoryMovement>();

  for (const movement of movements) {
    const sourceLineRemoteId = safeTrim(movement.sourceLineRemoteId);
    const sourceAction = safeTrim(movement.sourceAction);
    if (!sourceLineRemoteId || !sourceAction) {
      continue;
    }

    map.set(`${sourceLineRemoteId}:${sourceAction}`, movement);
  }

  return map;
};
