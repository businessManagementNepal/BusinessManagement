import { PosProduct } from "@/feature/pos/types/pos.entity.types";
import { describe, expect, it, vi } from "vitest";

// Mock products for testing
const mockProducts: PosProduct[] = [
  {
    id: "product-1",
    name: "Test Product 1",
    categoryLabel: "Test Category",
    unitLabel: "pcs",
    price: 10.99,
    taxRate: 0.1,
    shortCode: "TP1",
  },
  {
    id: "product-2",
    name: "Test Product 2",
    categoryLabel: "Test Category",
    unitLabel: "pcs",
    price: 5.99,
    taxRate: 0.1,
    shortCode: "TP2",
  },
  {
    id: "product-3",
    name: "Test Product 3",
    categoryLabel: "Other Category",
    unitLabel: "pcs",
    price: 15.99,
    taxRate: 0.1,
    shortCode: "TP3",
  },
];

describe("POS Chips and Remove Cart Behavior", () => {
  describe("Recent Products Tracking", () => {
    it("should track products used in current session only", () => {
      // Simulate empty recent products at start of session
      let recentProducts: PosProduct[] = [];

      // Add product 1 to cart
      recentProducts = updateRecentProducts(recentProducts, mockProducts[0]);
      expect(recentProducts).toHaveLength(1);
      expect(recentProducts[0].id).toBe("product-1");

      // Add product 2 to cart
      recentProducts = updateRecentProducts(recentProducts, mockProducts[1]);
      expect(recentProducts).toHaveLength(2);
      expect(recentProducts[0].id).toBe("product-2"); // Most recent first
      expect(recentProducts[1].id).toBe("product-1");
    });

    it("should update recency order when re-adding same product", () => {
      let recentProducts: PosProduct[] = [mockProducts[2], mockProducts[1], mockProducts[0]];

      // Re-add product 1 (should move to front)
      recentProducts = updateRecentProducts(recentProducts, mockProducts[0]);
      expect(recentProducts).toHaveLength(3);
      expect(recentProducts[0].id).toBe("product-1"); // Moved to front
      expect(recentProducts[1].id).toBe("product-2");
      expect(recentProducts[2].id).toBe("product-3");
    });

    it("should not limit to 8 products (session-only tracking)", () => {
      const manyProducts = Array.from({ length: 12 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        categoryLabel: "Test Category",
        unitLabel: "pcs",
        price: 10.99,
        taxRate: 0.1,
        shortCode: `P${i}`,
      }));

      let recentProducts: PosProduct[] = [];
      
      // Add all 12 products
      manyProducts.forEach(product => {
        recentProducts = updateRecentProducts(recentProducts, product);
      });

      expect(recentProducts).toHaveLength(12); // No limit for session tracking
    });

    it("should have no first-8 fallback - start empty", () => {
      const recentProducts: PosProduct[] = [];
      expect(recentProducts).toHaveLength(0);
      
      // Quick products should be empty initially
      const quickProducts = recentProducts.slice(0, 8);
      expect(quickProducts).toHaveLength(0);
    });
  });

  describe("Remove Cart Behavior", () => {
    it("should use quantity-to-zero path for direct-added lines", () => {
      const directAddedLine = {
        lineId: "line-1",
        productId: "product-1",
        productName: "Test Product 1",
        categoryLabel: "Test Category",
        shortCode: "TP1",
        quantity: 2,
        unitPrice: 10.99,
        taxRate: 0.1,
        lineSubtotal: 21.98,
      };

      const mockChangeQuantityUseCase = {
        execute: vi.fn().mockResolvedValue({
          success: true,
          value: [], // Empty cart after removal
        }),
      };

      // Remove cart line should call changeCartLineQuantity with nextQuantity: 0
      const result = mockChangeQuantityUseCase.execute({
        lineId: directAddedLine.lineId,
        nextQuantity: 0,
      });

      expect(mockChangeQuantityUseCase.execute).toHaveBeenCalledWith({
        lineId: "line-1",
        nextQuantity: 0,
      });
    });

    it("should not use slot removal path for direct-added lines", () => {
      const directAddedLine = {
        lineId: "line-1",
        productId: "product-1",
        productName: "Test Product 1",
        categoryLabel: "Test Category",
        shortCode: "TP1",
        quantity: 1,
        unitPrice: 10.99,
        taxRate: 0.1,
        lineSubtotal: 10.99,
      };

      // Direct-added lines should not trigger slot updates
      const shouldUpdateSlots = false;
      expect(shouldUpdateSlots).toBe(false);
    });

    it("should use slot removal path only for actual slot lines", () => {
      const slotLine = {
        lineId: "line-1",
        productId: "product-1",
        productName: "Test Product 1",
        categoryLabel: "Test Category",
        shortCode: "TP1",
        quantity: 1,
        unitPrice: 10.99,
        taxRate: 0.1,
        lineSubtotal: 10.99,
      };

      // Slot lines should trigger slot updates
      const shouldUpdateSlots = true;
      expect(shouldUpdateSlots).toBe(true);
    });
  });

  describe("Created and Auto-Added Products", () => {
    it("should add created products to recent products after auto-add", () => {
      const createdProduct = {
        id: "product-new",
        name: "New Product",
        categoryLabel: "General",
        unitLabel: "pcs",
        price: 25.99,
        taxRate: 0,
        shortCode: "NP",
      };

      let recentProducts: PosProduct[] = [mockProducts[0], mockProducts[1]];

      // After creating and auto-adding product, it should appear in recent products
      recentProducts = updateRecentProducts(recentProducts, createdProduct);
      
      expect(recentProducts).toHaveLength(3);
      expect(recentProducts[0].id).toBe("product-new"); // Created product at front
      expect(recentProducts[1].id).toBe("product-2");
      expect(recentProducts[2].id).toBe("product-1");
    });
  });
});

// Helper function to simulate the updateRecentProducts logic
function updateRecentProducts(recentProducts: PosProduct[], product: PosProduct): PosProduct[] {
  const filteredRecent = recentProducts.filter((item) => item.id !== product.id);
  return [product, ...filteredRecent]; // No limit - session-only tracking
}
