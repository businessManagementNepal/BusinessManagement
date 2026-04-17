import {
  ProductKind,
  ProductStatus,
} from "@/feature/products/types/product.types";
import { SaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase";
import React, { useCallback, useMemo } from "react";
import { POS_DEFAULT_QUICK_PRODUCT_PRICE_INPUT } from "../types/pos.constant";
import type { PosProduct } from "../types/pos.entity.types";
import type { PosScreenCoordinatorState } from "../types/pos.state.types";
import { AddProductToCartUseCase } from "../useCase/addProductToCart.useCase";
import { SearchPosProductsUseCase } from "../useCase/searchPosProducts.useCase";
import {
  buildNextRecentProducts,
  calculateTotals,
  parseAmountInput,
  type PosSessionStateOverrides,
} from "./internal/posScreen.shared";
import type { PosCatalogViewModel } from "./posCatalog.viewModel";

interface UsePosCatalogViewModelParams {
  state: PosScreenCoordinatorState;
  setState: React.Dispatch<React.SetStateAction<PosScreenCoordinatorState>>;
  activeBusinessAccountRemoteId: string | null;
  defaultTaxRateLabel: string;
  searchPosProductsUseCase: SearchPosProductsUseCase;
  addProductToCartUseCase: AddProductToCartUseCase;
  saveProductUseCase: SaveProductUseCase;
  saveCurrentSession: (
    overrides?: PosSessionStateOverrides,
  ) => Promise<void>;
}

export function usePosCatalogViewModel({
  state,
  setState,
  activeBusinessAccountRemoteId,
  defaultTaxRateLabel,
  searchPosProductsUseCase,
  addProductToCartUseCase,
  saveProductUseCase,
  saveCurrentSession,
}: UsePosCatalogViewModelParams): PosCatalogViewModel {
  const onProductSearchChange = useCallback(
    async (value: string) => {
      const products = await searchPosProductsUseCase.execute(value);
      setState((currentState) => ({
        ...currentState,
        productSearchTerm: value,
        filteredProducts: products,
      }));

      await saveCurrentSession({
        productSearchTerm: value,
      });
    },
    [saveCurrentSession, searchPosProductsUseCase, setState],
  );

  const onAddProductToCart = useCallback(
    async (productId: string) => {
      const product = state.products.find((item) => item.id === productId);
      if (!product) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: "Product not found.",
        }));
        return;
      }

      const result = await addProductToCartUseCase.execute({ productId });
      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
        return;
      }

      const nextRecentProducts = buildNextRecentProducts(
        state.recentProducts,
        product,
      );

      setState((currentState) => ({
        ...currentState,
        cartLines: result.value,
        totals: calculateTotals(
          result.value,
          parseAmountInput(currentState.discountInput),
          parseAmountInput(currentState.surchargeInput),
        ),
        recentProducts: nextRecentProducts,
        errorMessage: null,
      }));

      await saveCurrentSession({
        cartLines: result.value,
        recentProducts: nextRecentProducts,
      });
    },
    [addProductToCartUseCase, saveCurrentSession, setState, state.products, state.recentProducts],
  );

  const onOpenCreateProductModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "create-product",
      quickProductNameInput: "",
      quickProductPriceInput: POS_DEFAULT_QUICK_PRODUCT_PRICE_INPUT,
      quickProductCategoryInput: "",
      errorMessage: null,
      infoMessage: null,
    }));
  }, [setState]);

  const onCloseCreateProductModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      quickProductNameInput: "",
      quickProductPriceInput: POS_DEFAULT_QUICK_PRODUCT_PRICE_INPUT,
      quickProductCategoryInput: "",
      errorMessage: null,
    }));
  }, [setState]);

  const onQuickProductNameInputChange = useCallback(
    (value: string) => {
      setState((currentState) => ({
        ...currentState,
        quickProductNameInput: value,
        errorMessage: null,
      }));
    },
    [setState],
  );

  const onQuickProductPriceInputChange = useCallback(
    (value: string) => {
      setState((currentState) => ({
        ...currentState,
        quickProductPriceInput: value,
        errorMessage: null,
      }));
    },
    [setState],
  );

  const onQuickProductCategoryInputChange = useCallback(
    (value: string) => {
      setState((currentState) => ({
        ...currentState,
        quickProductCategoryInput: value,
        errorMessage: null,
      }));
    },
    [setState],
  );

  const onCreateProductFromPos = useCallback(async () => {
    const normalizedName = state.quickProductNameInput.trim();
    const normalizedPrice = state.quickProductPriceInput.trim();
    const parsedPrice = parseAmountInput(normalizedPrice);

    if (!normalizedName) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Product name is required.",
      }));
      return;
    }

    if (parsedPrice < 0) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Enter a valid sale price (0 or higher).",
      }));
      return;
    }

    if (!activeBusinessAccountRemoteId) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Business context is required for product creation.",
      }));
      return;
    }

    const saveResult = await saveProductUseCase.execute({
      remoteId: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      accountRemoteId: activeBusinessAccountRemoteId,
      name: normalizedName,
      kind: ProductKind.Item,
      categoryName: state.quickProductCategoryInput.trim() || null,
      salePrice: parsedPrice,
      costPrice: null,
      stockQuantity: 0,
      unitLabel: "pcs",
      skuOrBarcode: null,
      taxRateLabel: defaultTaxRateLabel,
      description: null,
      imageUrl: null,
      status: ProductStatus.Active,
    });

    if (!saveResult.success) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: saveResult.error.message,
      }));
      return;
    }

    const addResult = await addProductToCartUseCase.execute({
      productId: saveResult.value.remoteId,
    });
    if (!addResult.success) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: addResult.error.message,
      }));
      return;
    }

    const refreshedProducts = await searchPosProductsUseCase.execute(
      state.productSearchTerm,
    );
    const createdProduct: PosProduct = {
      id: saveResult.value.remoteId,
      name: saveResult.value.name,
      categoryLabel: saveResult.value.categoryName ?? "General",
      unitLabel: saveResult.value.unitLabel ?? null,
      price: saveResult.value.salePrice,
      taxRate: 0,
      shortCode: saveResult.value.name.trim().slice(0, 1).toUpperCase() || "P",
    };
    const nextRecentProducts = buildNextRecentProducts(
      state.recentProducts,
      createdProduct,
    );

    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      quickProductNameInput: "",
      quickProductPriceInput: POS_DEFAULT_QUICK_PRODUCT_PRICE_INPUT,
      quickProductCategoryInput: "",
      products: refreshedProducts,
      filteredProducts: refreshedProducts,
      cartLines: addResult.value,
      totals: calculateTotals(
        addResult.value,
        parseAmountInput(currentState.discountInput),
        parseAmountInput(currentState.surchargeInput),
      ),
      recentProducts: nextRecentProducts,
      errorMessage: null,
      infoMessage: `Product "${normalizedName}" created and added to cart successfully.`,
    }));

    await saveCurrentSession({
      cartLines: addResult.value,
      recentProducts: nextRecentProducts,
    });
  }, [
    activeBusinessAccountRemoteId,
    addProductToCartUseCase,
    defaultTaxRateLabel,
    saveCurrentSession,
    saveProductUseCase,
    searchPosProductsUseCase,
    setState,
    state.productSearchTerm,
    state.quickProductCategoryInput,
    state.quickProductNameInput,
    state.quickProductPriceInput,
    state.recentProducts,
  ]);

  return useMemo(
    () => ({
      products: state.filteredProducts,
      filteredProducts: state.filteredProducts,
      recentProducts: state.recentProducts,
      productSearchTerm: state.productSearchTerm,
      quickProductNameInput: state.quickProductNameInput,
      quickProductPriceInput: state.quickProductPriceInput,
      quickProductCategoryInput: state.quickProductCategoryInput,
      isCreateProductModalVisible: state.activeModal === "create-product",
      onProductSearchChange,
      onAddProductToCart,
      onOpenCreateProductModal,
      onCloseCreateProductModal,
      onQuickProductNameInputChange,
      onQuickProductPriceInputChange,
      onQuickProductCategoryInputChange,
      onCreateProductFromPos,
    }),
    [
      onAddProductToCart,
      onCloseCreateProductModal,
      onCreateProductFromPos,
      onOpenCreateProductModal,
      onProductSearchChange,
      onQuickProductCategoryInputChange,
      onQuickProductNameInputChange,
      onQuickProductPriceInputChange,
      state.activeModal,
      state.filteredProducts,
      state.productSearchTerm,
      state.quickProductCategoryInput,
      state.quickProductNameInput,
      state.quickProductPriceInput,
      state.recentProducts,
    ],
  );
}
