import { OrderStatus, OrderStatusValue } from "@/feature/orders/types/order.types";
import { validateOrderMoneyForm, parseOrderMoneyDateInput } from "@/feature/orders/validation/validateOrderMoneyForm";
import * as Crypto from "expo-crypto";
import { useCallback, useState } from "react";
import {
  OrderMoneyActionViewModelParams,
  OrderMoneyActionViewModelState,
} from "./orderMoneyAction.viewModel";
import {
  EMPTY_MONEY_FORM,
  EMPTY_RETURN_DISPOSITION_FORM,
  parseNumber,
} from "./ordersPresentation.helpers";

const parseReturnQuantity = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const useOrderMoneyActionViewModel = ({
  canManage,
  accountRemoteId,
  ownerUserRemoteId,
  accountDisplayNameSnapshot,
  resolvedCurrencyCode,
  detail,
  moneyAccountOptions,
  setErrorMessage,
  setSuccessMessage,
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
  const [returnDispositionForm, setReturnDispositionForm] = useState(
    EMPTY_RETURN_DISPOSITION_FORM,
  );

  const onOpenStatusModal = useCallback(() => {
    if (!detail || !canManage) {
      return;
    }
    setSuccessMessage(null);
    setStatusDraft(detail.order.status);
    setIsStatusModalVisible(true);
  }, [canManage, detail, setSuccessMessage]);

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
    setSuccessMessage("Order status updated.");
  }, [
    canManage,
    changeOrderStatusUseCase,
    detail,
    loadAll,
    refreshDetail,
    setErrorMessage,
    setSuccessMessage,
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
    setSuccessMessage("Order cancelled.");
  }, [
    cancelOrderUseCase,
    canManage,
    detail,
    loadAll,
    refreshDetail,
    setErrorMessage,
    setSuccessMessage,
  ]);

  const onReturnOrder = useCallback(() => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage orders.");
      return;
    }
    if (!detail) {
      return;
    }
    if (detail.order.status !== OrderStatus.Delivered) {
      setErrorMessage("Only delivered orders can be returned.");
      return;
    }

    setSuccessMessage(null);
    setErrorMessage(null);
    setReturnDispositionForm({
      visible: true,
      orderRemoteId: detail.order.remoteId,
      orderNumber: detail.order.orderNumber,
      lines: detail.items
        .filter((item) => item.isInventoryTracked)
        .map((item) => ({
          lineRemoteId: item.remoteId,
          productName: item.productName,
          orderedQuantity: item.quantity,
          unitLabel: item.unitLabel,
          sellableQuantity: "",
          nonSellableQuantity: "",
          errorMessage: null,
        })),
    });
  }, [canManage, detail, setErrorMessage, setSuccessMessage]);

  const onCloseReturnDisposition = useCallback(() => {
    setReturnDispositionForm(EMPTY_RETURN_DISPOSITION_FORM);
  }, []);

  const onReturnDispositionLineChange = useCallback(
    (
      lineRemoteId: string,
      field: "sellableQuantity" | "nonSellableQuantity",
      value: string,
    ) => {
      setReturnDispositionForm((current) => ({
        ...current,
        lines: current.lines.map((line) =>
          line.lineRemoteId === lineRemoteId
            ? {
                ...line,
                [field]: value,
                errorMessage: null,
              }
            : line,
        ),
      }));
      setErrorMessage(null);
    },
    [setErrorMessage],
  );

  const onSubmitReturnOrder = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage orders.");
      return;
    }
    if (!detail || !returnDispositionForm.orderRemoteId) {
      return;
    }

    let hasError = false;
    const parsedLines = returnDispositionForm.lines.map((line) => {
      const sellableQuantity = parseReturnQuantity(line.sellableQuantity);
      const nonSellableQuantity = parseReturnQuantity(line.nonSellableQuantity);

      let errorMessage: string | null = null;
      if (
        sellableQuantity === null ||
        nonSellableQuantity === null ||
        sellableQuantity < 0 ||
        nonSellableQuantity < 0
      ) {
        errorMessage = "Enter non-negative quantities for both fields.";
      } else if (
        Math.abs(
          sellableQuantity + nonSellableQuantity - line.orderedQuantity,
        ) > 1e-9
      ) {
        errorMessage = `Sellable + non-sellable must equal ${line.orderedQuantity} ${line.unitLabel ?? "unit"}.`;
      }

      if (errorMessage) {
        hasError = true;
      }

      return {
        line,
        sellableQuantity,
        nonSellableQuantity,
        errorMessage,
      };
    });

    if (hasError) {
      setReturnDispositionForm((current) => ({
        ...current,
        lines: current.lines.map((line) => {
          const parsed = parsedLines.find(
            (candidate) => candidate.line.lineRemoteId === line.lineRemoteId,
          );
          return {
            ...line,
            errorMessage: parsed?.errorMessage ?? null,
          };
        }),
      }));
      setErrorMessage(null);
      return;
    }

    const result = await returnOrderUseCase.execute({
      remoteId: returnDispositionForm.orderRemoteId,
      lineDispositions: parsedLines.map((parsed) => ({
        lineRemoteId: parsed.line.lineRemoteId,
        sellableQuantity: parsed.sellableQuantity as number,
        nonSellableQuantity: parsed.nonSellableQuantity as number,
      })),
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setReturnDispositionForm(EMPTY_RETURN_DISPOSITION_FORM);
    await loadAll();
    await refreshDetail(detail.order.remoteId);
    setSuccessMessage("Order returned.");
  }, [
    canManage,
    detail,
    loadAll,
    refreshDetail,
    returnDispositionForm,
    returnOrderUseCase,
    setErrorMessage,
    setSuccessMessage,
  ]);

  const onOpenMoneyAction = useCallback(
    (action: "payment" | "refund") => {
      if (!detail || !canManage) {
        return;
      }
      setSuccessMessage(null);
      setMoneyForm({
        visible: true,
        action,
        orderRemoteId: detail.order.remoteId,
        orderNumber: detail.order.orderNumber,
        amount: "",
        happenedAt: new Date().toISOString().slice(0, 10),
        settlementMoneyAccountRemoteId: moneyAccountOptions[0]?.value ?? "",
        note: "",
        attemptRemoteId: Crypto.randomUUID(),
        fieldErrors: {},
      });
      setErrorMessage(null);
    },
    [canManage, detail, moneyAccountOptions, setErrorMessage, setSuccessMessage],
  );

  const onCloseMoneyAction = useCallback(() => {
    setMoneyForm(EMPTY_MONEY_FORM);
    setSuccessMessage(null);
  }, [setSuccessMessage]);

  const onMoneyFormChange = useCallback(
    (
      field: keyof Omit<typeof moneyForm, "visible" | "action" | "fieldErrors">,
      value: string,
    ) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      setMoneyForm((current) => ({
        ...current,
        [field]: value,
        fieldErrors:
          field === "amount"
            ? { ...current.fieldErrors, amount: undefined }
            : field === "happenedAt"
              ? { ...current.fieldErrors, happenedAt: undefined }
              : field === "settlementMoneyAccountRemoteId"
                ? {
                    ...current.fieldErrors,
                    settlementMoneyAccountRemoteId: undefined,
                  }
                : current.fieldErrors,
      }));
    },
    [setErrorMessage, setSuccessMessage],
  );

  const onSubmitMoneyAction = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage orders.");
      return;
    }
    if (!moneyForm.orderRemoteId || !detail) {
      return;
    }

    if (!moneyForm.attemptRemoteId?.trim()) {
      setErrorMessage("Payment attempt id is required.");
      return;
    }
    if (!ownerUserRemoteId || !accountRemoteId) {
      setErrorMessage("Active business account context is required.");
      return;
    }

    const selectedMoneyAccount = moneyAccountOptions.find(
      (option) => option.value === moneyForm.settlementMoneyAccountRemoteId,
    );

    const nextFieldErrors = validateOrderMoneyForm({
      amount: moneyForm.amount,
      happenedAt: moneyForm.happenedAt,
      settlementMoneyAccountRemoteId: moneyForm.settlementMoneyAccountRemoteId,
      selectedMoneyAccountExists: Boolean(selectedMoneyAccount),
    });

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setMoneyForm((current) => ({
        ...current,
        fieldErrors: nextFieldErrors,
      }));
      setErrorMessage(null);
      return;
    }

    const amount = parseNumber(moneyForm.amount);
    const happenedAt = parseOrderMoneyDateInput(moneyForm.happenedAt);

    if (amount === null || happenedAt === null || !selectedMoneyAccount) {
      setMoneyForm((current) => ({
        ...current,
        fieldErrors: {
          amount:
            amount === null || amount <= 0
              ? "Amount must be greater than zero."
              : undefined,
          happenedAt:
            happenedAt === null
              ? "Enter a valid date in YYYY-MM-DD format."
              : undefined,
          settlementMoneyAccountRemoteId: !selectedMoneyAccount
            ? "Choose a valid money account."
            : undefined,
        },
      }));
      setErrorMessage(null);
      return;
    }

    const paymentPayload = {
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
      paymentAttemptRemoteId: moneyForm.attemptRemoteId,
    };

    const refundPayload = {
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
      refundAttemptRemoteId: moneyForm.attemptRemoteId,
    };

    const result =
      moneyForm.action === "payment"
        ? await recordOrderPaymentUseCase.execute(paymentPayload)
        : await refundOrderUseCase.execute(refundPayload);

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setMoneyForm(EMPTY_MONEY_FORM);
    await loadAll();
    await refreshDetail(detail.order.remoteId);
    setSuccessMessage(
      moneyForm.action === "payment"
        ? "Order payment recorded."
        : "Order refund recorded.",
    );
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
    setSuccessMessage,
  ]);

  const resetModalState = useCallback(() => {
    setIsStatusModalVisible(false);
    setMoneyForm(EMPTY_MONEY_FORM);
    setReturnDispositionForm(EMPTY_RETURN_DISPOSITION_FORM);
  }, []);

  return {
    isStatusModalVisible,
    statusDraft,
    moneyForm,
    returnDispositionForm,
    onOpenStatusModal,
    onCloseStatusModal,
    onStatusDraftChange: (value) => setStatusDraft(value),
    onSubmitStatus,
    onCancelOrder,
    onReturnOrder,
    onCloseReturnDisposition,
    onReturnDispositionLineChange,
    onSubmitReturnOrder,
    onOpenMoneyAction,
    onCloseMoneyAction,
    onMoneyFormChange,
    onSubmitMoneyAction,
    resetModalState,
  };
};
