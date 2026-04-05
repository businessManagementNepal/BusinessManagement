import {
    Product,
    PRODUCT_CATEGORY_OPTIONS,
    PRODUCT_TAX_RATE_OPTIONS,
    PRODUCT_UNIT_OPTIONS,
    ProductKind,
    ProductKindValue,
    ProductStatus,
} from "@/feature/products/types/product.types";
import { DeleteProductUseCase } from "@/feature/products/useCase/deleteProduct.useCase";
import { GetProductsUseCase } from "@/feature/products/useCase/getProducts.useCase";
import { SaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductFormState, ProductsViewModel } from "./products.viewModel";
import { resolveCurrencyCode } from "@/shared/utils/currency/accountCurrency";

const EMPTY_FORM: ProductFormState = {
  remoteId: null,
  name: "",
  kind: ProductKind.Item,
  categoryName: "",
  salePrice: "0",
  costPrice: "0",
  stockQuantity: "0",
  unitLabel: "pcs",
  skuOrBarcode: "",
  taxRateLabel: "0%",
  description: "",
  imageUrl: "",
};

const mapProductToForm = (product: Product): ProductFormState => ({
  remoteId: product.remoteId,
  name: product.name,
  kind: product.kind,
  categoryName: product.categoryName ?? "",
  salePrice: String(product.salePrice),
  costPrice: product.costPrice === null ? "" : String(product.costPrice),
  stockQuantity:
    product.stockQuantity === null ? "" : String(product.stockQuantity),
  unitLabel: product.unitLabel ?? "pcs",
  skuOrBarcode: product.skuOrBarcode ?? "",
  taxRateLabel: product.taxRateLabel ?? "0%",
  description: product.description ?? "",
  imageUrl: product.imageUrl ?? "",
});

const parseNumber = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

type Params = {
  accountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canManage: boolean;
  getProductsUseCase: GetProductsUseCase;
  saveProductUseCase: SaveProductUseCase;
  deleteProductUseCase: DeleteProductUseCase;
};

export const useProductsViewModel = ({
  accountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  canManage,
  getProductsUseCase,
  saveProductUseCase,
  deleteProductUseCase,
}: Params): ProductsViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKind, setSelectedKind] = useState<"all" | ProductKindValue>(
    "all",
  );
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const currencyCode = useMemo(
    () =>
      resolveCurrencyCode({
        currencyCode: activeAccountCurrencyCode,
        countryCode: activeAccountCountryCode,
      }),
    [activeAccountCountryCode, activeAccountCurrencyCode],
  );

  const loadProducts = useCallback(async () => {
    if (!accountRemoteId) {
      setProducts([]);
      setErrorMessage("A business account is required to manage products.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await getProductsUseCase.execute(accountRemoteId);
    if (!result.success) {
      setErrorMessage(result.error.message);
      setProducts([]);
      setIsLoading(false);
      return;
    }
    setProducts(result.value);
    setErrorMessage(null);
    setIsLoading(false);
  }, [accountRemoteId, getProductsUseCase]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const summary = useMemo(() => {
    const totalItems = products.filter(
      (item) => item.kind === ProductKind.Item,
    ).length;
    const totalServices = products.filter(
      (item) => item.kind === ProductKind.Service,
    ).length;
    const lowStockCount = products.filter(
      (item) =>
        item.kind === ProductKind.Item &&
        (item.stockQuantity ?? 0) > 0 &&
        (item.stockQuantity ?? 0) <= 5,
    ).length;
    return {
      totalProducts: products.length,
      totalItems,
      totalServices,
      lowStockCount,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedKind !== "all" && product.kind !== selectedKind) {
        return false;
      }
      if (!search) return true;
      return [
        product.name,
        product.categoryName ?? "",
        product.skuOrBarcode ?? "",
      ].some((value) => value.toLowerCase().includes(search));
    });
  }, [products, searchQuery, selectedKind]);

  const onOpenCreate = useCallback(() => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage products.");
      return;
    }
    setEditorMode("create");
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage]);

  const onOpenEdit = useCallback((product: Product) => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage products.");
      return;
    }
    setEditorMode("edit");
    setForm(mapProductToForm(product));
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage]);

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
  }, []);

  const onFormChange = useCallback(
    (field: keyof ProductFormState, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const onSubmit = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage products.");
      return;
    }
    if (!accountRemoteId) {
      setErrorMessage("A business account is required to manage products.");
      return;
    }
    const salePrice = parseNumber(form.salePrice);
    const costPrice = parseNumber(form.costPrice);
    const stockQuantity =
      form.kind === ProductKind.Item ? parseNumber(form.stockQuantity) : null;
    if (salePrice === null) {
      setErrorMessage("Sale price is required.");
      return;
    }
    const result = await saveProductUseCase.execute({
      remoteId: form.remoteId ?? Crypto.randomUUID(),
      accountRemoteId,
      name: form.name,
      kind: form.kind,
      categoryName: form.categoryName || null,
      salePrice,
      costPrice,
      stockQuantity,
      unitLabel: form.kind === ProductKind.Item ? form.unitLabel || null : null,
      skuOrBarcode: form.skuOrBarcode || null,
      taxRateLabel: form.taxRateLabel || null,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      status: ProductStatus.Active,
    });
    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }
    setProducts((currentProducts) => {
      const existingIndex = currentProducts.findIndex(
        (item) => item.remoteId === result.value.remoteId,
      );
      if (existingIndex === -1) {
        return [result.value, ...currentProducts];
      }
      return currentProducts.map((item, index) =>
        index === existingIndex ? result.value : item,
      );
    });
    setErrorMessage(null);
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    void loadProducts();
  }, [accountRemoteId, canManage, form, loadProducts, saveProductUseCase]);

  const onDelete = useCallback(
    async (product: Product) => {
      if (!canManage) {
        setErrorMessage("You do not have permission to manage products.");
        return;
      }
      const result = await deleteProductUseCase.execute(product.remoteId);
      if (!result.success) {
        setErrorMessage(result.error.message);
        return;
      }
      setProducts((currentProducts) =>
        currentProducts.filter((item) => item.remoteId !== product.remoteId),
      );
      setErrorMessage(null);
      void loadProducts();
    },
    [canManage, deleteProductUseCase, loadProducts],
  );

  return useMemo(
    () => ({
      isLoading,
      errorMessage,
      canManage,
      currencyCode,
      countryCode: activeAccountCountryCode,
      searchQuery,
      selectedKind,
      summary,
      products: filteredProducts,
      isEditorVisible,
      editorMode,
      form,
      categoryOptions: PRODUCT_CATEGORY_OPTIONS,
      unitOptions: PRODUCT_UNIT_OPTIONS,
      taxRateOptions: PRODUCT_TAX_RATE_OPTIONS,
      onRefresh: loadProducts,
      onSearchChange: setSearchQuery,
      onKindFilterChange: setSelectedKind,
      onOpenCreate,
      onOpenEdit,
      onCloseEditor,
      onFormChange,
      onSubmit,
      onDelete,
    }),
    [
      editorMode,
      canManage,
      currencyCode,
      errorMessage,
      filteredProducts,
      form,
      activeAccountCountryCode,
      isEditorVisible,
      isLoading,
      loadProducts,
      onCloseEditor,
      onDelete,
      onFormChange,
      onOpenCreate,
      onOpenEdit,
      onSubmit,
      searchQuery,
      selectedKind,
      summary,
    ],
  );
};

