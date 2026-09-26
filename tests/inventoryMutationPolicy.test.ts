import {
  InventoryAdjustmentDirection,
  InventoryAdjustmentReason,
  InventoryMovementType,
  type SaveInventoryMovementPayload,
} from "@/feature/inventory/types/inventory.types";
import {
  resolveCountCorrection,
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
      }),
    ).toBe(-5);
  });

  it("tracks non-sellable customer returns without changing stock", () => {
    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.Adjustment,
        quantity: 2,
        reason: InventoryAdjustmentReason.ReturnedNonSellable,
      }),
    ).toBe(0);

    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 2,
            reason: InventoryAdjustmentReason.ReturnedNonSellable,
          }),
        ],
        products: [buildProduct(20)],
      }),
    ).not.toThrow();

    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 2,
            reason: InventoryAdjustmentReason.ReturnedNonSellable,
          }),
        ],
        products: [buildProduct(-3)],
      }),
    ).not.toThrow();
  });

  it("converts a physical count into a sync-safe count correction movement", () => {
    expect(resolveCountCorrection(20, 12)).toEqual({
      quantity: 8,
      adjustmentDirection: InventoryAdjustmentDirection.Remove,
      deltaQuantity: -8,
    });

    expect(resolveCountCorrection(20, 25)).toEqual({
      quantity: 5,
      adjustmentDirection: InventoryAdjustmentDirection.Add,
      deltaQuantity: 5,
    });

    expect(resolveCountCorrection(20, 0)).toEqual({
      quantity: 20,
      adjustmentDirection: InventoryAdjustmentDirection.Remove,
      deltaQuantity: -20,
    });
  });

  it("repairs a negative projected stock from a non-negative physical count", () => {
    expect(resolveCountCorrection(-3, 0)).toEqual({
      quantity: 3,
      adjustmentDirection: InventoryAdjustmentDirection.Add,
      deltaQuantity: 3,
    });

    expect(resolveCountCorrection(-3, 4)).toEqual({
      quantity: 7,
      adjustmentDirection: InventoryAdjustmentDirection.Add,
      deltaQuantity: 7,
    });
  });

  it("rejects a correction that does not change the physical stock", () => {
    expect(() => resolveCountCorrection(20, 20)).toThrow(
      "Physical stock count already matches current stock",
    );
  });

  it("requires a direction on persisted count-correction payloads", () => {
    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 8,
            reason: InventoryAdjustmentReason.Correction,
            adjustmentDirection: null,
          }),
        ],
        products: [buildProduct(20)],
      }),
    ).toThrow("Count correction direction is required");

    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 20,
            reason: InventoryAdjustmentReason.Correction,
            adjustmentDirection: InventoryAdjustmentDirection.Remove,
          }),
        ],
        products: [buildProduct(20)],
      }),
    ).not.toThrow();

    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 3,
            reason: InventoryAdjustmentReason.Correction,
            adjustmentDirection: InventoryAdjustmentDirection.Add,
          }),
        ],
        products: [buildProduct(-3)],
      }),
    ).not.toThrow();
  });

  it("supports explicit add/remove direction for other adjustments", () => {
    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.Adjustment,
        quantity: 4,
        reason: InventoryAdjustmentReason.Other,
        adjustmentDirection: InventoryAdjustmentDirection.Add,
      }),
    ).toBe(4);

    expect(
      resolveInventoryDeltaQuantity({
        movementType: InventoryMovementType.Adjustment,
        quantity: 4,
        reason: InventoryAdjustmentReason.Other,
        adjustmentDirection: InventoryAdjustmentDirection.Remove,
      }),
    ).toBe(-4);
  });

  it("requires explicit direction for other adjustments", () => {
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

    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 4,
            reason: InventoryAdjustmentReason.Other,
            adjustmentDirection: InventoryAdjustmentDirection.Add,
          }),
        ],
        products: [buildProduct(20)],
      }),
    ).not.toThrow();

    expect(() =>
      validateInventoryMovementPayloadsForSave({
        payloads: [
          buildPayload({
            quantity: 4,
            reason: InventoryAdjustmentReason.Other,
            adjustmentDirection: InventoryAdjustmentDirection.Remove,
          }),
        ],
        products: [buildProduct(20)],
      }),
    ).not.toThrow();
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
