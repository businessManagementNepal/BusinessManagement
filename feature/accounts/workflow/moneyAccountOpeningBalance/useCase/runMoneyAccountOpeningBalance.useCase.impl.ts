import { MoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository";
import {
  MONEY_ACCOUNT_TYPE_OPTIONS,
  MoneyAccount,
  MoneyAccountErrorType,
  MoneyAccountResult,
  MoneyAccountValidationError,
  SaveMoneyAccountPayload,
} from "@/feature/accounts/types/moneyAccount.types";
import {
  TransactionDirection,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { PostMoneyMovementUseCase } from "@/feature/transactions/useCase/postMoneyMovement.useCase";
import { RunMoneyAccountOpeningBalanceWorkflowUseCase } from "./runMoneyAccountOpeningBalance.useCase";
import {
  MONEY_ACCOUNT_OPENING_BALANCE_CATEGORY,
  MONEY_ACCOUNT_OPENING_BALANCE_SOURCE_ACTION,
  RunMoneyAccountOpeningBalanceWorkflowInput,
} from "../types/moneyAccountOpeningBalance.types";

const ALLOWED_TYPE_SET = new Set(
  MONEY_ACCOUNT_TYPE_OPTIONS.map((option) => option.value),
);

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const createTransactionRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `txn-opening-${randomId}`;
  }

  return `txn-opening-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const createOpeningBalanceIdempotencyKey = (
  moneyAccountRemoteId: string,
): string => {
  return `money-account:${moneyAccountRemoteId}:opening-balance`;
};

const isRecoverablePendingOpeningBalance = ({
  existingAccount,
  normalizedOwnerUserRemoteId,
  normalizedScopeAccountRemoteId,
  openingBalance,
}: {
  existingAccount: MoneyAccount;
  normalizedOwnerUserRemoteId: string;
  normalizedScopeAccountRemoteId: string;
  openingBalance: number;
}): boolean => {
  return (
    openingBalance > 0 &&
    existingAccount.currentBalance === 0 &&
    existingAccount.ownerUserRemoteId === normalizedOwnerUserRemoteId &&
    existingAccount.scopeAccountRemoteId === normalizedScopeAccountRemoteId &&
    existingAccount.isActive
  );
};

const buildMoneyAccountUpsertPayload = ({
  remoteId,
  ownerUserRemoteId,
  scopeAccountRemoteId,
  scopeAccountDisplayNameSnapshot,
  name,
  type,
  currentBalance,
  description,
  currencyCode,
  isPrimary,
  isActive,
}: {
  remoteId: string;
  ownerUserRemoteId: string;
  scopeAccountRemoteId: string;
  scopeAccountDisplayNameSnapshot: string | null;
  name: string;
  type: RunMoneyAccountOpeningBalanceWorkflowInput["type"];
  currentBalance: number;
  description: string | null;
  currencyCode: string | null;
  isPrimary: boolean;
  isActive: boolean;
}): SaveMoneyAccountPayload => ({
  remoteId,
  ownerUserRemoteId,
  scopeAccountRemoteId,
  scopeAccountDisplayNameSnapshot,
  name,
  type,
  currentBalance,
  description,
  currencyCode,
  isPrimary,
  isActive,
});

const postOpeningBalanceAndRefresh = async ({
  moneyAccount,
  openingBalance,
  normalizedOwnerUserRemoteId,
  normalizedScopeAccountRemoteId,
  normalizedScopeAccountDisplayNameSnapshot,
  moneyAccountRepository,
  postMoneyMovementUseCase,
}: {
  moneyAccount: MoneyAccount;
  openingBalance: number;
  normalizedOwnerUserRemoteId: string;
  normalizedScopeAccountRemoteId: string;
  normalizedScopeAccountDisplayNameSnapshot: string;
  moneyAccountRepository: MoneyAccountRepository;
  postMoneyMovementUseCase: PostMoneyMovementUseCase;
}): Promise<MoneyAccountResult> => {
  if (openingBalance <= 0) {
    return {
      success: true,
      value: moneyAccount,
    };
  }

  const openingPostResult = await postMoneyMovementUseCase.execute({
    remoteId: createTransactionRemoteId(),
    ownerUserRemoteId: normalizedOwnerUserRemoteId,
    accountRemoteId: normalizedScopeAccountRemoteId,
    accountDisplayNameSnapshot: normalizedScopeAccountDisplayNameSnapshot,
    transactionType: TransactionType.Income,
    direction: TransactionDirection.In,
    title: `Opening balance - ${moneyAccount.name}`,
    amount: openingBalance,
    currencyCode: moneyAccount.currencyCode,
    categoryLabel: MONEY_ACCOUNT_OPENING_BALANCE_CATEGORY,
    note: "Initial balance entered when this money account was created.",
    happenedAt: Date.now(),
    settlementMoneyAccountRemoteId: moneyAccount.remoteId,
    settlementMoneyAccountDisplayNameSnapshot: moneyAccount.name,
    sourceModule: TransactionSourceModule.MoneyAccounts,
    sourceRemoteId: moneyAccount.remoteId,
    sourceAction: MONEY_ACCOUNT_OPENING_BALANCE_SOURCE_ACTION,
    idempotencyKey: createOpeningBalanceIdempotencyKey(
      moneyAccount.remoteId,
    ),
  });

  if (!openingPostResult.success) {
    return {
      success: false,
      error: MoneyAccountValidationError(
        openingPostResult.error.message,
      ),
    };
  }

  const refreshedResult =
    await moneyAccountRepository.getMoneyAccountByRemoteId(
      moneyAccount.remoteId,
    );

  return refreshedResult.success
    ? refreshedResult
    : {
        success: true,
        value: moneyAccount,
      };
};

type CreateRunMoneyAccountOpeningBalanceWorkflowUseCaseParams = {
  moneyAccountRepository: MoneyAccountRepository;
  postMoneyMovementUseCase: PostMoneyMovementUseCase;
};

export const createRunMoneyAccountOpeningBalanceWorkflowUseCase = ({
  moneyAccountRepository,
  postMoneyMovementUseCase,
}: CreateRunMoneyAccountOpeningBalanceWorkflowUseCaseParams): RunMoneyAccountOpeningBalanceWorkflowUseCase => ({
  async execute(
    payload: RunMoneyAccountOpeningBalanceWorkflowInput,
  ) {
    const normalizedRemoteId = normalizeRequired(payload.remoteId);
    const normalizedOwnerUserRemoteId = normalizeRequired(
      payload.ownerUserRemoteId,
    );
    const normalizedScopeAccountRemoteId = normalizeRequired(
      payload.scopeAccountRemoteId,
    );
    const normalizedScopeAccountDisplayNameSnapshot = normalizeOptional(
      payload.scopeAccountDisplayNameSnapshot ?? null,
    );
    const normalizedName = normalizeRequired(payload.name);
    const normalizedDescription = normalizeOptional(payload.description);
    const normalizedCurrencyCode = normalizeOptional(payload.currencyCode);
    const openingBalance = payload.currentBalance;

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: MoneyAccountValidationError("Remote id is required."),
      };
    }

    if (!normalizedOwnerUserRemoteId) {
      return {
        success: false,
        error: MoneyAccountValidationError(
          "Owner user remote id is required.",
        ),
      };
    }

    if (!normalizedScopeAccountRemoteId) {
      return {
        success: false,
        error: MoneyAccountValidationError("Scope account is required."),
      };
    }

    if (!normalizedName) {
      return {
        success: false,
        error: MoneyAccountValidationError("Account name is required."),
      };
    }

    if (!ALLOWED_TYPE_SET.has(payload.type)) {
      return {
        success: false,
        error: MoneyAccountValidationError("Account type is invalid."),
      };
    }

    if (!Number.isFinite(openingBalance)) {
      return {
        success: false,
        error: MoneyAccountValidationError("Opening balance is required."),
      };
    }

    if (openingBalance < 0) {
      return {
        success: false,
        error: MoneyAccountValidationError(
          "Opening balance cannot be negative.",
        ),
      };
    }

    if (
      openingBalance > 0 &&
      !normalizedScopeAccountDisplayNameSnapshot
    ) {
      return {
        success: false,
        error: MoneyAccountValidationError("Account label is required."),
      };
    }

    const existingResult =
      await moneyAccountRepository.getMoneyAccountByRemoteId(
        normalizedRemoteId,
      );

    if (existingResult.success) {
      const existingAccount = existingResult.value;

      if (
        !isRecoverablePendingOpeningBalance({
          existingAccount,
          normalizedOwnerUserRemoteId,
          normalizedScopeAccountRemoteId,
          openingBalance,
        })
      ) {
        return {
          success: false,
          error: MoneyAccountValidationError(
            "Opening balance workflow can only run for a new money account or a recoverable pending opening balance.",
          ),
        };
      }

      const ensuredAccountResult =
        await moneyAccountRepository.saveMoneyAccount(
          buildMoneyAccountUpsertPayload({
            remoteId: normalizedRemoteId,
            ownerUserRemoteId: normalizedOwnerUserRemoteId,
            scopeAccountRemoteId: normalizedScopeAccountRemoteId,
            scopeAccountDisplayNameSnapshot:
              normalizedScopeAccountDisplayNameSnapshot,
            name: normalizedName,
            type: payload.type,
            currentBalance: existingAccount.currentBalance,
            description: normalizedDescription,
            currencyCode: normalizedCurrencyCode,
            isPrimary: payload.isPrimary,
            isActive: payload.isActive,
          }),
        );

      if (!ensuredAccountResult.success) {
        return ensuredAccountResult;
      }

      return postOpeningBalanceAndRefresh({
        moneyAccount: ensuredAccountResult.value,
        openingBalance,
        normalizedOwnerUserRemoteId,
        normalizedScopeAccountRemoteId,
        normalizedScopeAccountDisplayNameSnapshot:
          normalizedScopeAccountDisplayNameSnapshot as string,
        moneyAccountRepository,
        postMoneyMovementUseCase,
      });
    }

    if (
      existingResult.error.type !==
      MoneyAccountErrorType.MoneyAccountNotFound
    ) {
      return existingResult;
    }

    const saveResult = await moneyAccountRepository.saveMoneyAccount(
      buildMoneyAccountUpsertPayload({
        remoteId: normalizedRemoteId,
        ownerUserRemoteId: normalizedOwnerUserRemoteId,
        scopeAccountRemoteId: normalizedScopeAccountRemoteId,
        scopeAccountDisplayNameSnapshot:
          normalizedScopeAccountDisplayNameSnapshot,
        name: normalizedName,
        type: payload.type,
        currentBalance: 0,
        description: normalizedDescription,
        currencyCode: normalizedCurrencyCode,
        isPrimary: payload.isPrimary,
        isActive: payload.isActive,
      }),
    );

    if (!saveResult.success) {
      return saveResult;
    }

    return postOpeningBalanceAndRefresh({
      moneyAccount: saveResult.value,
      openingBalance,
      normalizedOwnerUserRemoteId,
      normalizedScopeAccountRemoteId,
      normalizedScopeAccountDisplayNameSnapshot:
        normalizedScopeAccountDisplayNameSnapshot as string,
      moneyAccountRepository,
      postMoneyMovementUseCase,
    });
  },
});
