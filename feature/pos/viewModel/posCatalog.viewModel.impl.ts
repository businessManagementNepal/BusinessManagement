import {
    ProductKind,
    ProductStatus,
} from "@/feature/products/types/product.types";
import { SaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { POS_DEFAULT_QUICK_PRODUCT_PRICE_INPUT } from "../types/pos.constant";
import type { PosProduct } from "../types/pos.entity.types";
import type { PosQuickProductFieldErrors, PosScreenCoordinatorState } from "../types/pos.state.types";
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
  const productSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productSearchRequestIdRef = useRef(0);

  const validatePosQuickProductForm = ({
    name,
    salePrice,
  }: {
    name: string;
    salePrice: string;
  }): PosQuickProductFieldErrors => {
    const nextFieldErrors: PosQuickProductFieldErrors = {};
    const normalizedName = name.trim();
    const normalizedSalePrice = salePrice.trim();

    if (!normalizedName) {
      nextFieldErrors.name = "Product name is required.";
    }

    if (normalizedSalePrice.length > 0) {
      const parsedSalePrice = Number(normalizedSalePrice.replace(/,/g, ""));
      if (!Number.isFinite(parsedSalePrice)) {
        nextFieldErrors.salePrice = "Sale price must be a valid number.";
      } else if (parsedSalePrice < 0) {
        nextFieldErrors.salePrice = "Sale price cannot be negative.";
      }
    }

    return nextFieldErrors;
  };

  const onProductSearchChange = useCallback(
    async (value: string) => {
      const normalizedValue = value.trim();
      setState((currentState) => ({
        ...currentState,
        productSearchTerm: value,
        filteredProducts:
          normalizedValue === "" ? [] : currentState.filteredProducts,
        errorMessage: null,
      }));

      if (productSearchDebounceRef.current) {
        clearTimeout(productSearchDebounceRef.current);
      }

      const requestId = ++productSearchRequestIdRef.current;

      productSearchDebounceRef.current = setTimeout(() => {
        void (async () => {
          if (value.trim() === "") {
            await saveCurrentSession({
              productSearchTerm: value,
            });
            return;
          }

          const products = await searchPosProductsUseCase.execute(value);
          if (requestId !== productSearchRequestIdRef.current) {
            return;
          }

          setState((currentState) => ({
            ...currentState,
            filteredProducts: products,
          }));

          await saveCurrentSession({
            productSearchTerm: value,
          });
        })();
      }, 250);
    },
    [saveCurrentSession, searchPosProductsUseCase, setState],
  );

  useEffect(() => {
    return () => {
      if (productSearchDebounceRef.current) {
        clearTimeout(productSearchDebounceRef.current);
      }
    };
  }, []);

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
      quickProductFieldErrors: {},
      errorMessage: null,
    }));
  }, [setState]);

  const onQuickProductNameInputChange = useCallback(
    (value: string) => {
      setState((currentState) => ({
        ...currentState,
        quickProductNameInput: value,
        quickProductFieldErrors: {
          ...currentState.quickProductFieldErrors,
          name: undefined,
        },
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
        quickProductFieldErrors: {
          ...currentState.quickProductFieldErrors,
          salePrice: undefined,
        },
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
    const nextFieldErrors = validatePosQuickProductForm({
      name: state.quickProductNameInput,
      salePrice: state.quickProductPriceInput,
    });

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setState((currentState) => ({
        ...currentState,
        quickProductFieldErrors: nextFieldErrors,
        errorMessage: null,
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

    const normalizedName = state.quickProductNameInput.trim();
    const normalizedPrice = state.quickProductPriceInput.trim();
    const parsedPrice = parseAmountInput(normalizedPrice);

    const saveResult = await saveProductUseCase.execute({
      remoteId: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      accountRemoteId: activeBusinessAccountRemoteId,
      name: normalizedName,
      kind: ProductKind.Item,
      categoryName: state.quickProductCategoryInput.trim() || null,
      salePrice: parsedPrice,
      costPrice: null,
      stockQuantity: 1,
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
      quickProductFieldErrors: {},
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
      filteredProducts: state.filteredProducts,
      recentProducts: state.recentProducts,
      productSearchTerm: state.productSearchTerm,
      quickProductNameInput: state.quickProductNameInput,
      quickProductPriceInput: state.quickProductPriceInput,
      quickProductCategoryInput: state.quickProductCategoryInput,
      quickProductFieldErrors: state.quickProductFieldErrors,
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
