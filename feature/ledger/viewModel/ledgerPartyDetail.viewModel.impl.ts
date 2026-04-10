import { useCallback, useMemo, useState } from "react";
import { GetLedgerEntriesByPartyUseCase } from "@/feature/ledger/useCase/getLedgerEntriesByParty.useCase";
import { LedgerEntryType } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerPartyDetailViewModel } from "./ledgerPartyDetail.viewModel";
import { buildLedgerPartyBalances, buildLedgerPartyDetailState } from "./ledger.shared";
import { buildLedgerStatementHtml } from "@/feature/ledger/ui/printLedgerStatement.util";
import { exportDocument } from "@/shared/utils/document/exportDocument";

type UseLedgerPartyDetailViewModelParams = {
  businessAccountRemoteId: string;
  getLedgerEntriesByPartyUseCase: GetLedgerEntriesByPartyUseCase;
  onOpenEdit: (remoteId: string) => void;
  onOpenDelete: (remoteId: string) => void;
  onOpenCreateForParty: (
    partyName: string,
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
      LedgerEntryType.PaymentOut,
    );
  }, [onOpenCreateForParty, state]);

  const getStatementHtml = useCallback(() => {
    if (!state) {
      return null;
    }

    const generatedAtLabel = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return buildLedgerStatementHtml({
      state,
      generatedAtLabel,
    });
  }, [state]);

  const handleSaveStatement = useCallback(async () => {
    const html = getStatementHtml();
    if (!html || !state) {
      return;
    }
    const result = await exportDocument({
      html,
      fileName: `ledger_statement_${state.partyName}`,
      title: `${state.partyName} Statement`,
      action: "save",
    });
    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }
    setErrorMessage(null);
  }, [getStatementHtml, state]);

  const handleShareStatement = useCallback(async () => {
    const html = getStatementHtml();
    if (!html || !state) {
      return;
    }
    const result = await exportDocument({
      html,
      fileName: `ledger_statement_${state.partyName}`,
      title: `${state.partyName} Statement`,
      action: "share",
    });
    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }
    setErrorMessage(null);
  }, [getStatementHtml, state]);

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
      onSaveStatement: handleSaveStatement,
      onShareStatement: handleShareStatement,
    }),
    [
      errorMessage,
      handleQuickCollect,
      handleQuickPaymentOut,
      handleSaveStatement,
      handleShareStatement,
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
