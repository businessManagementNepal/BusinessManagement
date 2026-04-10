import {
  LedgerBalanceDirection,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { PosPaymentResult } from "../types/pos.error.types";
import { CompletePaymentUseCase } from "./completePayment.useCase";
import {
  CompletePosCheckoutParams,
  CompletePosCheckoutUseCase,
} from "./completePosCheckout.useCase";
import { resolveCurrencyCode } from "@/shared/utils/currency/accountCurrency";

type CreateCompletePosCheckoutUseCaseParams = {
  completePaymentUseCase: CompletePaymentUseCase;
  addLedgerEntryUseCase: AddLedgerEntryUseCase;
};

const createLedgerEntryRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `pos-ledger-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const getTodayStartTimestamp = (): number => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const createCompletePosCheckoutUseCase = ({
  completePaymentUseCase,
  addLedgerEntryUseCase,
}: CreateCompletePosCheckoutUseCaseParams): CompletePosCheckoutUseCase => ({
  async execute(params: CompletePosCheckoutParams): Promise<PosPaymentResult> {
    const currencyCode = resolveCurrencyCode({
      currencyCode: params.activeAccountCurrencyCode,
      countryCode: params.activeAccountCountryCode,
    });

    const paymentResult = await completePaymentUseCase.execute({
      paidAmount: params.paidAmount,
      activeSettlementAccountRemoteId: params.activeSettlementAccountRemoteId,
    });

    if (!paymentResult.success) {
      return paymentResult;
    }

    const receipt = paymentResult.value;

    if (receipt.dueAmount <= 0) {
      return paymentResult;
    }

    const businessAccountRemoteId = params.activeBusinessAccountRemoteId?.trim();
    const ownerUserRemoteId = params.activeOwnerUserRemoteId?.trim();

    if (!businessAccountRemoteId || !ownerUserRemoteId) {
      return {
        success: true,
        value: {
          ...receipt,
          ledgerEffect: {
            ...receipt.ledgerEffect,
            type: "due_balance_create_failed",
          },
        },
      };
    }

    const ledgerResult = await addLedgerEntryUseCase.execute({
      remoteId: createLedgerEntryRemoteId(),
      businessAccountRemoteId,
      ownerUserRemoteId,
      partyName: "Walk-in Customer",
      partyPhone: null,
      entryType: LedgerEntryType.Sale,
      balanceDirection: LedgerBalanceDirection.Receive,
      title: `POS Sale ${receipt.receiptNumber}`,
      amount: receipt.dueAmount,
      currencyCode,
      note: `Unpaid balance from POS receipt ${receipt.receiptNumber}.`,
      happenedAt: Date.now(),
      dueAt: getTodayStartTimestamp(),
      paymentMode: null,
      referenceNumber: receipt.receiptNumber,
      reminderAt: null,
      attachmentUri: null,
      settledAgainstEntryRemoteId: null,
      linkedTransactionRemoteId: null,
      settlementAccountRemoteId: params.activeSettlementAccountRemoteId,
      settlementAccountDisplayNameSnapshot: null,
    });

    if (!ledgerResult.success) {
      return {
        success: true,
        value: {
          ...receipt,
          ledgerEffect: {
            ...receipt.ledgerEffect,
            type: "due_balance_create_failed",
          },
        },
      };
    }

    return {
      success: true,
      value: {
        ...receipt,
        ledgerEffect: {
          ...receipt.ledgerEffect,
          type: "due_balance_created",
        },
      },
    };
  },
});
