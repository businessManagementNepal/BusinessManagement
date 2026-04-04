import { useCallback, useEffect, useMemo, useState } from "react";
import * as Crypto from "expo-crypto";
import {
  INVENTORY_ADJUSTMENT_REASON_OPTIONS,
  InventoryMovementType,
  InventoryMovementTypeValue,
} from "@/feature/inventory/types/inventory.types";
import { GetInventorySnapshotUseCase } from "@/feature/inventory/useCase/getInventorySnapshot.useCase";
import { SaveInventoryMovementUseCase } from "@/feature/inventory/useCase/saveInventoryMovement.useCase";
import {
  InventoryMovementFormState,
  InventoryViewModel,
} from "./inventory.viewModel";
import {
  resolveCurrencyCode,
  resolveCurrencyPrefix,
} from "@/shared/utils/currency/accountCurrency";

const formatDateInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.getTime();
};

const parseNumber = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const createEmptyForm = (): InventoryMovementFormState => ({
  productRemoteId: "",
  quantity: "",
  unitRate: "",
  reason: "",
  movementDate: formatDateInput(Date.now()),
  remark: "",
});

type Params = {
  accountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canManage: boolean;
  getInventorySnapshotUseCase: GetInventorySnapshotUseCase;
  saveInventoryMovementUseCase: SaveInventoryMovementUseCase;
};

export const useInventoryViewModel = ({
  accountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  canManage,
  getInventorySnapshotUseCase,
  saveInventoryMovementUseCase,
}: Params): InventoryViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stockItems, setStockItems] = useState<InventoryViewModel["stockItems"]>([]);
  const [recentMovements, setRecentMovements] = useState<InventoryViewModel["recentMovements"]>([]);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorType, setEditorType] = useState<InventoryMovementTypeValue>(
    InventoryMovementType.StockIn,
  );
  const [form, setForm] = useState<InventoryMovementFormState>(createEmptyForm);
  const currencyCode = useMemo(
    () =>
      resolveCurrencyCode({
        currencyCode: activeAccountCurrencyCode,
        countryCode: activeAccountCountryCode,
      }),
    [activeAccountCountryCode, activeAccountCurrencyCode],
  );
  const currencyPrefix = useMemo(
    () =>
      resolveCurrencyPrefix({
        currencyCode,
        countryCode: activeAccountCountryCode,
      }),
    [activeAccountCountryCode, currencyCode],
  );

  const loadInventory = useCallback(async () => {
    if (!accountRemoteId) {
      setStockItems([]);
      setRecentMovements([]);
      setErrorMessage("A business account is required to manage inventory.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await getInventorySnapshotUseCase.execute(accountRemoteId);
    if (!result.success) {
      setStockItems([]);
      setRecentMovements([]);
      setErrorMessage(result.error.message);
      setIsLoading(false);
      return;
    }

    setStockItems(
      [...result.value.stockItems].sort((left, right) => right.stockValue - left.stockValue),
    );
    setRecentMovements(result.value.recentMovements);
    setErrorMessage(null);
    setIsLoading(false);
  }, [accountRemoteId, getInventorySnapshotUseCase]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const summary = useMemo(() => {
    const lowStockCount = stockItems.filter((item) => item.isLowStock).length;
    const stockValue = stockItems.reduce((total, item) => total + item.stockValue, 0);

    return {
      totalProducts: stockItems.length,
      lowStockCount,
      stockValue,
    };
  }, [stockItems]);

  const productOptions = useMemo(
    () =>
      stockItems.map((item) => ({
        label: item.name,
        value: item.productRemoteId,
      })),
    [stockItems],
  );

  const onOpenStockIn = useCallback(() => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage inventory.");
      return;
    }
    if (stockItems.length === 0) {
      setErrorMessage("Add an item product first before recording stock.");
      return;
    }
    setEditorType(InventoryMovementType.StockIn);
    setForm(createEmptyForm());
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage, stockItems.length]);

  const onOpenAdjustment = useCallback(() => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage inventory.");
      return;
    }
    if (stockItems.length === 0) {
      setErrorMessage("Add an item product first before recording stock.");
      return;
    }
    setEditorType(InventoryMovementType.Adjustment);
    setForm({ ...createEmptyForm(), reason: INVENTORY_ADJUSTMENT_REASON_OPTIONS[0]?.value ?? "" });
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage, stockItems.length]);

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(createEmptyForm());
  }, []);

  const onFormChange = useCallback(
    (field: keyof InventoryMovementFormState, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const onSubmit = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage inventory.");
      return;
    }

    if (!accountRemoteId) {
      setErrorMessage("A business account is required to manage inventory.");
      return;
    }

    const quantity = parseNumber(form.quantity);
    if (quantity === null || quantity <= 0) {
      setErrorMessage("Quantity must be greater than zero.");
      return;
    }

    const movementAt = parseDateInput(form.movementDate);
    if (movementAt === null) {
      setErrorMessage("Please enter a valid movement date in YYYY-MM-DD format.");
      return;
    }

    const unitRate = parseNumber(form.unitRate);
    const result = await saveInventoryMovementUseCase.execute({
      remoteId: Crypto.randomUUID(),
      accountRemoteId,
      productRemoteId: form.productRemoteId,
      type: editorType,
      quantity,
      unitRate,
      reason: editorType === InventoryMovementType.Adjustment ? (form.reason || null) : null,
      remark: form.remark.trim() ? form.remark.trim() : null,
      movementAt,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setIsEditorVisible(false);
    setForm(createEmptyForm());
    await loadInventory();
  }, [accountRemoteId, canManage, editorType, form, loadInventory, saveInventoryMovementUseCase]);

  const editorTitle =
    editorType === InventoryMovementType.StockIn ? "Stock In" : "Stock Adjustment";

  return useMemo(
    () => ({
      isLoading,
      errorMessage,
      currencyCode,
      countryCode: activeAccountCountryCode,
      currencyPrefix,
      summary,
      stockItems,
      recentMovements,
      productOptions,
      canManage,
      isEditorVisible,
      editorType,
      editorTitle,
      form,
      adjustmentReasonOptions: INVENTORY_ADJUSTMENT_REASON_OPTIONS,
      onRefresh: loadInventory,
      onOpenStockIn,
      onOpenAdjustment,
      onCloseEditor,
      onFormChange,
      onSubmit,
    }),
    [
      editorTitle,
      canManage,
      editorType,
      errorMessage,
      form,
      currencyCode,
      currencyPrefix,
      activeAccountCountryCode,
      isEditorVisible,
      isLoading,
      loadInventory,
      onCloseEditor,
      onFormChange,
      onOpenAdjustment,
      onOpenStockIn,
      onSubmit,
      productOptions,
      recentMovements,
      stockItems,
      summary,
    ],
  );
};
