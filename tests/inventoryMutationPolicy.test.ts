import {
  InventoryAdjustmentDirection,
  InventoryAdjustmentReason,
  InventoryMovementType,
  type SaveInventoryMovementPayload,
} from "@/feature/inventory/types/inventory.types";
import {
  resolveInventoryDeltaQuantity,
  validateInventoryMovementPayloadsForSave,
} from "@/feature/inventory/utils/inventoryMutationPolicy.util";
import {
  ProductKind,
  ProductStatus,
  type Product,
} from "@/feature/products/types/product.types";
import { describe, expect, it } from "vitest";

const buildProduct = (stockQuantity = 20): Product => ({
  remoteId: "product-1",
  accountRemoteId: "account-1",
  name: "Test Product",
  kind: ProductKind.Item,
  categoryName: "General",
  salePrice: 100,
  costPrice: 80,
  stockQuantity,
  unitLabel: "pcs",
  skuOrBarcode: "TEST-001",
  taxRateLabel: null,
  description: null,
  imageUrl: null,
  status: ProductStatus.Active,
  createdAt: 1,
  updatedAt: 1,
});

const buildPayload = (
  overrides: Partial<SaveInventoryMovementPayload> = {},
): SaveInventoryMovementPayload => ({
  remoteId: "movement-1",
  accountRemoteId: "account-1",
  productRemoteId: "product-1",
  type: InventoryMovementType.Adjustment,
  quantity: 5,
  unitRate: null,
  reason: InventoryAdjustmentReason.Damage,
  adjustmentDirection: null,
  remark: null,
  movementAt: 1_710_000_000_000,
  ...overrides,
});

describe("inventoryMutationPolicy", () => {
  it("keeps stock-in positive and sale-out negative", () => {
    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.StockIn,
        quantity: 5,
      }),
    ).toBe(5);

    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.OpeningStock,
        quantity: 5,
      }),
    ).toBe(5);

    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.SaleOut,
        quantity: 5,
      }),
    ).toBe(-5);
  });

  it.each([
    InventoryAdjustmentReason.Damage,
    InventoryAdjustmentReason.Expired,
    InventoryAdjustmentReason.Lost,
  ])("reduces stock for %s adjustments", (reason) => {
    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.Adjustment,
        quantity: 5,
        reason,
        currentStock: 20,
      }),
    ).toBe(-5);
  });

  it("calculates count correction from current stock to the physical count", () => {
    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.Adjustment,
        quantity: 12,
        reason: InventoryAdjustmentReason.Correction,
        currentStock: 20,
      }),
    ).toBe(-8);

    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.Adjustment,
        quantity: 25,
        reason: InventoryAdjustmentReason.Correction,
        currentStock: 20,
      }),
    ).toBe(5);
  });

  it("allows a physical count correction to zero stock", () => {
    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 0,
            reason: InventoryAdjustmentReason.Correction,
          }),
        ],
        products: [buildProduct(20)],
      }),
    ).not.toThrow();
  });

  it("rejects a correction that does not change the physical stock", () => {
    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 20,
            reason: InventoryAdjustmentReason.Correction,
          }),
        ],
        products: [buildProduct(20)],
      }),
    ).toThrow("Physical stock count already matches current stock");
  });

  it("supports explicit add/remove direction for other adjustments", () => {
    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.Adjustment,
        quantity: 4,
        reason: InventoryAdjustmentReason.Other,
        adjustmentDirection: InventoryAdjustmentDirection.Add,
        currentStock: 20,
      }),
    ).toBe(4);

    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.Adjustment,
        quantity: 4,
        reason: InventoryAdjustmentReason.Other,
        adjustmentDirection: InventoryAdjustmentDirection.Remove,
        currentStock: 20,
      }),
    ).toBe(-4);
  });

  it("requires direction for other adjustments", () => {
    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            reason: InventoryAdjustmentReason.Other,
            adjustmentDirection: null,
          }),
        ],
        products: [buildProduct()],
      }),
    ).toThrow("Choose whether the other adjustment adds or removes stock");
  });

  it("rejects damage that would reduce stock below zero", () => {
    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 21,
            reason: InventoryAdjustmentReason.Damage,
          }),
        ],
        products: [buildProduct(20)],
      }),
    ).toThrow("Inventory movement would reduce Test Product below zero");
  });
});
