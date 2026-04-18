import { PosProduct } from "@/feature/pos/types/pos.entity.types";
import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import { createLocalPosDatasource } from "@/feature/pos/data/dataSource/local.pos.datasource.impl";
import { ProductModel } from "@/feature/products/data/dataSource/db/product.model";
import type { Database } from "@nozbe/watermelondb";
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
  const createProductModel = (params: {
    remoteId: string;
    name: string;
    kind: "item" | "service";
    stockQuantity: number | null;
    salePrice?: number;
    accountRemoteId?: string;
  }): ProductModel =>
    ({
      remoteId: params.remoteId,
      accountRemoteId: params.accountRemoteId ?? "account-1",
      name: params.name,
      kind: params.kind,
      categoryName: "General",
      salePrice: params.salePrice ?? 10,
      stockQuantity: params.stockQuantity,
      unitLabel: "pcs",
      taxRateLabel: "0%",
      status: "active",
      deletedAt: null,
    }) as unknown as ProductModel;

  type WhereClause = {
    type: "where";
    left: string;
    comparison: {
      operator: string;
      right?: {
        value?: unknown;
        values?: unknown[];
      };
    };
  };

  const isWhereClause = (clause: unknown): clause is WhereClause =>
    typeof clause === "object" &&
    clause !== null &&
    "type" in clause &&
    (clause as { type?: string }).type === "where" &&
    "left" in clause;

  const createMockDatabase = (seedProducts: ProductModel[]): Database => {
    const productCollection = {
      query: (...clauses: unknown[]) => ({
        fetch: async () => {
          let filtered = [...seedProducts];

          for (const clause of clauses) {
            if (!isWhereClause(clause)) {
              continue;
            }

            const rightValue = clause.comparison.right?.value;
            if (clause.left === "remote_id" && typeof rightValue === "string") {
              filtered = filtered.filter((product) => product.remoteId === rightValue);
            }
            if (clause.left === "account_remote_id" && typeof rightValue === "string") {
              filtered = filtered.filter(
                (product) => product.accountRemoteId === rightValue,
              );
            }
            if (clause.left === "status" && typeof rightValue === "string") {
              filtered = filtered.filter((product) => product.status === rightValue);
            }
            if (clause.left === "deleted_at" && rightValue === null) {
              filtered = filtered.filter((product) => product.deletedAt === null);
            }
          }

          return filtered;
        },
      }),
    };

    return {
      get: vi.fn((table: string) => {
        if (table === "products") {
          return productCollection;
        }
        throw new Error(`Unexpected table lookup: ${table}`);
      }),
      adapter: {
        setLocal: vi.fn(),
        getLocal: vi.fn(),
        removeLocal: vi.fn(),
      },
      write: vi.fn(async (action: () => Promise<unknown>) => action()),
      read: vi.fn(async (action: () => Promise<unknown>) => action()),
    } as unknown as Database;
  };

  const createBootstrappedDatasource = async (
    seedProducts: ProductModel[],
  ) => {
    const database = createMockDatabase(seedProducts);
    const datasource = createLocalPosDatasource({ database });

    const bootstrapResult = await datasource.loadBootstrap({
      activeBusinessAccountRemoteId: "account-1",
      activeOwnerUserRemoteId: "owner-1",
      activeSettlementAccountRemoteId: "settlement-1",
    });

    expect(bootstrapResult.success).toBe(true);
    return datasource;
  };

  describe("Direct Cart-Add Path", () => {
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
        commitSaleInventoryMutations: vi.fn(),
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
        commitSaleInventoryMutations: vi.fn(),
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
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        commitSaleInventoryMutations: vi.fn(),
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
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        commitSaleInventoryMutations: vi.fn(),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        clearSession: vi.fn(),
      };

      const useCase = createAddProductToCartUseCase(mockRepository);
      await useCase.execute({ productId: "product-1" });

      // Verify only the direct add method was called
      expect(mockRepository.addProductToCart).toHaveBeenCalledTimes(1);
      expect(mockRepository.addProductToCart).toHaveBeenCalledWith({
        productId: "product-1",
      });
    });

    it("should block adding an out-of-stock item product", async () => {
      const mockRepository = {
        addProductToCart: vi.fn().mockResolvedValue({
          success: false,
          error: {
            type: PosErrorType.OutOfStock,
            message: "Widget is out of stock.",
          },
        }),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        commitSaleInventoryMutations: vi.fn(),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        clearSession: vi.fn(),
      };

      const useCase = createAddProductToCartUseCase(mockRepository);
      const result = await useCase.execute({ productId: "out-of-stock-product" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe(PosErrorType.OutOfStock);
        expect(result.error.message).toContain("out of stock");
      }
    });

    it("should block incrementing a cart line past available stock", async () => {
      const mockRepository = {
        addProductToCart: vi.fn().mockResolvedValue({
          success: false,
          error: {
            type: PosErrorType.OutOfStock,
            message: "Only 2 unit(s) of Widget available. You already have 2 in your cart.",
          },
        }),
        loadBootstrap: vi.fn(),
        searchProducts: vi.fn(),
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        commitSaleInventoryMutations: vi.fn(),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        clearSession: vi.fn(),
      };

      const useCase = createAddProductToCartUseCase(mockRepository);
      const result = await useCase.execute({ productId: "low-stock-product" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe(PosErrorType.OutOfStock);
      }
    });

    it("should allow adding a service product regardless of stock", async () => {
      const mockRepository = {
        addProductToCart: vi.fn().mockResolvedValue({
          success: true,
          value: [
            {
              lineId: "line-1",
              productId: "service-product-1",
              productName: "Consultation",
              categoryLabel: "Services",
              shortCode: "CO",
              quantity: 1,
              unitPrice: 50.0,
              taxRate: 0,
              lineSubtotal: 50.0,
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
        commitSaleInventoryMutations: vi.fn(),
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        clearSession: vi.fn(),
      };

      const useCase = createAddProductToCartUseCase(mockRepository);
      const result = await useCase.execute({ productId: "service-product-1" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value[0].productId).toBe("service-product-1");
      }
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
      expect(newRecent[7].id).toBe("product-6"); // Last item should be the oldest
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
        changeCartLineQuantity: vi.fn(),
        applyDiscount: vi.fn(),
        applySurcharge: vi.fn(),
        clearCart: vi.fn(),
        getCartLines: vi.fn(),
        getTotals: vi.fn(),
        commitSaleInventoryMutations: vi.fn(),
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

  describe("Cart Quantity Stock Enforcement", () => {
    it("should fail when incrementing an item beyond stock", async () => {
      const datasource = await createBootstrappedDatasource([
        createProductModel({
          remoteId: "item-1",
          name: "Widget",
          kind: "item",
          stockQuantity: 1,
        }),
      ]);

      const addResult = await datasource.addProductToCart({ productId: "item-1" });
      expect(addResult.success).toBe(true);
      if (!addResult.success) {
        return;
      }

      const changeResult = await datasource.changeCartLineQuantity({
        lineId: addResult.value[0].lineId,
        nextQuantity: 2,
      });

      expect(changeResult.success).toBe(false);
      if (!changeResult.success) {
        expect(changeResult.error.type).toBe(PosErrorType.OutOfStock);
      }
    });

    it("should allow incrementing an item within stock", async () => {
      const datasource = await createBootstrappedDatasource([
        createProductModel({
          remoteId: "item-2",
          name: "Bottle",
          kind: "item",
          stockQuantity: 3,
        }),
      ]);

      const addResult = await datasource.addProductToCart({ productId: "item-2" });
      expect(addResult.success).toBe(true);
      if (!addResult.success) {
        return;
      }

      const changeResult = await datasource.changeCartLineQuantity({
        lineId: addResult.value[0].lineId,
        nextQuantity: 2,
      });

      expect(changeResult.success).toBe(true);
      if (changeResult.success) {
        expect(changeResult.value[0].quantity).toBe(2);
      }
    });

    it("should allow incrementing a service product", async () => {
      const datasource = await createBootstrappedDatasource([
        createProductModel({
          remoteId: "service-1",
          name: "Consultation",
          kind: "service",
          stockQuantity: 0,
          salePrice: 50,
        }),
      ]);

      const addResult = await datasource.addProductToCart({
        productId: "service-1",
      });
      expect(addResult.success).toBe(true);
      if (!addResult.success) {
        return;
      }

      const changeResult = await datasource.changeCartLineQuantity({
        lineId: addResult.value[0].lineId,
        nextQuantity: 5,
      });

      expect(changeResult.success).toBe(true);
      if (changeResult.success) {
        expect(changeResult.value[0].quantity).toBe(5);
      }
    });

    it("should remove a line when quantity is changed to zero", async () => {
      const datasource = await createBootstrappedDatasource([
        createProductModel({
          remoteId: "item-3",
          name: "Notebook",
          kind: "item",
          stockQuantity: 10,
        }),
      ]);

      const addResult = await datasource.addProductToCart({ productId: "item-3" });
      expect(addResult.success).toBe(true);
      if (!addResult.success) {
        return;
      }

      const changeResult = await datasource.changeCartLineQuantity({
        lineId: addResult.value[0].lineId,
        nextQuantity: 0,
      });

      expect(changeResult.success).toBe(true);
      if (changeResult.success) {
        expect(changeResult.value).toHaveLength(0);
      }
    });
  });

  describe("Cart Totals Calculation", () => {
    it("should calculate correct totals for cart items", () => {
      const cartLines = [
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
        {
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
