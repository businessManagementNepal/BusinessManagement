import { PosCustomer, PosProduct } from "@/feature/pos/types/pos.entity.types";
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

const mockCartLines = [
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
];

describe("POS Session Persistence", () => {
  describe("Session Saving", () => {
    it("should save session data successfully", async () => {
      const mockRepository = {
        saveSession: vi.fn().mockResolvedValue({
          success: true,
          value: true,
        }),
        loadSession: vi.fn(),
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
        printReceipt: vi.fn(),
      };

      const saveSessionUseCase = createSavePosSessionUseCase(mockRepository);
      const result = await saveSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
        sessionData: {
          cartLines: mockCartLines,
          recentProducts: mockProducts,
          productSearchTerm: "test",
          selectedCustomer: mockCustomer,
          discountInput: "5.00",
          surchargeInput: "2.50",
        },
      });

      expect(result.success).toBe(true);
      expect(mockRepository.saveSession).toHaveBeenCalledWith({
        businessAccountRemoteId: "account-1",
        sessionData: {
          cartLines: mockCartLines,
          recentProducts: mockProducts,
          productSearchTerm: "test",
          selectedCustomer: mockCustomer,
          discountInput: "5.00",
          surchargeInput: "2.50",
        },
      });
    });

    it("should handle save session errors", async () => {
      const mockRepository = {
        saveSession: vi.fn().mockResolvedValue({
          success: false,
          error: {
            type: "validation",
            message: "Failed to save session",
          },
        }),
        loadSession: vi.fn(),
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
        printReceipt: vi.fn(),
      };

      const saveSessionUseCase = createSavePosSessionUseCase(mockRepository);
      const result = await saveSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
        sessionData: {
          cartLines: [],
          recentProducts: [],
          productSearchTerm: "",
          selectedCustomer: null,
          discountInput: "",
          surchargeInput: "",
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.message).toBe("Failed to save session");
      }
    });
  });

  describe("Session Loading", () => {
    it("should load session data successfully", async () => {
      const mockRepository = {
        loadSession: vi.fn().mockResolvedValue({
          success: true,
          value: {
            cartLines: mockCartLines,
            recentProducts: mockProducts,
            productSearchTerm: "test",
            selectedCustomer: mockCustomer,
            discountInput: "5.00",
            surchargeInput: "2.50",
          },
        }),
        saveSession: vi.fn(),
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
        printReceipt: vi.fn(),
      };

      const loadSessionUseCase = createLoadPosSessionUseCase(mockRepository);
      const result = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        cartLines: mockCartLines,
        recentProducts: mockProducts,
        productSearchTerm: "test",
        selectedCustomer: mockCustomer,
        discountInput: "5.00",
        surchargeInput: "2.50",
      });
      expect(mockRepository.loadSession).toHaveBeenCalledWith({
        businessAccountRemoteId: "account-1",
      });
    });

    it("should handle no existing session", async () => {
      const mockRepository = {
        loadSession: vi.fn().mockResolvedValue({
          success: false,
          error: {
            type: "validation",
            message: "No session found",
          },
        }),
        saveSession: vi.fn(),
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
        printReceipt: vi.fn(),
      };

      const loadSessionUseCase = createLoadPosSessionUseCase(mockRepository);
      const result = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.message).toBe("No session found");
      }
    });

    it("should handle load session errors", async () => {
      const mockRepository = {
        loadSession: vi.fn().mockResolvedValue({
          success: false,
          error: {
            type: "unknown",
            message: "Database error",
          },
        }),
        saveSession: vi.fn(),
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
        printReceipt: vi.fn(),
      };

      const loadSessionUseCase = createLoadPosSessionUseCase(mockRepository);
      const result = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.message).toBe("Database error");
      }
    });
  });

  describe("Session Clearing", () => {
    it("should clear session data successfully", async () => {
      const mockRepository = {
        clearSession: vi.fn().mockResolvedValue({
          success: true,
          value: true,
        }),
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
        printReceipt: vi.fn(),
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

    it("should handle clear session errors", async () => {
      const mockRepository = {
        clearSession: vi.fn().mockResolvedValue({
          success: false,
          error: {
            type: "validation",
            message: "Failed to clear session",
          },
        }),
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
        printReceipt: vi.fn(),
      };

      const clearSessionUseCase = createClearPosSessionUseCase(mockRepository);
      const result = await clearSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.message).toBe("Failed to clear session");
      }
    });
  });

  describe("Session Lifecycle", () => {
    it("should maintain session data across save/load cycle", async () => {
      const mockRepository = {
        saveSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        loadSession: vi.fn().mockResolvedValue({
          success: true,
          value: {
            cartLines: mockCartLines,
            recentProducts: mockProducts,
            productSearchTerm: "test",
            selectedCustomer: mockCustomer,
            discountInput: "5.00",
            surchargeInput: "2.50",
          },
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
        printReceipt: vi.fn(),
      };

      const saveSessionUseCase = createSavePosSessionUseCase(mockRepository);
      const loadSessionUseCase = createLoadPosSessionUseCase(mockRepository);

      // Save session
      const saveResult = await saveSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
        sessionData: {
          cartLines: mockCartLines,
          recentProducts: mockProducts,
          productSearchTerm: "test",
          selectedCustomer: mockCustomer,
          discountInput: "5.00",
          surchargeInput: "2.50",
        },
      });

      expect(saveResult.success).toBe(true);

      // Load session
      const loadResult = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(loadResult.success).toBe(true);
      expect(loadResult.value).toEqual({
        cartLines: mockCartLines,
        recentProducts: mockProducts,
        productSearchTerm: "test",
        selectedCustomer: mockCustomer,
        discountInput: "5.00",
        surchargeInput: "2.50",
      });
    });

    it("should handle account switching correctly", async () => {
      const mockRepository = {
        saveSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        loadSession: vi.fn().mockImplementation((params) => {
          if (params.businessAccountRemoteId === "account-1") {
            return Promise.resolve({
              success: true,
              value: {
                cartLines: mockCartLines,
                recentProducts: mockProducts,
                productSearchTerm: "test",
                selectedCustomer: mockCustomer,
                discountInput: "5.00",
                surchargeInput: "2.50",
              },
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
        printReceipt: vi.fn(),
      };

      const loadSessionUseCase = createLoadPosSessionUseCase(mockRepository);

      // Load session for account-1 (should find data)
      const result1 = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });
      expect(result1.success).toBe(true);
      expect(result1.value?.cartLines).toEqual(mockCartLines);

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

  describe("Session Data Integrity", () => {
    it("should preserve all required fields in session", async () => {
      const sessionData = {
        cartLines: mockCartLines,
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
        printReceipt: vi.fn(),
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

    it("should handle empty session data", async () => {
      const emptySessionData = {
        cartLines: [],
        recentProducts: [],
        productSearchTerm: "",
        selectedCustomer: null,
        discountInput: "",
        surchargeInput: "",
      };

      const mockRepository = {
        saveSession: vi.fn().mockResolvedValue({ success: true, value: true }),
        loadSession: vi.fn().mockResolvedValue({
          success: true,
          value: emptySessionData,
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
        printReceipt: vi.fn(),
      };

      const saveSessionUseCase = createSavePosSessionUseCase(mockRepository);
      const loadSessionUseCase = createLoadPosSessionUseCase(mockRepository);

      // Save empty session
      await saveSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
        sessionData: emptySessionData,
      });

      // Load empty session
      const result = await loadSessionUseCase.execute({
        businessAccountRemoteId: "account-1",
      });

      expect(result.success).toBe(true);
      expect(result.value?.cartLines).toHaveLength(0);
      expect(result.value?.recentProducts).toHaveLength(0);
      expect(result.value?.productSearchTerm).toBe("");
      expect(result.value?.selectedCustomer).toBeNull();
      expect(result.value?.discountInput).toBe("");
      expect(result.value?.surchargeInput).toBe("");
    });
  });
});
