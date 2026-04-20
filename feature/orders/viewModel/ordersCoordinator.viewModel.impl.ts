import { useCallback, useMemo } from "react";
import { useOrderDetailsViewModel } from "./orderDetails.viewModel.impl";
import { useOrderEditorViewModel } from "./orderEditor.viewModel.impl";
import { useOrderMoneyActionViewModel } from "./orderMoneyAction.viewModel.impl";
import { useOrdersListViewModel } from "./ordersList.viewModel.impl";
import {
  OrdersCoordinatorViewModelParams,
} from "./ordersCoordinator.viewModel";
import { OrdersViewModel } from "./orders.viewModel";

export const useOrdersCoordinatorViewModel = (
  params: OrdersCoordinatorViewModelParams,
): OrdersViewModel => {
  const listViewModel = useOrdersListViewModel({
    accountRemoteId: params.accountRemoteId,
    ownerUserRemoteId: params.ownerUserRemoteId,
    accountCurrencyCode: params.accountCurrencyCode,
    accountCountryCode: params.accountCountryCode,
    accountDefaultTaxRatePercent: params.accountDefaultTaxRatePercent,
    getOrdersUseCase: params.getOrdersUseCase,
    getContactsUseCase: params.getContactsUseCase,
    getProductsUseCase: params.getProductsUseCase,
    getMoneyAccountsUseCase: params.getMoneyAccountsUseCase,
    getOrderSettlementSnapshotsUseCase: params.getOrderSettlementSnapshotsUseCase,
  });

  const detailsViewModel = useOrderDetailsViewModel({
    accountRemoteId: params.accountRemoteId,
    ownerUserRemoteId: params.ownerUserRemoteId,
    accountCountryCode: params.accountCountryCode,
    resolvedCurrencyCode: listViewModel.resolvedCurrencyCode,
    taxRatePercent: listViewModel.taxRatePercent,
    contactsByRemoteId: listViewModel.contactsByRemoteId,
    productsByRemoteId: listViewModel.productsByRemoteId,
    getOrderByIdUseCase: params.getOrderByIdUseCase,
    getOrderSettlementSnapshotsUseCase: params.getOrderSettlementSnapshotsUseCase,
    setErrorMessage: listViewModel.setErrorMessage,
  });

  const editorViewModel = useOrderEditorViewModel({
    accountRemoteId: params.accountRemoteId,
    ownerUserRemoteId: params.ownerUserRemoteId,
    canManage: params.canManage,
    accountCountryCode: params.accountCountryCode,
    resolvedCurrencyCode: listViewModel.resolvedCurrencyCode,
    taxRatePercent: listViewModel.taxRatePercent,
    orders: listViewModel.orders,
    settlementSnapshotsByOrderRemoteId:
      listViewModel.settlementSnapshotsByOrderRemoteId,
    productPriceByRemoteId: listViewModel.productPriceByRemoteId,
    createOrderUseCase: params.createOrderUseCase,
    updateOrderUseCase: params.updateOrderUseCase,
    getOrderByIdUseCase: params.getOrderByIdUseCase,
    loadAll: listViewModel.loadAll,
    refreshDetail: detailsViewModel.refreshDetail,
    setErrorMessage: listViewModel.setErrorMessage,
  });

  const moneyActionViewModel = useOrderMoneyActionViewModel({
    canManage: params.canManage,
    accountRemoteId: params.accountRemoteId,
    ownerUserRemoteId: params.ownerUserRemoteId,
    accountDisplayNameSnapshot: params.accountDisplayNameSnapshot,
    resolvedCurrencyCode: listViewModel.resolvedCurrencyCode,
    detail: detailsViewModel.detail,
    moneyAccountOptions: listViewModel.moneyAccountOptions,
    setErrorMessage: listViewModel.setErrorMessage,
    loadAll: listViewModel.loadAll,
    refreshDetail: detailsViewModel.refreshDetail,
    changeOrderStatusUseCase: params.changeOrderStatusUseCase,
    cancelOrderUseCase: params.cancelOrderUseCase,
    returnOrderUseCase: params.returnOrderUseCase,
    recordOrderPaymentUseCase: params.recordOrderPaymentUseCase,
    refundOrderUseCase: params.refundOrderUseCase,
  });

  const onDelete = useCallback(
    async (remoteId: string) => {
      if (!params.canManage) {
        listViewModel.setErrorMessage(
          "You do not have permission to manage orders.",
        );
        return;
      }

      const result = await params.deleteOrderUseCase.execute(remoteId);
      if (!result.success) {
        listViewModel.setErrorMessage(result.error.message);
        return;
      }

      await listViewModel.loadAll();
      detailsViewModel.onCloseDetail();
      moneyActionViewModel.resetModalState();
    },
    [
      detailsViewModel,
      listViewModel,
      moneyActionViewModel,
      params.canManage,
      params.deleteOrderUseCase,
    ],
  );

  const onCloseDetail = useCallback(() => {
    detailsViewModel.onCloseDetail();
    moneyActionViewModel.resetModalState();
  }, [detailsViewModel, moneyActionViewModel]);

  return useMemo(
    () => ({
      isLoading: listViewModel.isLoading,
      errorMessage: listViewModel.errorMessage,
      searchQuery: listViewModel.searchQuery,
      statusFilter: listViewModel.statusFilter,
      onSearchQueryChange: listViewModel.onSearchQueryChange,
      onStatusFilterChange: listViewModel.onStatusFilterChange,
      canManage: params.canManage,
      summary: listViewModel.screenSummary,
      orders: listViewModel.filteredOrderList,
      customerOptions: listViewModel.customerOptions,
      customerPhoneByRemoteId: listViewModel.customerPhoneByRemoteId,
      productOptions: listViewModel.productOptions,
      productPriceByRemoteId: listViewModel.productPriceByRemoteId,
      statusOptions: listViewModel.statusOptions,
      paymentMethodOptions: listViewModel.paymentMethodOptions,
      isEditorVisible: editorViewModel.isEditorVisible,
      editorMode: editorViewModel.editorMode,
      form: editorViewModel.form,
      formPricingPreview: editorViewModel.formPricingPreview,
      isDetailVisible: detailsViewModel.isDetailVisible,
      detail: detailsViewModel.detail,
      isStatusModalVisible: moneyActionViewModel.isStatusModalVisible,
      statusDraft: moneyActionViewModel.statusDraft,
      moneyForm: moneyActionViewModel.moneyForm,
      moneyAccountOptions: listViewModel.moneyAccountOptions,
      onRefresh: listViewModel.loadAll,
      onOpenCreate: editorViewModel.onOpenCreate,
      onOpenEdit: editorViewModel.onOpenEdit,
      onOpenDetail: detailsViewModel.onOpenDetail,
      onCloseEditor: editorViewModel.onCloseEditor,
      onCloseDetail,
      onFormChange: editorViewModel.onFormChange,
      onLineItemChange: editorViewModel.onLineItemChange,
      onAddLineItem: editorViewModel.onAddLineItem,
      onRemoveLineItem: editorViewModel.onRemoveLineItem,
      onSubmit: editorViewModel.onSubmit,
      onDelete,
      onOpenStatusModal: moneyActionViewModel.onOpenStatusModal,
      onCloseStatusModal: moneyActionViewModel.onCloseStatusModal,
      onStatusDraftChange: moneyActionViewModel.onStatusDraftChange,
      onSubmitStatus: moneyActionViewModel.onSubmitStatus,
      onCancelOrder: moneyActionViewModel.onCancelOrder,
      onReturnOrder: moneyActionViewModel.onReturnOrder,
      onOpenMoneyAction: moneyActionViewModel.onOpenMoneyAction,
      onCloseMoneyAction: moneyActionViewModel.onCloseMoneyAction,
      onMoneyFormChange: moneyActionViewModel.onMoneyFormChange,
      onSubmitMoneyAction: moneyActionViewModel.onSubmitMoneyAction,
    }),
    [
      detailsViewModel,
      editorViewModel,
      listViewModel,
      moneyActionViewModel,
      onCloseDetail,
      onDelete,
      params.canManage,
    ],
  );
};
