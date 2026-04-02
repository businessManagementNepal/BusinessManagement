import { useCallback, useMemo, useState } from "react";
import { GetLedgerEntriesByPartyUseCase } from "@/feature/ledger/useCase/getLedgerEntriesByParty.useCase";
import { LedgerEntryType } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerPartyDetailViewModel } from "./ledgerPartyDetail.viewModel";
import { buildLedgerPartyBalances, buildLedgerPartyDetailState } from "./ledger.shared";

type UseLedgerPartyDetailViewModelParams = {
  businessAccountRemoteId: string;
  getLedgerEntriesByPartyUseCase: GetLedgerEntriesByPartyUseCase;
  onOpenEdit: (remoteId: string) => void;
  onOpenDelete: (remoteId: string) => void;
  onOpenCreateForParty: (
    partyName: string,
    partyPhone: string | null,
    entryType: typeof LedgerEntryType.Collection | typeof LedgerEntryType.PaymentOut,
  ) => void;
};

export const useLedgerPartyDetailViewModel = ({
  businessAccountRemoteId,
  getLedgerEntriesByPartyUseCase,
  onOpenEdit,
  onOpenCreateForParty,
  onOpenDelete,
}: UseLedgerPartyDetailViewModelParams): LedgerPartyDetailViewModel => {
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [state, setState] = useState<ReturnType<typeof buildLedgerPartyDetailState> | null>(
    null,
  );

  const openPartyDetail = useCallback(
    async (partyId: string, partyName: string) => {
      setVisible(true);
      setIsLoading(true);
      setErrorMessage(null);

      const result = await getLedgerEntriesByPartyUseCase.execute({
        businessAccountRemoteId,
        partyName,
      });

      if (!result.success) {
        setIsLoading(false);
        setErrorMessage(result.error.message);
        setState(null);
        return;
      }

      const derivedPartyBalance = buildLedgerPartyBalances(result.value).find(
        (partyBalance) => partyBalance.id === partyId,
      );

      if (!derivedPartyBalance) {
        setErrorMessage("Party detail was not found.");
        setState(null);
        setIsLoading(false);
        return;
      }

      setState(buildLedgerPartyDetailState(derivedPartyBalance, result.value));
      setIsLoading(false);
    },
    [businessAccountRemoteId, getLedgerEntriesByPartyUseCase],
  );

  const close = useCallback(() => {
    setVisible(false);
    setIsLoading(false);
    setErrorMessage(null);
    setState(null);
  }, []);

  const handleQuickCollect = useCallback(() => {
    if (!state) {
      return;
    }

    setVisible(false);
    onOpenCreateForParty(
      state.partyName,
      state.partyPhone,
      LedgerEntryType.Collection,
    );
  }, [onOpenCreateForParty, state]);

  const handleQuickPaymentOut = useCallback(() => {
    if (!state) {
      return;
    }

    setVisible(false);
    onOpenCreateForParty(
      state.partyName,
      state.partyPhone,
      LedgerEntryType.PaymentOut,
    );
  }, [onOpenCreateForParty, state]);

  return useMemo(
    () => ({
      visible,
      isLoading,
      errorMessage,
      state,
      openPartyDetail,
      close,
      onOpenEdit,
      onOpenDelete,
      onQuickCollect: handleQuickCollect,
      onQuickPaymentOut: handleQuickPaymentOut,
    }),
    [
      errorMessage,
      handleQuickCollect,
      handleQuickPaymentOut,
      isLoading,
      onOpenDelete,
      onOpenEdit,
      openPartyDetail,
      state,
      visible,
      close,
    ],
  );
};
