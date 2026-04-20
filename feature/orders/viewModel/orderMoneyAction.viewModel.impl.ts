import { useCallback, useState } from "react";
import { OrderStatus, OrderStatusValue } from "@/feature/orders/types/order.types";
import {
  EMPTY_MONEY_FORM,
  parseNumber,
} from "./ordersPresentation.helpers";
import {
  OrderMoneyActionViewModelParams,
  OrderMoneyActionViewModelState,
} from "./orderMoneyAction.viewModel";

export const useOrderMoneyActionViewModel = ({
  canManage,
  accountRemoteId,
  ownerUserRemoteId,
  accountDisplayNameSnapshot,
  resolvedCurrencyCode,
  detail,
  moneyAccountOptions,
  setErrorMessage,
  loadAll,
  refreshDetail,
  changeOrderStatusUseCase,
  cancelOrderUseCase,
  returnOrderUseCase,
  recordOrderPaymentUseCase,
  refundOrderUseCase,
}: OrderMoneyActionViewModelParams): OrderMoneyActionViewModelState => {
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [statusDraft, setStatusDraft] = useState<OrderStatusValue>(
    OrderStatus.Draft,
  );
  const [moneyForm, setMoneyForm] = useState(EMPTY_MONEY_FORM);

  const onOpenStatusModal = useCallback(() => {
    if (!detail || !canManage) {
      return;
    }
    setStatusDraft(detail.order.status);
    setIsStatusModalVisible(true);
  }, [canManage, detail]);

  const onCloseStatusModal = useCallback(() => {
    setIsStatusModalVisible(false);
  }, []);

  const onSubmitStatus = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage orders.");
      return;
    }
    if (!detail) {
      return;
    }

    const result = await changeOrderStatusUseCase.execute({
      remoteId: detail.order.remoteId,
      status: statusDraft,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setIsStatusModalVisible(false);
    await loadAll();
    await refreshDetail(detail.order.remoteId);
  }, [
    canManage,
    changeOrderStatusUseCase,
    detail,
    loadAll,
    refreshDetail,
    setErrorMessage,
    statusDraft,
  ]);

  const onCancelOrder = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage orders.");
      return;
    }
    if (!detail) {
      return;
    }

    const result = await cancelOrderUseCase.execute(detail.order.remoteId);
    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    await loadAll();
    await refreshDetail(detail.order.remoteId);
  }, [
    cancelOrderUseCase,
    canManage,
    detail,
    loadAll,
    refreshDetail,
    setErrorMessage,
  ]);

  const onReturnOrder = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage orders.");
      return;
    }
    if (!detail) {
      return;
    }

    const result = await returnOrderUseCase.execute(detail.order.remoteId);
    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    await loadAll();
    await refreshDetail(detail.order.remoteId);
  }, [
    canManage,
    detail,
    loadAll,
    refreshDetail,
    returnOrderUseCase,
    setErrorMessage,
  ]);

  const onOpenMoneyAction = useCallback(
    (action: "payment" | "refund") => {
      if (!detail || !canManage) {
        return;
      }
      setMoneyForm({
        visible: true,
        action,
        orderRemoteId: detail.order.remoteId,
        orderNumber: detail.order.orderNumber,
        amount: "",
        happenedAt: new Date().toISOString().slice(0, 10),
        settlementMoneyAccountRemoteId: moneyAccountOptions[0]?.value ?? "",
        note: "",
      });
    },
    [canManage, detail, moneyAccountOptions],
  );

  const onCloseMoneyAction = useCallback(() => {
    setMoneyForm(EMPTY_MONEY_FORM);
  }, []);

  const onMoneyFormChange = useCallback(
    (
      field: keyof Omit<typeof moneyForm, "visible" | "action">,
      value: string,
    ) => {
      setMoneyForm((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const onSubmitMoneyAction = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage orders.");
      return;
    }
    if (!moneyForm.orderRemoteId || !detail) {
      return;
    }
    if (!ownerUserRemoteId || !accountRemoteId) {
      setErrorMessage("Active business account context is required.");
      return;
    }
    const amount = parseNumber(moneyForm.amount);
    if (amount === null || amount <= 0) {
      setErrorMessage("Amount must be greater than zero.");
      return;
    }
    const selectedMoneyAccount = moneyAccountOptions.find(
      (option) => option.value === moneyForm.settlementMoneyAccountRemoteId,
    );
    if (!selectedMoneyAccount) {
      setErrorMessage("Choose a valid money account.");
      return;
    }
    const happenedAt = new Date(
      moneyForm.happenedAt || new Date().toISOString(),
    ).getTime();
    if (!Number.isFinite(happenedAt) || happenedAt <= 0) {
      setErrorMessage("Enter a valid date.");
      return;
    }

    const basePayload = {
      orderRemoteId: moneyForm.orderRemoteId,
      orderNumber: moneyForm.orderNumber,
      ownerUserRemoteId,
      accountRemoteId,
      accountDisplayNameSnapshot,
      currencyCode: resolvedCurrencyCode,
      amount,
      happenedAt,
      settlementMoneyAccountRemoteId: selectedMoneyAccount.value,
      settlementMoneyAccountDisplayNameSnapshot: selectedMoneyAccount.label,
      note: moneyForm.note.trim() || null,
    };

    const result =
      moneyForm.action === "payment"
        ? await recordOrderPaymentUseCase.execute(basePayload)
        : await refundOrderUseCase.execute(basePayload);

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setMoneyForm(EMPTY_MONEY_FORM);
    await loadAll();
    await refreshDetail(detail.order.remoteId);
  }, [
    accountDisplayNameSnapshot,
    accountRemoteId,
    canManage,
    detail,
    loadAll,
    moneyAccountOptions,
    moneyForm,
    ownerUserRemoteId,
    recordOrderPaymentUseCase,
    refreshDetail,
    refundOrderUseCase,
    resolvedCurrencyCode,
    setErrorMessage,
  ]);

  const resetModalState = useCallback(() => {
    setIsStatusModalVisible(false);
    setMoneyForm(EMPTY_MONEY_FORM);
  }, []);

  return {
    isStatusModalVisible,
    statusDraft,
    moneyForm,
    onOpenStatusModal,
    onCloseStatusModal,
    onStatusDraftChange: (value) => setStatusDraft(value),
    onSubmitStatus,
    onCancelOrder,
    onReturnOrder,
    onOpenMoneyAction,
    onCloseMoneyAction,
    onMoneyFormChange,
    onSubmitMoneyAction,
    resetModalState,
  };
};
