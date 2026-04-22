import {
  Product,
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_UNIT_OPTIONS,
  ProductKind,
  ProductKindValue,
  ProductStatus,
} from "@/feature/products/types/product.types";
import { DeleteProductUseCase } from "@/feature/products/useCase/deleteProduct.useCase";
import { GetProductsUseCase } from "@/feature/products/useCase/getProducts.useCase";
import { CreateProductWithOpeningStockUseCase } from "@/feature/products/useCase/createProductWithOpeningStock.useCase";
import { SaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase";
import {
  buildTaxRateLabel,
  resolveRegionalFinancePolicy,
} from "@/shared/utils/finance/regionalFinancePolicy";
import { pickImageFromLibrary } from "@/shared/utils/media/pickImage";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ProductFormFieldErrors,
  ProductFormState,
  ProductsViewModel,
} from "./products.viewModel";

const createEmptyForm = (defaultTaxRateLabel: string): ProductFormState => ({
  remoteId: null,
  name: "",
  kind: ProductKind.Item,
  categoryName: "",
  salePrice: "0",
  costPrice: "0",
  unitLabel: "pcs",
  skuOrBarcode: "",
  taxRateLabel: defaultTaxRateLabel,
  description: "",
  imageUrl: "",
  openingStockQuantity: "",
});

const mapProductToForm = (
  product: Product,
  defaultTaxRateLabel: string,
): ProductFormState => ({
  remoteId: product.remoteId,
  name: product.name,
  kind: product.kind,
  categoryName: product.categoryName ?? "",
  salePrice: String(product.salePrice),
  costPrice: product.costPrice === null ? "" : String(product.costPrice),
  unitLabel: product.unitLabel ?? "pcs",
  skuOrBarcode: product.skuOrBarcode ?? "",
  taxRateLabel: product.taxRateLabel ?? defaultTaxRateLabel,
  description: product.description ?? "",
  imageUrl: product.imageUrl ?? "",
  openingStockQuantity: "",
});

const parseNumber = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const validateProductForm = ({
  name,
  salePrice,
}: {
  name: string;
  salePrice: string;
}): ProductFormFieldErrors => {
  const nextFieldErrors: ProductFormFieldErrors = {};
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

type Params = {
  accountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  activeAccountDefaultTaxRatePercent: number | null;
  canManage: boolean;
  getProductsUseCase: GetProductsUseCase;
  saveProductUseCase: SaveProductUseCase;
  createProductWithOpeningStockUseCase: CreateProductWithOpeningStockUseCase;
  deleteProductUseCase: DeleteProductUseCase;
};

export const useProductsViewModel = ({
  accountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  activeAccountDefaultTaxRatePercent,
  canManage,
  getProductsUseCase,
  saveProductUseCase,
  createProductWithOpeningStockUseCase,
  deleteProductUseCase,
}: Params): ProductsViewModel => {
  const regionalFinancePolicy = useMemo(
    () =>
      resolveRegionalFinancePolicy({
        countryCode: activeAccountCountryCode,
        currencyCode: activeAccountCurrencyCode,
        defaultTaxRatePercent: activeAccountDefaultTaxRatePercent,
      }),
    [
      activeAccountCountryCode,
      activeAccountCurrencyCode,
      activeAccountDefaultTaxRatePercent,
    ],
  );

  const defaultTaxRateLabel = useMemo(
    () => buildTaxRateLabel(regionalFinancePolicy.defaultTaxRatePercent),
    [regionalFinancePolicy.defaultTaxRatePercent],
  );

  const taxRateOptions = useMemo(
    () =>
      regionalFinancePolicy.taxRateOptions.map((ratePercent) =>
        buildTaxRateLabel(ratePercent),
      ),
    [regionalFinancePolicy.taxRateOptions],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKind, setSelectedKind] = useState<"all" | ProductKindValue>(
    "all",
  );
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<ProductFormState>(
    createEmptyForm(defaultTaxRateLabel),
  );
  const [fieldErrors, setFieldErrors] = useState<ProductFormFieldErrors>({});
  const currencyCode = regionalFinancePolicy.currencyCode;

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

  useEffect(() => {
    if (!isEditorVisible) {
      setForm(createEmptyForm(defaultTaxRateLabel));
    }
  }, [defaultTaxRateLabel, isEditorVisible]);

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
    setForm(createEmptyForm(defaultTaxRateLabel));
    setFieldErrors({});
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage, defaultTaxRateLabel]);

  const onOpenEdit = useCallback(
    (product: Product) => {
      if (!canManage) {
        setErrorMessage("You do not have permission to manage products.");
        return;
      }

      setEditorMode("edit");
      setForm(mapProductToForm(product, defaultTaxRateLabel));
      setFieldErrors({});
      setErrorMessage(null);
      setIsEditorVisible(true);
    },
    [canManage, defaultTaxRateLabel],
  );

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(createEmptyForm(defaultTaxRateLabel));
    setFieldErrors({});
  }, [defaultTaxRateLabel]);

  const onFormChange = useCallback(
    (field: keyof ProductFormState, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));

      if (field === "name") {
        setFieldErrors((current) => ({ ...current, name: undefined }));
      } else if (field === "salePrice") {
        setFieldErrors((current) => ({ ...current, salePrice: undefined }));
      }
    },
    [],
  );

  const onPickImage = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage products.");
      return;
    }

    const pickedImage = await pickImageFromLibrary();
    if (!pickedImage) {
      return;
    }

    setForm((current) => ({
      ...current,
      imageUrl: pickedImage.dataUrl ?? pickedImage.uri,
    }));
    setErrorMessage(null);
  }, [canManage]);

  const onClearImage = useCallback(() => {
    setForm((current) => ({ ...current, imageUrl: "" }));
    setErrorMessage(null);
  }, []);

  const onSubmit = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage products.");
      return;
    }

    if (!accountRemoteId) {
      setErrorMessage("A business account is required to manage products.");
      return;
    }

    const nextFieldErrors = validateProductForm({
      name: form.name,
      salePrice: form.salePrice,
    });

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage(null);
      return;
    }

    const salePrice = parseNumber(form.salePrice);
    const costPrice = parseNumber(form.costPrice);
    const normalizedOpeningStock = form.openingStockQuantity.trim();
    const openingStockQuantity = parseNumber(form.openingStockQuantity);

    if (salePrice === null) {
      setErrorMessage("Sale price is required.");
      return;
    }

    if (normalizedOpeningStock.length > 0 && openingStockQuantity === null) {
      setErrorMessage("Opening stock must be a valid number.");
      return;
    }

    if (openingStockQuantity !== null && openingStockQuantity < 0) {
      setErrorMessage("Opening stock cannot be negative.");
      return;
    }

    setFieldErrors({});
    setErrorMessage(null);

    const productPayload = {
      remoteId: form.remoteId ?? Crypto.randomUUID(),
      accountRemoteId,
      name: form.name,
      kind: form.kind,
      categoryName: form.categoryName || null,
      salePrice,
      costPrice,
      unitLabel: form.kind === ProductKind.Item ? form.unitLabel || null : null,
      skuOrBarcode: form.skuOrBarcode || null,
      taxRateLabel: form.taxRateLabel || null,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      status: ProductStatus.Active,
    };

    const result =
      editorMode === "create"
        ? await createProductWithOpeningStockUseCase.execute({
            product: productPayload,
            openingStockQuantity,
          })
        : await saveProductUseCase.execute(productPayload);

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
    setForm(createEmptyForm(defaultTaxRateLabel));
    setFieldErrors({});
    void loadProducts();
  }, [
    accountRemoteId,
    canManage,
    createProductWithOpeningStockUseCase,
    defaultTaxRateLabel,
    editorMode,
    form,
    loadProducts,
    saveProductUseCase,
  ]);

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
      countryCode: regionalFinancePolicy.countryCode,
      searchQuery,
      selectedKind,
      summary,
      products: filteredProducts,
      isEditorVisible,
      editorMode,
      form,
      fieldErrors,
      categoryOptions: PRODUCT_CATEGORY_OPTIONS,
      unitOptions: PRODUCT_UNIT_OPTIONS,
      taxRateOptions,
      onRefresh: loadProducts,
      onSearchChange: setSearchQuery,
      onKindFilterChange: setSelectedKind,
      onOpenCreate,
      onOpenEdit,
      onCloseEditor,
      onFormChange,
      onPickImage,
      onClearImage,
      onSubmit,
      onDelete,
    }),
    [
      canManage,
      currencyCode,
      editorMode,
      errorMessage,
      fieldErrors,
      filteredProducts,
      form,
      isEditorVisible,
      isLoading,
      loadProducts,
      onClearImage,
      onCloseEditor,
      onDelete,
      onFormChange,
      onOpenCreate,
      onOpenEdit,
      onPickImage,
      onSubmit,
      regionalFinancePolicy.countryCode,
      searchQuery,
      selectedKind,
      summary,
      taxRateOptions,
    ],
  );
};
