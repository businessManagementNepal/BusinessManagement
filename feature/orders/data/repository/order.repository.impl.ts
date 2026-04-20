import { OrderDatasource } from "@/feature/orders/data/dataSource/order.datasource";
import {
  OrderDatabaseError,
  OrderError,
  OrderNotFoundError,
  OrderUnknownError,
  OrderValidationError,
  SaveOrderPayload,
} from "@/feature/orders/types/order.types";
import {
  mapOrderRecordBundleToDomain,
} from "./mapper/order.mapper";
import { OrderRepository } from "./order.repository";

const mapDatasourceError = (error: Error): OrderError => {
  const normalized = error.message.trim();
  const lower = normalized.toLowerCase();

  if (lower.includes("not found")) {
    return OrderNotFoundError;
  }

  if (
    lower.includes("required") ||
    lower.includes("quantity") ||
    lower.includes("invalid") ||
    lower.includes("duplicate") ||
    lower.includes("already exists")
  ) {
    return OrderValidationError(normalized);
  }

  if (
    lower.includes("database") ||
    lower.includes("schema") ||
    lower.includes("adapter") ||
    lower.includes("table")
  ) {
    return OrderDatabaseError;
  }

  return {
    ...OrderUnknownError,
    message: normalized || OrderUnknownError.message,
  };
};

export const createOrderRepository = (
  datasource: OrderDatasource,
): OrderRepository => ({
  async saveOrder(payload: SaveOrderPayload) {
    const result = await datasource.saveOrder(payload);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return { success: true, value: mapOrderRecordBundleToDomain(result.value) };
  },

  async getOrdersByAccountRemoteId(accountRemoteId: string) {
    const result = await datasource.getOrdersByAccountRemoteId(accountRemoteId);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return {
      success: true,
      value: result.value.map(mapOrderRecordBundleToDomain),
    };
  },

  async getOrderByRemoteId(remoteId: string) {
    const result = await datasource.getOrderByRemoteId(remoteId);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    if (!result.value) {
      return { success: false, error: OrderNotFoundError };
    }
    return { success: true, value: mapOrderRecordBundleToDomain(result.value) };
  },

  async deleteOrderByRemoteId(remoteId: string) {
    const result = await datasource.deleteOrderByRemoteId(remoteId);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return result;
  },

  async updateOrderStatusByRemoteId(remoteId: string, status: SaveOrderPayload["status"]) {
    const result = await datasource.updateOrderStatusByRemoteId(remoteId, status);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return { success: true, value: mapOrderRecordBundleToDomain(result.value) };
  },

  async removeOrderItemByRemoteId(remoteId: string) {
    const result = await datasource.removeOrderItemByRemoteId(remoteId);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return result;
  },

  async assignOrderCustomer(orderRemoteId: string, customerRemoteId: string | null) {
    const result = await datasource.assignOrderCustomer(orderRemoteId, customerRemoteId);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return { success: true, value: mapOrderRecordBundleToDomain(result.value) };
  },

  async linkOrderCommercialAnchors(params) {
    const result = await datasource.linkOrderCommercialAnchors(params);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return { success: true, value: mapOrderRecordBundleToDomain(result.value) };
  },
});
