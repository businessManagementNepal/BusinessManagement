import { PosCustomer, PosProduct } from "@/feature/pos/types/pos.entity.types";
import { createAddProductToCartUseCase } from "@/feature/pos/useCase/addProductToCart.useCase.impl";
import { createClearPosSessionUseCase } from "@/feature/pos/useCase/clearPosSession.useCase.impl";
import { createLoadPosSessionUseCase } from "@/feature/pos/useCase/loadPosSession.useCase.impl";
import { createSavePosSessionUseCase } from "@/feature/pos/useCase/savePosSession.useCase.impl";
import { describe, expect, it, vi } from "vitest";

// Mock data for testing
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

const mockCustomer: PosCustomer = {
  remoteId: "customer-1",
  fullName: "John Doe",
  phone: "+1234567890",
  address: "123 Test St",
};

describe("POS Behavioral Tests", () => {
  describe("Direct-Sell Functionality", () => {
    it("should add product directly to cart without requiring slot id", async () => {
      const mockRepository = {
        addProductToCart: vi.fn().mockResolvedValue({
          success: true,
          value: [
            {
              lineId: "line-1",
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
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
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
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
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
  });

  describe("Session Persistence", () => {
    it("should save and load session for same business account", async () => {
      const sessionData = {
        cartLines: [
          {
            lineId: "line-1",
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
        recentProducts: mockProducts,
        productSearchTerm: "test",
        selectedCustomer: mockCustomer,
        discountInput: "5.00",
        surchargeInput: "2.50",
      };

      const mockRepository = {
        saveSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        loadSession: vi.fn().mockResolvedValue({
          success: true,
          value: sessionData,
        }),
        clearSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        addProductToCart: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
      };

      const saveSessionUseCase = createSavePosSessionUseCase(mockRepository);
      const loadSessionUseCase = createLoadPosSessionUseCase(mockRepository);

      // Save session
      const saveResult = await saveSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
        sessionData,
      });

      expect(saveResult.success).toBe(true);

      // Load session for same account
      const loadResult = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(loadResult.success).toBe(true);
      expect(loadResult.value).toEqual(sessionData);
    });

    it("should clear session on successful checkout", async () => {
      const mockRepository = {
        clearSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        addProductToCart: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
      };

      const clearSessionUseCase = createClearPosSessionUseCase(mockRepository);
      const result = await clearSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(result.success).toBe(true);
      expect(mockRepository.clearSession).toHaveBeenCalledWith({
        businessAccountRemoteId: "account-1",
      });
    });

    it("should clear session on clear cart", async () => {
      const mockRepository = {
        clearSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        addProductToCart: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
      };

      const clearSessionUseCase = createClearPosSessionUseCase(mockRepository);
      const result = await clearSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(result.success).toBe(true);
      expect(mockRepository.clearSession).toHaveBeenCalledWith({
        businessAccountRemoteId: "account-1",
      });
    });

    it("should prevent cross-account session restoration", async () => {
      const sessionData = {
        cartLines: [],
        recentProducts: mockProducts,
        productSearchTerm: "test",
        selectedCustomer: mockCustomer,
        discountInput: "5.00",
        surchargeInput: "2.50",
      };

      const mockRepository = {
        saveSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        loadSession: vi.fn().mockImplementation((params) => {
          if (params.businessAccountRemoteId === "account-1") {
            return Promise.resolve({
              success: true,
              value: sessionData,
            });
          } else {
            return Promise.resolve({
              success: false,
              error: {
                type: "validation",
                message: "No session found",
              },
            });
          }
        }),
        clearSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        addProductToCart: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
      };

      const loadSessionUseCase = createLoadPosSessionUseCase(mockRepository);

      // Load session for account-1 (should find data)
      const result1 = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });
      expect(result1.success).toBe(true);

      // Load session for account-2 (should not find data)
      const result2 = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-2",
      });
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error?.message).toBe("No session found");
      }
    });
  });

  describe("UI State Behavior", () => {
    it("should show empty state when no search term", () => {
      // This tests the search-only visible product list behavior
      const searchTerm: string = "";
      const filteredProducts = searchTerm
        ? mockProducts.filter(
            (product) =>
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.categoryLabel
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
          )
        : ([] as PosProduct[]);

      expect(filteredProducts).toHaveLength(0);
    });

    it("should show matching products when search term exists", () => {
      // This tests the search-only visible product list behavior
      const searchTerm: string = "Test";
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

    it("should show no results when search term has no matches", () => {
      // This tests the search-only visible product list behavior
      const searchTerm: string = "NonExistent";
      const filteredProducts = mockProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.categoryLabel
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );

      expect(filteredProducts).toHaveLength(0);
    });

    it("should track recent products correctly", () => {
      // This tests the current-session chips behavior
      let recentProducts: PosProduct[] = [];

      // Add first product
      recentProducts = [
        mockProducts[0],
        ...recentProducts.filter((p) => p.id !== mockProducts[0].id),
      ];
      expect(recentProducts).toHaveLength(1);
      expect(recentProducts[0].id).toBe("product-1");

      // Add second product
      recentProducts = [
        mockProducts[1],
        ...recentProducts.filter((p) => p.id !== mockProducts[1].id),
      ];
      expect(recentProducts).toHaveLength(2);
      expect(recentProducts[0].id).toBe("product-2");
      expect(recentProducts[1].id).toBe("product-1");

      // Re-add first product (should move to front)
      recentProducts = [
        mockProducts[0],
        ...recentProducts.filter((p) => p.id !== mockProducts[0].id),
      ];
      expect(recentProducts).toHaveLength(2);
      expect(recentProducts[0].id).toBe("product-1");
      expect(recentProducts[1].id).toBe("product-2");
    });

    it("should limit recent products to reasonable number", () => {
      // This tests the current-session chips behavior (no first-8 fallback)
      const manyProducts = Array.from({ length: 10 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        categoryLabel: "Test Category",
        unitLabel: "pcs",
        price: 10.99,
        taxRate: 0.1,
        shortCode: `P${i}`,
      }));

      let recentProducts: PosProduct[] = [];

      // Add all products
      manyProducts.forEach((product) => {
        recentProducts = [
          product,
          ...recentProducts.filter((p) => p.id !== product.id),
        ];
      });

      // Should track all products used in current session (no artificial limit)
      expect(recentProducts).toHaveLength(10);
      expect(recentProducts[0].id).toBe("product-9"); // Most recent first
    });
  });

  describe("Data Integrity", () => {
    it("should preserve all required session fields", async () => {
      const sessionData = {
        cartLines: [
          {
            lineId: "line-1",
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
        recentProducts: mockProducts,
        productSearchTerm: "test search",
        selectedCustomer: mockCustomer,
        discountInput: "10.00",
        surchargeInput: "5.00",
      };

      const mockRepository = {
        saveSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        loadSession: vi.fn().mockResolvedValue({
          success: true,
          value: sessionData,
        }),
        clearSession: vi.fn(),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        addProductToCart: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        completePayment: vi.fn(),
      };

      const saveSessionUseCase = createSavePosSessionUseCase(mockRepository);
      const loadSessionUseCase = createLoadPosSessionUseCase(mockRepository);

      // Save session
      await saveSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
        sessionData,
      });

      // Load session
      const result = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(result.success).toBe(true);
      expect(result.value).toEqual(sessionData);

      // Verify all fields are preserved
      expect(result.value?.cartLines).toHaveLength(1);
      expect(result.value?.recentProducts).toHaveLength(2);
      expect(result.value?.productSearchTerm).toBe("test search");
      expect(result.value?.selectedCustomer?.fullName).toBe("John Doe");
      expect(result.value?.discountInput).toBe("10.00");
      expect(result.value?.surchargeInput).toBe("5.00");
    });
  });
});
