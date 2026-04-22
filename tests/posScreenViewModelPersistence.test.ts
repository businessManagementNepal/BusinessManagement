/** @vitest-environment jsdom */

import type {
  PosCartLine,
  PosCustomer,
  PosProduct,
} from "@/feature/pos/types/pos.entity.types";
import { ProductKind } from "@/feature/products/types/product.types";
import type { PosScreenCoordinatorViewModel } from "@/feature/pos/viewModel/posScreenCoordinator.viewModel";
import { usePosScreenCoordinatorViewModel } from "@/feature/pos/viewModel/posScreenCoordinator.viewModel.impl";
import React, { useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockProduct: PosProduct = {
  id: "product-1",
  name: "Test Product",
  categoryLabel: "General",
  unitLabel: "pcs",
  kind: ProductKind.Item,
  price: 10,
  taxRate: 0,
  shortCode: "T",
};

const mockCartLine: PosCartLine = {
  lineId: "line-1",
  productId: mockProduct.id,
  productName: mockProduct.name,
  categoryLabel: mockProduct.categoryLabel,
  shortCode: mockProduct.shortCode,
  kind: ProductKind.Item,
  quantity: 1,
  unitPrice: mockProduct.price,
  taxRate: mockProduct.taxRate,
  lineSubtotal: mockProduct.price,
};

const mockCustomer: PosCustomer = {
  remoteId: "customer-1",
  fullName: "John Doe",
  phone: "+1234567890",
  address: "123 Main St",
};

const createMockUseCase = <TResult extends unknown>(result: TResult) => ({
  execute: vi.fn().mockResolvedValue(result),
});

const createMockPosViewModelParams = (
  overrides: Partial<Record<string, any>> = {},
) => {
  const defaultParams = {
    activeBusinessAccountRemoteId: "business-1",
    activeOwnerUserRemoteId: "owner-1",
    activeSettlementAccountRemoteId: "settlement-1",
    activeAccountCurrencyCode: "USD",
    activeAccountCountryCode: "US",
    activeAccountDefaultTaxRatePercent: 0,
    activeAccountDefaultTaxMode: "exclusive",
    getPosBootstrapUseCase: createMockUseCase({
      success: true,
      value: {
        products: [mockProduct],
        activeBusinessAccountRemoteId: "business-1",
        activeOwnerUserRemoteId: "owner-1",
        activeSettlementAccountRemoteId: "settlement-1",
      },
    }),
    searchPosProductsUseCase: {
      execute: vi.fn().mockResolvedValue([mockProduct]),
    },
    addProductToCartUseCase: createMockUseCase({
      success: true,
      value: [mockCartLine],
    }),
    changeCartLineQuantityUseCase: createMockUseCase({
      success: true,
      value: [mockCartLine],
    }),
    applyDiscountUseCase: createMockUseCase({ success: true, value: null }),
    applySurchargeUseCase: createMockUseCase({ success: true, value: null }),
    getOrCreateBusinessContactUseCase: createMockUseCase({
      success: true,
      value: {
        remoteId: mockCustomer.remoteId,
        fullName: mockCustomer.fullName,
        phoneNumber: mockCustomer.phone,
        address: mockCustomer.address,
      },
    }),
    getContactsUseCase: createMockUseCase([]),
    clearCartUseCase: createMockUseCase({ success: true, value: [] }),
    completePosCheckoutUseCase: createMockUseCase({
      success: true,
      value: null,
    }),
    getMoneyAccountsUseCase: createMockUseCase({
      success: true,
      value: [
        {
          remoteId: "money-1",
          ownerUserRemoteId: "owner-1",
          scopeAccountRemoteId: "business-1",
          name: "Cash",
          type: "cash",
          currentBalance: 0,
          description: null,
          currencyCode: "USD",
          isPrimary: true,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    }),
    printPosReceiptUseCase: createMockUseCase({ success: true, value: null }),
    sharePosReceiptUseCase: createMockUseCase({ success: true, value: null }),
    saveProductUseCase: createMockUseCase({
      success: true,
      value: {
        remoteId: "product-1",
        accountRemoteId: "business-1",
        name: "Test Product",
        kind: "item",
        categoryName: "General",
        salePrice: 10,
        costPrice: null,
        stockQuantity: 0,
        unitLabel: "pcs",
        skuOrBarcode: null,
        taxRateLabel: null,
        description: null,
        imageUrl: null,
        status: "active",
        createdAt: 1,
        updatedAt: 1,
      },
    }),
    createProductWithOpeningStockUseCase: createMockUseCase({
      success: true,
      value: {
        remoteId: "product-1",
        accountRemoteId: "business-1",
        name: "Test Product",
        kind: "item",
        categoryName: "General",
        salePrice: 10,
        costPrice: null,
        stockQuantity: 5,
        unitLabel: "pcs",
        skuOrBarcode: null,
        taxRateLabel: null,
        description: null,
        imageUrl: null,
        status: "active",
        createdAt: 1,
        updatedAt: 1,
      },
    }),
    savePosSessionUseCase: {
      execute: vi.fn().mockResolvedValue({ success: true, value: true }),
    },
    loadPosSessionUseCase: createMockUseCase({
      success: false,
      error: { type: "not_found", message: "No session found" },
    }),
    clearPosSessionUseCase: createMockUseCase({ success: true, value: true }),
  };

  return { ...defaultParams, ...overrides };
};

function HookHarness({
  params,
  onReady,
}: {
  params: ReturnType<typeof createMockPosViewModelParams>;
  onReady: (viewModel: PosScreenViewModel) => void;
}) {
  const coordinator = usePosScreenCoordinatorViewModel(params as any);
  const viewModel = mapCoordinatorToLegacyViewModel(coordinator);

  useEffect(() => {
    onReady(viewModel);
  }, [viewModel, onReady]);

  return null;
}

const mountViewModel = async (
  params: ReturnType<typeof createMockPosViewModelParams>,
): Promise<{
  viewModel: PosScreenViewModel;
  root: Root;
  container: HTMLDivElement;
}> => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const viewModelRef = { current: null as PosScreenViewModel | null };

  const viewModelProxy = new Proxy(
    {},
    {
      get: (_target, property) => {
        if (!viewModelRef.current) {
          throw new Error("ViewModel not initialized");
        }
        return (viewModelRef.current as any)[property];
      },
    },
  ) as PosScreenViewModel;

  await act(async () => {
    root.render(
      React.createElement(HookHarness, {
        params,
        onReady: (vm: PosScreenViewModel) => {
          viewModelRef.current = vm;
        },
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  if (!viewModelRef.current) {
    throw new Error("ViewModel did not initialize");
  }

  return { viewModel: viewModelProxy, root, container };
};

const expectLastSaveSessionCall = (
  savePosSessionUseCase: any,
  expected: Record<string, any>,
) => {
  const calls = savePosSessionUseCase.execute.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  const lastCall = calls[calls.length - 1][0];
  expect(lastCall.sessionData).toEqual(expect.objectContaining(expected));
};

const activeCustomerSearchableProduct = {
  ...mockProduct,
  id: "product-1",
};

const mapCoordinatorToLegacyViewModel = (
  coordinator: PosScreenCoordinatorViewModel,
) => ({
  filteredProducts: coordinator.catalog.filteredProducts,
  onProductSearchChange: coordinator.catalog.onProductSearchChange,
  onAddProductToCart: coordinator.catalog.onAddProductToCart,
  onIncreaseQuantity: coordinator.cart.onIncreaseQuantity,
  onDecreaseQuantity: coordinator.cart.onDecreaseQuantity,
  onRemoveCartLine: coordinator.cart.onRemoveCartLine,
  onSettlementAccountChange: coordinator.checkout.onSettlementAccountChange,
  onSelectCustomer: coordinator.customer.onSelectCustomer,
  onClearCustomer: coordinator.customer.onClearCustomer,
  onQuickProductNameInputChange: coordinator.catalog.onQuickProductNameInputChange,
  onQuickProductPriceInputChange: coordinator.catalog.onQuickProductPriceInputChange,
  onQuickProductCategoryInputChange: coordinator.catalog.onQuickProductCategoryInputChange,
  onCreateProductFromPos: coordinator.catalog.onCreateProductFromPos,
  onCustomerCreateFormChange: coordinator.customer.onCustomerCreateFormChange,
  onCreateCustomer: coordinator.customer.onCreateCustomer,
});

type PosScreenViewModel = ReturnType<typeof mapCoordinatorToLegacyViewModel>;

describe("PosScreenViewModel session persistence", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists newest cart line immediately when adding to cart", async () => {
    const params = createMockPosViewModelParams();
    const { viewModel, root, container } = await mountViewModel(params);

    await act(async () => {
      await viewModel.onAddProductToCart(mockProduct.id);
    });

    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      cartLines: [mockCartLine],
      recentProducts: [mockProduct],
    });

    root.unmount();
    container.remove();
  });

  it("persists newest cart state immediately when increasing quantity", async () => {
    const params = createMockPosViewModelParams({
      changeCartLineQuantityUseCase: createMockUseCase({
        success: true,
        value: [{ ...mockCartLine, quantity: 2, lineSubtotal: 20 }],
      }),
    });
    const { viewModel, root, container } = await mountViewModel(params);

    await act(async () => {
      await viewModel.onAddProductToCart(mockProduct.id);
    });

    await act(async () => {
      await viewModel.onIncreaseQuantity(mockCartLine.lineId);
    });

    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      cartLines: [{ ...mockCartLine, quantity: 2, lineSubtotal: 20 }],
    });

    root.unmount();
    container.remove();
  });

  it("persists newest cart state immediately when decreasing quantity", async () => {
    const params = createMockPosViewModelParams({
      changeCartLineQuantityUseCase: createMockUseCase({
        success: true,
        value: [{ ...mockCartLine, quantity: 1, lineSubtotal: 10 }],
      }),
    });
    const { viewModel, root, container } = await mountViewModel(params);

    await act(async () => {
      await viewModel.onAddProductToCart(mockProduct.id);
    });

    await act(async () => {
      await viewModel.onDecreaseQuantity(mockCartLine.lineId);
    });

    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      cartLines: [{ ...mockCartLine, quantity: 1, lineSubtotal: 10 }],
    });

    root.unmount();
    container.remove();
  });

  it("persists newest cart state immediately when removing a cart line", async () => {
    const params = createMockPosViewModelParams({
      changeCartLineQuantityUseCase: createMockUseCase({
        success: true,
        value: [],
      }),
    });
    const { viewModel, root, container } = await mountViewModel(params);

    await act(async () => {
      await viewModel.onRemoveCartLine(mockCartLine.lineId);
    });

    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      cartLines: [],
    });

    root.unmount();
    container.remove();
  });

  it("persists newest product search term immediately", async () => {
    const params = createMockPosViewModelParams();
    const { viewModel, root, container } = await mountViewModel(params);

    await act(async () => {
      await viewModel.onProductSearchChange("search-term");
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      productSearchTerm: "search-term",
    });

    root.unmount();
    container.remove();
  });

  it("persists newest settlement account selection immediately", async () => {
    const params = createMockPosViewModelParams();
    const { viewModel, root, container } = await mountViewModel(params);

    await act(async () => {
      await viewModel.onSettlementAccountChange("money-1");
    });

    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      selectedSettlementAccountRemoteId: "money-1",
    });

    root.unmount();
    container.remove();
  });

  it("persists newest customer selection and clear immediately", async () => {
    const params = createMockPosViewModelParams();
    const { viewModel, root, container } = await mountViewModel(params);

    await act(async () => {
      await viewModel.onSelectCustomer(mockCustomer);
    });
    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      selectedCustomer: mockCustomer,
    });

    await act(async () => {
      await viewModel.onClearCustomer();
    });
    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      selectedCustomer: null,
    });

    root.unmount();
    container.remove();
  });

  it("persists newest cart and recent state immediately when creating a product from POS", async () => {
    const createProductWithOpeningStockUseCase = createMockUseCase({
      success: true,
      value: {
        remoteId: "new-product-1",
        accountRemoteId: "business-1",
        name: "New Product",
        kind: "item",
        categoryName: "New Category",
        salePrice: 15,
        costPrice: null,
        stockQuantity: 10,
        unitLabel: "pcs",
        skuOrBarcode: null,
        taxRateLabel: null,
        description: null,
        imageUrl: null,
        status: "active",
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const addProductToCartUseCase = createMockUseCase({
      success: true,
      value: [
        {
          ...mockCartLine,
          lineId: "line-2",
          productId: "new-product-1",
          productName: "New Product",
          shortCode: "N",
          kind: ProductKind.Item,
          quantity: 1,
          unitPrice: 15,
          lineSubtotal: 15,
        },
      ],
    });
    const params = createMockPosViewModelParams({
      createProductWithOpeningStockUseCase,
      addProductToCartUseCase,
      searchPosProductsUseCase: {
        execute: vi.fn().mockResolvedValue([]),
      },
    });
    const { viewModel, root, container } = await mountViewModel(params);

    await act(async () => {
      viewModel.onQuickProductNameInputChange("New Product");
      viewModel.onQuickProductPriceInputChange("15");
      viewModel.onQuickProductCategoryInputChange("New Category");
    });

    await act(async () => {
      await viewModel.onCreateProductFromPos();
    });

    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      cartLines: [
        expect.objectContaining({ productId: "new-product-1", quantity: 1 }),
      ],
      recentProducts: [
        expect.objectContaining({ id: "new-product-1", name: "New Product" }),
      ],
    });

    root.unmount();
    container.remove();
  });

  it("persists newest customer after create immediately", async () => {
    const params = createMockPosViewModelParams();
    const { viewModel, root, container } = await mountViewModel(params);

    await act(async () => {
      viewModel.onCustomerCreateFormChange("fullName", mockCustomer.fullName);
      viewModel.onCustomerCreateFormChange("phone", mockCustomer.phone!);
      viewModel.onCustomerCreateFormChange("address", mockCustomer.address!);
    });

    await act(async () => {
      await viewModel.onCreateCustomer();
    });

    expectLastSaveSessionCall(params.savePosSessionUseCase, {
      selectedCustomer: mockCustomer,
    });

    root.unmount();
    container.remove();
  });
});

describe("PosScreenViewModel restored search term behavior", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("restored empty search term -> filteredProducts stays empty", async () => {
    const params = createMockPosViewModelParams({
      loadPosSessionUseCase: createMockUseCase({
        success: true,
        value: {
          cartLines: [],
          recentProducts: [],
          productSearchTerm: "",
          selectedCustomer: null,
          selectedSettlementAccountRemoteId: "",
          discountInput: "",
          surchargeInput: "",
        },
      }),
    });
    const { viewModel, root, container } = await mountViewModel(params);

    // Verify that filteredProducts is empty when search term is empty
    expect(viewModel.filteredProducts).toEqual([]);

    root.unmount();
    container.remove();
  });

  it("restored non-empty search term -> matching results are recomputed and shown", async () => {
    const matchingProduct = {
      ...mockProduct,
      name: "Test Product",
    };
    const params = createMockPosViewModelParams({
      searchPosProductsUseCase: {
        execute: vi.fn().mockResolvedValue([matchingProduct]),
      },
      loadPosSessionUseCase: createMockUseCase({
        success: true,
        value: {
          cartLines: [],
          recentProducts: [],
          productSearchTerm: "Test",
          selectedCustomer: null,
          selectedSettlementAccountRemoteId: "",
          discountInput: "",
          surchargeInput: "",
        },
      }),
    });
    const { viewModel, root, container } = await mountViewModel(params);

    // Verify that search was called with restored term and results are shown
    expect(params.searchPosProductsUseCase.execute).toHaveBeenCalledWith("Test");
    expect(viewModel.filteredProducts).toEqual([matchingProduct]);

    root.unmount();
    container.remove();
  });

  it("restored non-empty search term with zero matches -> filteredProducts stays empty", async () => {
    const params = createMockPosViewModelParams({
      searchPosProductsUseCase: {
        execute: vi.fn().mockResolvedValue([]),
      },
      loadPosSessionUseCase: createMockUseCase({
        success: true,
        value: {
          cartLines: [],
          recentProducts: [],
          productSearchTerm: "NonExistent",
          selectedCustomer: null,
          selectedSettlementAccountRemoteId: "",
          discountInput: "",
          surchargeInput: "",
        },
      }),
    });
    const { viewModel, root, container } = await mountViewModel(params);

    // Verify that search was called but no results found
    expect(params.searchPosProductsUseCase.execute).toHaveBeenCalledWith("NonExistent");
    expect(viewModel.filteredProducts).toEqual([]);

    root.unmount();
    container.remove();
  });

  it("restored search term does not reveal full catalog", async () => {
    const allProducts = [mockProduct, { ...mockProduct, id: "product-2", name: "Other Product" }];
    const matchingProduct = {
      ...mockProduct,
      name: "Test Product",
    };
    const params = createMockPosViewModelParams({
      searchPosProductsUseCase: {
        execute: vi.fn().mockResolvedValue([matchingProduct]),
      },
      loadPosSessionUseCase: createMockUseCase({
        success: true,
        value: {
          cartLines: [],
          recentProducts: [],
          productSearchTerm: "Test",
          selectedCustomer: null,
          selectedSettlementAccountRemoteId: "",
          discountInput: "",
          surchargeInput: "",
        },
      }),
    });
    const { viewModel, root, container } = await mountViewModel(params);

    // Verify that only matching products are shown, not full catalog
    expect(params.searchPosProductsUseCase.execute).toHaveBeenCalledWith("Test");
    expect(viewModel.filteredProducts).toEqual([matchingProduct]);
    expect(viewModel.filteredProducts).not.toEqual(allProducts);

    root.unmount();
    container.remove();
  });
});



