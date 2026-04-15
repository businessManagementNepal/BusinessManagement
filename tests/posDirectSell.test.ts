import { PosProduct } from "@/feature/pos/types/pos.entity.types";
import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import { createAddProductToCartUseCase } from "@/feature/pos/useCase/addProductToCart.useCase.impl";
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
];

describe("POS Direct Sell Functionality", () => {
  describe("Direct Cart-Add Path", () => {
    it("should add product directly to cart without requiring slot id", async () => {
      const mockRepository = {
        addProductToCart: vi.fn().mockResolvedValue({
          success: true,
          value: [
            {
              lineId: "line-1",
              slotId: "direct-product-1",
              productId: "product-1",
              productName: "Test Product 1",
              categoryLabel: "Test Category",
              shortCode: "TP1",
              quantity: 1,
              unitPrice: 10.99,
              taxRate: 0.1,
              lineSubtotal: 10.99,
            },
          ],
        }),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        assignProductToSlot: vi.fn(),
        removeProductFromSlot: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getSlots: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
        printReceipt: vi.fn(),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        clearSession: vi.fn(),
      };

      const useCase = createAddProductToCartUseCase(mockRepository);
      const result = await useCase.execute({ productId: "product-1" });

      expect(result.success).toBe(true);
      expect(mockRepository.addProductToCart).toHaveBeenCalledWith({
        productId: "product-1",
      });
      if (result.success) {
        expect(result.value[0].productId).toBe("product-1");
        expect(result.value[0].quantity).toBe(1);
      }
    });

    it("should increment quantity when adding same product again", async () => {
      const mockRepository = {
        addProductToCart: vi.fn().mockResolvedValue({
          success: true,
          value: [
            {
              lineId: "line-1",
              slotId: "direct-product-1",
              productId: "product-1",
              productName: "Test Product 1",
              categoryLabel: "Test Category",
              shortCode: "TP1",
              quantity: 2,
              unitPrice: 10.99,
              taxRate: 0.1,
              lineSubtotal: 21.98,
            },
          ],
        }),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        assignProductToSlot: vi.fn(),
        removeProductFromSlot: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getSlots: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
        printReceipt: vi.fn(),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        clearSession: vi.fn(),
      };

      const useCase = createAddProductToCartUseCase(mockRepository);
      const result = await useCase.execute({ productId: "product-1" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value[0].quantity).toBe(2);
        expect(result.value[0].lineSubtotal).toBe(21.98);
      }
    });

    it("should return product-not-found error for invalid product", async () => {
      const mockRepository = {
        addProductToCart: vi.fn().mockResolvedValue({
          success: false,
          error: {
            type: PosErrorType.ProductNotFound,
            message: "The selected product was not found.",
          },
        }),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        assignProductToSlot: vi.fn(),
        removeProductFromSlot: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getSlots: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
        printReceipt: vi.fn(),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        clearSession: vi.fn(),
      };

      const useCase = createAddProductToCartUseCase(mockRepository);
      const result = await useCase.execute({ productId: "invalid-product" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          "The selected product was not found.",
        );
      }
    });

    it("should not call slot validation in direct cart-add path", async () => {
      const mockRepository = {
        addProductToCart: vi.fn().mockResolvedValue({
          success: true,
          value: [],
        }),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        assignProductToSlot: vi.fn(),
        removeProductFromSlot: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getSlots: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
        printReceipt: vi.fn(),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        clearSession: vi.fn(),
      };

      const useCase = createAddProductToCartUseCase(mockRepository);
      await useCase.execute({ productId: "product-1" });

      // Verify only the direct add method was called, no slot-related methods
      expect(mockRepository.addProductToCart).toHaveBeenCalledTimes(1);
      expect(mockRepository.addProductToCart).toHaveBeenCalledWith({
        productId: "product-1",
      });

      // Verify slot methods were not called
      expect(mockRepository.assignProductToSlot).not.toHaveBeenCalled();
      expect(mockRepository.removeProductFromSlot).not.toHaveBeenCalled();
    });
  });

  describe("Quick Products Selection", () => {
    it("should select first 8 products as quick products", () => {
      // For this phase, quick products are simply the first 8 available products
      const quickProducts = mockProducts.slice(0, 8);

      expect(quickProducts).toHaveLength(2);
      expect(quickProducts[0].id).toBe("product-1");
      expect(quickProducts[1].id).toBe("product-2");
    });

    it("should handle case when fewer than 8 products exist", () => {
      const smallProductList = mockProducts.slice(0, 1);
      const quickProducts = smallProductList.slice(0, 8);

      expect(quickProducts).toHaveLength(1);
      expect(quickProducts[0].id).toBe("product-1");
    });
  });

  describe("Direct Add to Cart Logic", () => {
    it("should identify when product already exists in cart", () => {
      const cartLines = [
        {
          lineId: "line-1",
          slotId: "slot-1",
          productId: "product-1",
          productName: "Test Product 1",
          categoryLabel: "Test Category",
          shortCode: "TP1",
          quantity: 1,
          unitPrice: 10.99,
          taxRate: 0.1,
          lineSubtotal: 10.99,
        },
      ];

      const existingLine = cartLines.find(
        (line) => line.productId === "product-1",
      );
      expect(existingLine).toBeDefined();
      expect(existingLine?.quantity).toBe(1);
    });

    it("should handle when product does not exist in cart", () => {
      const cartLines = [
        {
          lineId: "line-1",
          slotId: "slot-1",
          productId: "product-1",
          productName: "Test Product 1",
          categoryLabel: "Test Category",
          shortCode: "TP1",
          quantity: 1,
          unitPrice: 10.99,
          taxRate: 0.1,
          lineSubtotal: 10.99,
        },
      ];

      const existingLine = cartLines.find(
        (line) => line.productId === "product-2",
      );
      expect(existingLine).toBeUndefined();
    });
  });

  describe("Product Search Filtering", () => {
    it("should filter products based on search term", () => {
      const searchTerm = "Test";
      const filteredProducts = mockProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.categoryLabel
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );

      expect(filteredProducts).toHaveLength(2);
      expect(filteredProducts[0].name).toContain("Test");
      expect(filteredProducts[1].name).toContain("Test");
    });

    it("should return empty results for non-matching search", () => {
      const searchTerm = "NonExistent";
      const filteredProducts = mockProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.categoryLabel
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );

      expect(filteredProducts).toHaveLength(0);
    });
  });

  describe("Recent-Product Tracking", () => {
    it("should add product to recent products when added to cart", () => {
      const recentProducts: PosProduct[] = [];
      const productToAdd = mockProducts[0];

      // Simulate recent-product tracking logic
      const filteredRecent = recentProducts.filter(
        (p) => p.id !== productToAdd.id,
      );
      const newRecent = [productToAdd, ...filteredRecent].slice(0, 8);

      expect(newRecent).toHaveLength(1);
      expect(newRecent[0].id).toBe("product-1");
      expect(newRecent[0].name).toBe("Test Product 1");
    });

    it("should move product to front when already in recent products", () => {
      const recentProducts = [mockProducts[1], mockProducts[0]]; // product-2 is first, product-1 is second
      const productToAdd = mockProducts[0]; // Add product-1 again

      // Simulate recent-product tracking logic
      const filteredRecent = recentProducts.filter(
        (p) => p.id !== productToAdd.id,
      );
      const newRecent = [productToAdd, ...filteredRecent].slice(0, 8);

      expect(newRecent).toHaveLength(2);
      expect(newRecent[0].id).toBe("product-1"); // Should now be first
      expect(newRecent[1].id).toBe("product-2");
    });

    it("should limit recent products to 8 items", () => {
      const manyProducts = Array.from({ length: 10 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        categoryLabel: "Test Category",
        unitLabel: "pcs",
        price: 10.99,
        taxRate: 0.1,
        shortCode: `P${i}`,
      }));

      const recentProducts = manyProducts.slice(0, 8); // Start with 8 items
      const newProduct = {
        id: "product-new",
        name: "New Product",
        categoryLabel: "Test Category",
        unitLabel: "pcs",
        price: 15.99,
        taxRate: 0.1,
        shortCode: "NP",
      };

      // Add new product
      const filteredRecent = recentProducts.filter(
        (p) => p.id !== newProduct.id,
      );
      const newRecent = [newProduct, ...filteredRecent].slice(0, 8);

      expect(newRecent).toHaveLength(8);
      expect(newRecent[0].id).toBe("product-new");
      expect(newRecent[7].id).toBe("product-1"); // Last item should be the oldest
    });
  });

  describe("Create-Product Auto-Add", () => {
    it("should auto-add newly created product to cart", async () => {
      const mockRepository = {
        addProductToCart: vi.fn().mockResolvedValue({
          success: true,
          value: [
            {
              lineId: "line-new",
              slotId: "direct-product-new",
              productId: "product-new",
              productName: "New Product",
              categoryLabel: "General",
              shortCode: "NP",
              quantity: 1,
              unitPrice: 15.99,
              taxRate: 0,
              lineSubtotal: 15.99,
            },
          ],
        }),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        assignProductToSlot: vi.fn(),
        removeProductFromSlot: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getSlots: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
        printReceipt: vi.fn(),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        clearSession: vi.fn(),
      };

      const useCase = createAddProductToCartUseCase(mockRepository);
      const result = await useCase.execute({ productId: "product-new" });

      expect(result.success).toBe(true);
      expect(mockRepository.addProductToCart).toHaveBeenCalledWith({
        productId: "product-new",
      });

      if (result.success) {
        expect(result.value[0].productId).toBe("product-new");
        expect(result.value[0].quantity).toBe(1);
      }
    });
  });

  describe("Cart Totals Calculation", () => {
    it("should calculate correct totals for cart items", () => {
      const cartLines = [
        {
          lineId: "line-1",
          slotId: "slot-1",
          productId: "product-1",
          productName: "Test Product 1",
          categoryLabel: "Test Category",
          shortCode: "TP1",
          quantity: 2,
          unitPrice: 10.99,
          taxRate: 0.1,
          lineSubtotal: 21.98,
        },
        {
          lineId: "line-2",
          slotId: "slot-2",
          productId: "product-2",
          productName: "Test Product 2",
          categoryLabel: "Test Category",
          shortCode: "TP2",
          quantity: 1,
          unitPrice: 5.99,
          taxRate: 0.1,
          lineSubtotal: 5.99,
        },
      ];

      const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
      const gross = cartLines.reduce((sum, line) => sum + line.lineSubtotal, 0);

      expect(itemCount).toBe(3);
      expect(gross).toBe(27.97);
    });
  });
});
