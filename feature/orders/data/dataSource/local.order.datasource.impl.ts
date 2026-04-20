import {
  SaveOrderPayload,
} from "@/feature/orders/types/order.types";
import { RecordSyncStatus } from "@/feature/session/types/authSession.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { OrderDatasource, OrderRecordBundle } from "./order.datasource";
import { OrderLineModel } from "./db/orderLine.model";
import { OrderModel } from "./db/order.model";

const ORDERS_TABLE = "orders";
const ORDER_LINES_TABLE = "order_lines";
const DUPLICATE_ORDER_NUMBER_ERROR_MESSAGE =
  "An order with this number already exists for this account.";

const normalizeRequired = (value: string): string => value.trim();
const normalizeOptional = (value: string | null): string | null => {
  if (value === null) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};
const normalizeOptionalNumber = (
  value: number | null | undefined,
): number | null => {
  return Number.isFinite(value) ? Number(value) : null;
};

const setCreatedAndUpdatedAt = (
  record: OrderModel | OrderLineModel,
  now: number,
) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: OrderModel | OrderLineModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: OrderModel | OrderLineModel) => {
  if (!record.recordSyncStatus || record.recordSyncStatus === RecordSyncStatus.Synced) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
  }
};

const findOrderByRemoteId = async (
  database: Database,
  remoteId: string,
): Promise<OrderModel | null> => {
  const collection = database.get<OrderModel>(ORDERS_TABLE);
  const matchingOrders = await collection.query(Q.where("remote_id", remoteId)).fetch();
  return matchingOrders[0] ?? null;
};

const findOrderLineByRemoteId = async (
  database: Database,
  remoteId: string,
): Promise<OrderLineModel | null> => {
  const collection = database.get<OrderLineModel>(ORDER_LINES_TABLE);
  const matchingOrderLines = await collection.query(Q.where("remote_id", remoteId)).fetch();
  return matchingOrderLines[0] ?? null;
};

const getActiveOrderLinesByOrderRemoteId = async (
  database: Database,
  orderRemoteId: string,
): Promise<OrderLineModel[]> => {
  const collection = database.get<OrderLineModel>(ORDER_LINES_TABLE);
  return collection
    .query(
      Q.where("order_remote_id", orderRemoteId),
      Q.where("deleted_at", Q.eq(null)),
      Q.sortBy("line_order", Q.asc),
      Q.sortBy("updated_at", Q.desc),
    )
    .fetch();
};

const getBundlesByAccountRemoteId = async (
  database: Database,
  accountRemoteId: string,
): Promise<OrderRecordBundle[]> => {
  const ordersCollection = database.get<OrderModel>(ORDERS_TABLE);
  const orderLineCollection = database.get<OrderLineModel>(ORDER_LINES_TABLE);

  const orders = await ordersCollection
    .query(
      Q.where("account_remote_id", accountRemoteId),
      Q.where("deleted_at", Q.eq(null)),
      Q.sortBy("order_date", Q.desc),
      Q.sortBy("updated_at", Q.desc),
    )
    .fetch();

  if (orders.length === 0) {
    return [];
  }

  const orderRemoteIds = orders.map((order) => order.remoteId);
  const orderLines = await orderLineCollection
    .query(
      Q.where("order_remote_id", Q.oneOf(orderRemoteIds)),
      Q.where("deleted_at", Q.eq(null)),
      Q.sortBy("line_order", Q.asc),
      Q.sortBy("updated_at", Q.desc),
    )
    .fetch();

  const linesByOrderRemoteId = new Map<string, OrderLineModel[]>();
  for (const line of orderLines) {
    const currentLines = linesByOrderRemoteId.get(line.orderRemoteId) ?? [];
    currentLines.push(line);
    linesByOrderRemoteId.set(line.orderRemoteId, currentLines);
  }

  return orders.map((order) => ({
    order,
    items: linesByOrderRemoteId.get(order.remoteId) ?? [],
  }));
};

const getBundleByOrderRemoteId = async (
  database: Database,
  remoteId: string,
): Promise<OrderRecordBundle | null> => {
  const order = await findOrderByRemoteId(database, remoteId);
  if (!order || order.deletedAt !== null) {
    return null;
  }

  const items = await getActiveOrderLinesByOrderRemoteId(database, remoteId);
  return { order, items };
};

const hasActiveOrderNumberDuplicate = async (
  database: Database,
  params: {
    accountRemoteId: string;
    orderNumber: string;
    excludeRemoteId: string;
  },
): Promise<boolean> => {
  const ordersCollection = database.get<OrderModel>(ORDERS_TABLE);
  const duplicateRows = await ordersCollection
    .query(
      Q.unsafeSqlQuery(
        `
          SELECT remote_id
          FROM ${ORDERS_TABLE}
          WHERE account_remote_id = ?
            AND order_number = ? COLLATE NOCASE
            AND deleted_at IS NULL
            AND remote_id <> ?
          LIMIT 1;
        `,
        [params.accountRemoteId, params.orderNumber, params.excludeRemoteId],
      ),
    )
    .unsafeFetchRaw();

  return duplicateRows.length > 0;
};

export const createLocalOrderDatasource = (
  database: Database,
): OrderDatasource => ({
  async saveOrder(payload: SaveOrderPayload): Promise<Result<OrderRecordBundle>> {
    try {
      const normalizedItems = Array.isArray(payload.items) ? payload.items : [];
      const normalizedRemoteId = normalizeRequired(payload.remoteId);
      const normalizedOwnerUserRemoteId = normalizeRequired(payload.ownerUserRemoteId);
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedOrderNumber = normalizeRequired(payload.orderNumber);
      const normalizedCustomerRemoteId = normalizeOptional(payload.customerRemoteId);
      const normalizedDeliveryOrPickupDetails = normalizeOptional(
        payload.deliveryOrPickupDetails,
      );
      const normalizedNotes = normalizeOptional(payload.notes);
      const normalizedTags = normalizeOptional(payload.tags);
      const normalizedInternalRemarks = normalizeOptional(payload.internalRemarks);
      const normalizedSubtotalAmount = normalizeOptionalNumber(
        payload.subtotalAmount,
      );
      const normalizedTaxAmount = normalizeOptionalNumber(payload.taxAmount);
      const normalizedDiscountAmount = normalizeOptionalNumber(
        payload.discountAmount,
      );
      const normalizedTotalAmount = normalizeOptionalNumber(payload.totalAmount);
      const normalizedTaxRatePercent = normalizeOptionalNumber(
        payload.taxRatePercent,
      );
      const normalizedLinkedBillingDocumentRemoteId = normalizeOptional(
        payload.linkedBillingDocumentRemoteId ?? null,
      );
      const normalizedLinkedLedgerDueEntryRemoteId = normalizeOptional(
        payload.linkedLedgerDueEntryRemoteId ?? null,
      );

      if (!normalizedRemoteId) throw new Error("Order remote id is required");
      if (!normalizedOwnerUserRemoteId) throw new Error("Owner user context is required");
      if (!normalizedAccountRemoteId) throw new Error("Account remote id is required");
      if (!normalizedOrderNumber) throw new Error("Order number is required");
      if (!Number.isFinite(payload.orderDate) || payload.orderDate <= 0) {
        throw new Error("Order date is required");
      }
      if (normalizedItems.length === 0) {
        throw new Error("At least one order item is required");
      }
      if (
        normalizedItems.some(
          (item) =>
            !item.productRemoteId?.trim() ||
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0,
        )
      ) {
        throw new Error("Each order item must have a product and quantity greater than zero");
      }
      if (
        normalizedSubtotalAmount === null ||
        normalizedTaxAmount === null ||
        normalizedDiscountAmount === null ||
        normalizedTotalAmount === null
      ) {
        throw new Error("Order totals snapshot is required");
      }
      if (
        normalizedTaxRatePercent === null ||
        normalizedTaxRatePercent < 0
      ) {
        throw new Error("Order tax rate snapshot is required");
      }
      if (
        normalizedItems.some(
          (item) =>
            !item.productNameSnapshot?.trim() ||
            !Number.isFinite(item.unitPriceSnapshot) ||
            (item.unitPriceSnapshot ?? 0) < 0 ||
            !Number.isFinite(item.taxRatePercentSnapshot) ||
            (item.taxRatePercentSnapshot ?? 0) < 0 ||
            !Number.isFinite(item.lineSubtotalAmount) ||
            (item.lineSubtotalAmount ?? 0) < 0 ||
            !Number.isFinite(item.lineTaxAmount) ||
            (item.lineTaxAmount ?? 0) < 0 ||
            !Number.isFinite(item.lineTotalAmount) ||
            (item.lineTotalAmount ?? 0) < 0,
        )
      ) {
        throw new Error(
          "Each order item must include a complete pricing snapshot",
        );
      }

      const duplicateExistsBeforeWrite = await hasActiveOrderNumberDuplicate(
        database,
        {
          accountRemoteId: normalizedAccountRemoteId,
          orderNumber: normalizedOrderNumber,
          excludeRemoteId: normalizedRemoteId,
        },
      );

      if (duplicateExistsBeforeWrite) {
        throw new Error(DUPLICATE_ORDER_NUMBER_ERROR_MESSAGE);
      }

      const existingOrder = await findOrderByRemoteId(database, normalizedRemoteId);
      const orderCollection = database.get<OrderModel>(ORDERS_TABLE);
      const orderLineCollection = database.get<OrderLineModel>(ORDER_LINES_TABLE);

      await database.write(async () => {
        const duplicateExistsAtWriteTime = await hasActiveOrderNumberDuplicate(
          database,
          {
            accountRemoteId: normalizedAccountRemoteId,
            orderNumber: normalizedOrderNumber,
            excludeRemoteId: normalizedRemoteId,
          },
        );

        if (duplicateExistsAtWriteTime) {
          throw new Error(DUPLICATE_ORDER_NUMBER_ERROR_MESSAGE);
        }

        const now = Date.now();
        let orderRecord = existingOrder;

        if (orderRecord) {
          await orderRecord.update((record) => {
            record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
            record.accountRemoteId = normalizedAccountRemoteId;
            record.orderNumber = normalizedOrderNumber;
            record.orderDate = payload.orderDate;
            record.customerRemoteId = normalizedCustomerRemoteId;
            record.deliveryOrPickupDetails = normalizedDeliveryOrPickupDetails;
            record.notes = normalizedNotes;
            record.tags = normalizedTags;
            record.internalRemarks = normalizedInternalRemarks;
            record.status = payload.status;
            record.taxRatePercent = normalizedTaxRatePercent;
            record.subtotalAmount = normalizedSubtotalAmount;
            record.taxAmount = normalizedTaxAmount;
            record.discountAmount = normalizedDiscountAmount;
            record.totalAmount = normalizedTotalAmount;
            record.linkedBillingDocumentRemoteId =
              normalizedLinkedBillingDocumentRemoteId;
            record.linkedLedgerDueEntryRemoteId =
              normalizedLinkedLedgerDueEntryRemoteId;
            record.deletedAt = null;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, now);
          });
        } else {
          orderRecord = await orderCollection.create((record) => {
            record.remoteId = normalizedRemoteId;
            record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
            record.accountRemoteId = normalizedAccountRemoteId;
            record.orderNumber = normalizedOrderNumber;
            record.orderDate = payload.orderDate;
            record.customerRemoteId = normalizedCustomerRemoteId;
            record.deliveryOrPickupDetails = normalizedDeliveryOrPickupDetails;
            record.notes = normalizedNotes;
            record.tags = normalizedTags;
            record.internalRemarks = normalizedInternalRemarks;
            record.status = payload.status;
            record.taxRatePercent = normalizedTaxRatePercent;
            record.subtotalAmount = normalizedSubtotalAmount;
            record.taxAmount = normalizedTaxAmount;
            record.discountAmount = normalizedDiscountAmount;
            record.totalAmount = normalizedTotalAmount;
            record.linkedBillingDocumentRemoteId =
              normalizedLinkedBillingDocumentRemoteId;
            record.linkedLedgerDueEntryRemoteId =
              normalizedLinkedLedgerDueEntryRemoteId;
            record.recordSyncStatus = RecordSyncStatus.PendingCreate;
            record.lastSyncedAt = null;
            record.deletedAt = null;
            setCreatedAndUpdatedAt(record, now);
          });
        }

        if (!orderRecord) {
          throw new Error("Unable to save order");
        }

        const existingOrderLines = await getActiveOrderLinesByOrderRemoteId(
          database,
          normalizedRemoteId,
        );
        const existingOrderLinesByRemoteId = new Map(
          existingOrderLines.map((item) => [item.remoteId, item]),
        );
        const nextRemoteIds = new Set(
          normalizedItems.map((item) => item.remoteId.trim()),
        );

        for (const item of normalizedItems) {
          const normalizedItemRemoteId = normalizeRequired(item.remoteId);
          const normalizedProductRemoteId = normalizeRequired(item.productRemoteId);
          const normalizedProductNameSnapshot = normalizeRequired(
            item.productNameSnapshot ?? "",
          );
          const normalizedUnitLabelSnapshot = normalizeOptional(
            item.unitLabelSnapshot ?? null,
          );
          const normalizedSkuOrBarcodeSnapshot = normalizeOptional(
            item.skuOrBarcodeSnapshot ?? null,
          );
          const normalizedCategoryNameSnapshot = normalizeOptional(
            item.categoryNameSnapshot ?? null,
          );
          const normalizedTaxRateLabelSnapshot = normalizeOptional(
            item.taxRateLabelSnapshot ?? null,
          );
          const normalizedUnitPriceSnapshot = normalizeOptionalNumber(
            item.unitPriceSnapshot,
          );
          const normalizedTaxRatePercentSnapshot = normalizeOptionalNumber(
            item.taxRatePercentSnapshot,
          );
          const normalizedLineSubtotalAmount = normalizeOptionalNumber(
            item.lineSubtotalAmount,
          );
          const normalizedLineTaxAmount = normalizeOptionalNumber(
            item.lineTaxAmount,
          );
          const normalizedLineTotalAmount = normalizeOptionalNumber(
            item.lineTotalAmount,
          );

          if (!normalizedProductNameSnapshot) {
            throw new Error("Order item product name snapshot is required");
          }
          if (
            normalizedUnitPriceSnapshot === null ||
            normalizedTaxRatePercentSnapshot === null ||
            normalizedLineSubtotalAmount === null ||
            normalizedLineTaxAmount === null ||
            normalizedLineTotalAmount === null
          ) {
            throw new Error("Order item pricing snapshot is required");
          }
          const existingLine = existingOrderLinesByRemoteId.get(normalizedItemRemoteId);

          if (existingLine) {
            await existingLine.update((record) => {
              record.orderRemoteId = normalizedRemoteId;
              record.productRemoteId = normalizedProductRemoteId;
              record.productNameSnapshot = normalizedProductNameSnapshot;
              record.unitLabelSnapshot = normalizedUnitLabelSnapshot;
              record.skuOrBarcodeSnapshot = normalizedSkuOrBarcodeSnapshot;
              record.categoryNameSnapshot = normalizedCategoryNameSnapshot;
              record.taxRateLabelSnapshot = normalizedTaxRateLabelSnapshot;
              record.unitPriceSnapshot = normalizedUnitPriceSnapshot;
              record.taxRatePercentSnapshot = normalizedTaxRatePercentSnapshot;
              record.lineSubtotalAmount = normalizedLineSubtotalAmount;
              record.lineTaxAmount = normalizedLineTaxAmount;
              record.lineTotalAmount = normalizedLineTotalAmount;
              record.quantity = item.quantity;
              record.lineOrder = item.lineOrder;
              record.deletedAt = null;
              updateSyncStatusOnMutation(record);
              setUpdatedAt(record, now);
            });
          } else {
            await orderLineCollection.create((record) => {
              record.remoteId = normalizedItemRemoteId;
              record.orderRemoteId = normalizedRemoteId;
              record.productRemoteId = normalizedProductRemoteId;
              record.productNameSnapshot = normalizedProductNameSnapshot;
              record.unitLabelSnapshot = normalizedUnitLabelSnapshot;
              record.skuOrBarcodeSnapshot = normalizedSkuOrBarcodeSnapshot;
              record.categoryNameSnapshot = normalizedCategoryNameSnapshot;
              record.taxRateLabelSnapshot = normalizedTaxRateLabelSnapshot;
              record.unitPriceSnapshot = normalizedUnitPriceSnapshot;
              record.taxRatePercentSnapshot = normalizedTaxRatePercentSnapshot;
              record.lineSubtotalAmount = normalizedLineSubtotalAmount;
              record.lineTaxAmount = normalizedLineTaxAmount;
              record.lineTotalAmount = normalizedLineTotalAmount;
              record.quantity = item.quantity;
              record.lineOrder = item.lineOrder;
              record.recordSyncStatus = RecordSyncStatus.PendingCreate;
              record.lastSyncedAt = null;
              record.deletedAt = null;
              setCreatedAndUpdatedAt(record, now);
            });
          }
        }

        for (const existingLine of existingOrderLines) {
          if (nextRemoteIds.has(existingLine.remoteId)) {
            continue;
          }

          await existingLine.update((record) => {
            record.deletedAt = now;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, now);
          });
        }
      });

      const savedOrderBundle = await getBundleByOrderRemoteId(database, normalizedRemoteId);
      if (!savedOrderBundle) {
        throw new Error("Unable to load saved order");
      }

      return { success: true, value: savedOrderBundle };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getOrdersByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<OrderRecordBundle[]>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }
      const orderBundles = await getBundlesByAccountRemoteId(database, normalizedAccountRemoteId);
      return { success: true, value: orderBundles };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getOrderByRemoteId(remoteId: string): Promise<Result<OrderRecordBundle | null>> {
    try {
      const normalizedRemoteId = normalizeRequired(remoteId);
      if (!normalizedRemoteId) {
        throw new Error("Order remote id is required");
      }

      const orderBundle = await getBundleByOrderRemoteId(database, normalizedRemoteId);
      return { success: true, value: orderBundle };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteOrderByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const normalizedRemoteId = normalizeRequired(remoteId);
      if (!normalizedRemoteId) {
        throw new Error("Order remote id is required");
      }

      const existingOrder = await findOrderByRemoteId(database, normalizedRemoteId);
      if (!existingOrder || existingOrder.deletedAt !== null) {
        return { success: true, value: false };
      }

      const existingOrderLines = await getActiveOrderLinesByOrderRemoteId(database, normalizedRemoteId);

      await database.write(async () => {
        const now = Date.now();
        await existingOrder.update((record) => {
          record.deletedAt = now;
          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, now);
        });

        for (const line of existingOrderLines) {
          await line.update((record) => {
            record.deletedAt = now;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, now);
          });
        }
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async updateOrderStatusByRemoteId(
    remoteId: string,
    status: SaveOrderPayload["status"],
  ): Promise<Result<OrderRecordBundle>> {
    try {
      const normalizedRemoteId = normalizeRequired(remoteId);
      if (!normalizedRemoteId) {
        throw new Error("Order remote id is required");
      }

      const existingOrder = await findOrderByRemoteId(database, normalizedRemoteId);
      if (!existingOrder || existingOrder.deletedAt !== null) {
        throw new Error("Order not found");
      }

      await database.write(async () => {
        await existingOrder.update((record) => {
          record.status = status;
          record.deletedAt = null;
          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, Date.now());
        });
      });

      const updatedBundle = await getBundleByOrderRemoteId(database, normalizedRemoteId);
      if (!updatedBundle) {
        throw new Error("Order not found");
      }

      return { success: true, value: updatedBundle };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async removeOrderItemByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const normalizedRemoteId = normalizeRequired(remoteId);
      if (!normalizedRemoteId) {
        throw new Error("Order item remote id is required");
      }

      const existingLine = await findOrderLineByRemoteId(database, normalizedRemoteId);
      if (!existingLine || existingLine.deletedAt !== null) {
        return { success: true, value: false };
      }

      await database.write(async () => {
        await existingLine.update((record) => {
          record.deletedAt = Date.now();
          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, Date.now());
        });
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async assignOrderCustomer(
    orderRemoteId: string,
    customerRemoteId: string | null,
  ): Promise<Result<OrderRecordBundle>> {
    try {
      const normalizedOrderRemoteId = normalizeRequired(orderRemoteId);
      if (!normalizedOrderRemoteId) {
        throw new Error("Order remote id is required");
      }

      const existingOrder = await findOrderByRemoteId(database, normalizedOrderRemoteId);
      if (!existingOrder || existingOrder.deletedAt !== null) {
        throw new Error("Order not found");
      }

      await database.write(async () => {
        await existingOrder.update((record) => {
          record.customerRemoteId = normalizeOptional(customerRemoteId);
          record.deletedAt = null;
          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, Date.now());
        });
      });

      const updatedBundle = await getBundleByOrderRemoteId(database, normalizedOrderRemoteId);
      if (!updatedBundle) {
        throw new Error("Order not found");
      }

      return { success: true, value: updatedBundle };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async linkOrderCommercialAnchors(params): Promise<Result<OrderRecordBundle>> {
    try {
      const normalizedOrderRemoteId = normalizeRequired(params.orderRemoteId);
      if (!normalizedOrderRemoteId) {
        throw new Error("Order remote id is required");
      }

      const existingOrder = await findOrderByRemoteId(
        database,
        normalizedOrderRemoteId,
      );
      if (!existingOrder || existingOrder.deletedAt !== null) {
        throw new Error("Order not found");
      }

      await database.write(async () => {
        await existingOrder.update((record) => {
          record.linkedBillingDocumentRemoteId = normalizeOptional(
            params.linkedBillingDocumentRemoteId,
          );
          record.linkedLedgerDueEntryRemoteId = normalizeOptional(
            params.linkedLedgerDueEntryRemoteId,
          );
          record.deletedAt = null;
          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, Date.now());
        });
      });

      const updatedBundle = await getBundleByOrderRemoteId(
        database,
        normalizedOrderRemoteId,
      );
      if (!updatedBundle) {
        throw new Error("Order not found");
      }

      return { success: true, value: updatedBundle };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
