import { useCallback, useState } from "react";
import { buildOrderDetailView } from "./ordersPresentation.helpers";
import {
  OrderDetailsViewModelParams,
  OrderDetailsViewModelState,
} from "./orderDetails.viewModel";

export const useOrderDetailsViewModel = ({
  accountRemoteId,
  ownerUserRemoteId,
  accountCountryCode,
  resolvedCurrencyCode,
  taxRatePercent,
  contactsByRemoteId,
  productsByRemoteId,
  getOrderByIdUseCase,
  getOrderSettlementSnapshotsUseCase,
  setErrorMessage,
}: OrderDetailsViewModelParams): OrderDetailsViewModelState => {
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [detail, setDetail] = useState<OrderDetailsViewModelState["detail"]>(
    null,
  );

  const refreshDetail = useCallback(
    async (remoteId: string) => {
      const orderResult = await getOrderByIdUseCase.execute(remoteId);
      if (!orderResult.success) {
        setErrorMessage(orderResult.error.message);
        setDetail(null);
        return;
      }

      let settlementSnapshot = null;

      if (accountRemoteId) {
        const settlementSnapshotsResult =
          await getOrderSettlementSnapshotsUseCase.execute({
            accountRemoteId,
            ownerUserRemoteId,
            orders: [orderResult.value],
            attemptLegacyRepair: false,
          });

        if (!settlementSnapshotsResult.success) {
          setErrorMessage(settlementSnapshotsResult.error.message);
          setDetail(null);
          return;
        }

        settlementSnapshot =
          settlementSnapshotsResult.value[orderResult.value.remoteId] ?? null;
      }

      setDetail(
        buildOrderDetailView({
          order: orderResult.value,
          settlementSnapshot,
          contactsByRemoteId,
          productsByRemoteId,
          taxRatePercent,
          currencyCode: resolvedCurrencyCode,
          countryCode: accountCountryCode,
        }),
      );
      setErrorMessage(null);
    },
    [
      accountCountryCode,
      accountRemoteId,
      contactsByRemoteId,
      getOrderByIdUseCase,
      getOrderSettlementSnapshotsUseCase,
      ownerUserRemoteId,
      productsByRemoteId,
      resolvedCurrencyCode,
      setErrorMessage,
      taxRatePercent,
    ],
  );

  const onOpenDetail = useCallback(
    async (remoteId: string) => {
      setIsDetailVisible(true);
      await refreshDetail(remoteId);
    },
    [refreshDetail],
  );

  const onCloseDetail = useCallback(() => {
    setIsDetailVisible(false);
    setDetail(null);
  }, []);

  return {
    isDetailVisible,
    detail,
    onOpenDetail,
    onCloseDetail,
    refreshDetail,
  };
};
