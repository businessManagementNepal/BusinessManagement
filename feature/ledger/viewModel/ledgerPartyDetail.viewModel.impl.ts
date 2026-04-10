import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { GetLedgerEntriesByPartyUseCase } from "@/feature/ledger/useCase/getLedgerEntriesByParty.useCase";
import { LedgerEntryType } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerPartyDetailViewModel } from "./ledgerPartyDetail.viewModel";
import { buildLedgerPartyBalances, buildLedgerPartyDetailState } from "./ledger.shared";
import { buildLedgerStatementHtml } from "@/feature/ledger/ui/printLedgerStatement.util";

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

  const handleShareStatement = useCallback(async () => {
    if (!state) {
      return;
    }

    const generatedAtLabel = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = buildLedgerStatementHtml({
      state,
      generatedAtLabel,
    });

    try {
      if (Platform.OS === "web") {
        const popup = window.open("", "_blank", "width=900,height=700");
        if (!popup) {
          setErrorMessage("Unable to open statement preview. Please allow popups.");
          return;
        }
        popup.document.open();
        popup.document.write(html);
        popup.document.close();
        popup.focus();
        setTimeout(() => popup.print(), 250);
        return;
      }

      const result = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (!(await Sharing.isAvailableAsync())) {
        setErrorMessage("Sharing is not available on this device.");
        return;
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: `${state.partyName} Statement`,
      });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to generate statement PDF.",
      );
    }
  }, [state]);

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
      onShareStatement: handleShareStatement,
    }),
    [
      errorMessage,
      handleQuickCollect,
      handleQuickPaymentOut,
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
