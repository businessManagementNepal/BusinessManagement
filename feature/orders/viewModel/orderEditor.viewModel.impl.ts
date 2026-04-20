import { useCallback, useMemo, useState } from "react";
import * as Crypto from "expo-crypto";
import {
  buildNextOrderNumber,
  calculateFormPricingPreview,
  createEmptyLineItem,
  EMPTY_FORM,
  mapOrderToForm,
  parseNumber,
  safeTrim,
} from "./ordersPresentation.helpers";
import {
  OrderEditorViewModelParams,
  OrderEditorViewModelState,
} from "./orderEditor.viewModel";
import { OrderFormState, OrderLineFormState } from "./orders.viewModel";

export const useOrderEditorViewModel = ({
  accountRemoteId,
  ownerUserRemoteId,
  canManage,
  accountCountryCode,
  resolvedCurrencyCode,
  taxRatePercent,
  orders,
  settlementSnapshotsByOrderRemoteId,
  productPriceByRemoteId,
  createOrderUseCase,
  updateOrderUseCase,
  getOrderByIdUseCase,
  loadAll,
  refreshDetail,
  setErrorMessage,
}: OrderEditorViewModelParams): OrderEditorViewModelState => {
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState(EMPTY_FORM);

  const formPricingPreview = useMemo(
    () =>
      calculateFormPricingPreview({
        form,
        editorMode,
        orders,
        settlementSnapshotsByOrderRemoteId,
        productPriceByRemoteId,
        taxRatePercent,
        currencyCode: resolvedCurrencyCode,
        countryCode: accountCountryCode,
      }),
    [
      accountCountryCode,
      editorMode,
      form,
      orders,
      productPriceByRemoteId,
      resolvedCurrencyCode,
      settlementSnapshotsByOrderRemoteId,
      taxRatePercent,
    ],
  );

  const onOpenCreate = useCallback(() => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage orders.");
      return;
    }

    setEditorMode("create");
    setForm({
      ...EMPTY_FORM,
      orderNumber: buildNextOrderNumber([...orders]),
      orderDate: new Date().toISOString().slice(0, 10),
      items: [createEmptyLineItem()],
    });
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage, orders, setErrorMessage]);

  const onOpenEdit = useCallback(
    async (remoteId: string) => {
      if (!canManage) {
        setErrorMessage("You do not have permission to manage orders.");
        return;
      }

      const result = await getOrderByIdUseCase.execute(remoteId);
      if (!result.success) {
        setErrorMessage(result.error.message);
        return;
      }

      setEditorMode("edit");
      setForm(mapOrderToForm(result.value));
      setErrorMessage(null);
      setIsEditorVisible(true);
    },
    [canManage, getOrderByIdUseCase, setErrorMessage],
  );

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
  }, []);

  const onFormChange = useCallback(
    (field: keyof Omit<OrderFormState, "items">, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const onLineItemChange = useCallback(
    (remoteId: string, field: keyof OrderLineFormState, value: string) => {
      setForm((current) => ({
        ...current,
        items: (Array.isArray(current.items) ? current.items : []).map((item) =>
          item.remoteId === remoteId ? { ...item, [field]: value } : item,
        ),
      }));
    },
    [],
  );

  const onAddLineItem = useCallback(() => {
    setForm((current) => ({
      ...current,
      items: [...(Array.isArray(current.items) ? current.items : []), createEmptyLineItem()],
    }));
  }, []);

  const onRemoveLineItem = useCallback((remoteId: string) => {
    setForm((current) => ({
      ...current,
      items:
        (Array.isArray(current.items) ? current.items : []).length > 1
          ? (Array.isArray(current.items) ? current.items : []).filter(
              (item) => item.remoteId !== remoteId,
            )
          : Array.isArray(current.items)
            ? current.items
            : [createEmptyLineItem()],
    }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage orders.");
      return;
    }
    if (!accountRemoteId || !ownerUserRemoteId) {
      setErrorMessage("A business account is required to manage orders.");
      return;
    }

    const remoteId = form.remoteId ?? Crypto.randomUUID();
    const formItems = Array.isArray(form.items) ? form.items : [];
    const normalizedItems = formItems
      .map((item, index) => ({
        remoteId: item.remoteId || Crypto.randomUUID(),
        orderRemoteId: remoteId,
        productRemoteId: item.productRemoteId?.trim() ?? "",
        quantity: parseNumber(item.quantity) ?? 0,
        lineOrder: index,
      }))
      .filter((item) => item.productRemoteId.length > 0);

    if (normalizedItems.length === 0) {
      setErrorMessage("Add at least one order item.");
      return;
    }

    if (normalizedItems.some((item) => item.quantity <= 0)) {
      setErrorMessage("Each order item must have quantity greater than zero.");
      return;
    }

    const orderDate = new Date(form.orderDate || new Date().toISOString()).getTime();
    let currentOrder =
      form.remoteId !== null
        ? orders.find((order) => order.remoteId === form.remoteId) ?? null
        : null;

    if (form.remoteId && !currentOrder) {
      const latestOrderResult = await getOrderByIdUseCase.execute(form.remoteId);
      if (!latestOrderResult.success) {
        setErrorMessage(latestOrderResult.error.message);
        return;
      }
      currentOrder = latestOrderResult.value;
    }

    const payload = {
      remoteId,
      ownerUserRemoteId,
      accountRemoteId,
      orderNumber: safeTrim(form.orderNumber) || buildNextOrderNumber([...orders]),
      orderDate: Number.isFinite(orderDate) ? orderDate : Date.now(),
      customerRemoteId: safeTrim(form.customerRemoteId) || null,
      deliveryOrPickupDetails: safeTrim(form.deliveryOrPickupDetails) || null,
      notes: safeTrim(form.notes) || null,
      tags: safeTrim(form.tags) || null,
      internalRemarks: safeTrim(form.internalRemarks) || null,
      status: form.status,
      taxRatePercent,
      linkedBillingDocumentRemoteId:
        currentOrder?.linkedBillingDocumentRemoteId ?? null,
      linkedLedgerDueEntryRemoteId:
        currentOrder?.linkedLedgerDueEntryRemoteId ?? null,
      items: normalizedItems.map((item) => ({ ...item, orderRemoteId: remoteId })),
    };

    const result = form.remoteId
      ? await updateOrderUseCase.execute(payload)
      : await createOrderUseCase.execute(payload);

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    await loadAll();
    await refreshDetail(result.value.remoteId);
  }, [
    accountRemoteId,
    canManage,
    createOrderUseCase,
    form,
    getOrderByIdUseCase,
    loadAll,
    orders,
    ownerUserRemoteId,
    refreshDetail,
    setErrorMessage,
    taxRatePercent,
    updateOrderUseCase,
  ]);

  return {
    isEditorVisible,
    editorMode,
    form,
    formPricingPreview,
    onOpenCreate,
    onOpenEdit,
    onCloseEditor,
    onFormChange,
    onLineItemChange,
    onAddLineItem,
    onRemoveLineItem,
    onSubmit,
  };
};
