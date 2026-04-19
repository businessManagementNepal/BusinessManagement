import { MoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository";
import {
  MONEY_ACCOUNT_TYPE_OPTIONS,
  MoneyAccount,
  MoneyAccountErrorType,
  MoneyAccountValidationError,
  SaveMoneyAccountPayload,
} from "@/feature/accounts/types/moneyAccount.types";
import { RunMoneyAccountOpeningBalanceWorkflowUseCase } from "@/feature/accounts/workflow/moneyAccountOpeningBalance/useCase/runMoneyAccountOpeningBalance.useCase";
import { SaveMoneyAccountUseCase } from "./saveMoneyAccount.useCase";

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const ALLOWED_TYPE_SET = new Set(
  MONEY_ACCOUNT_TYPE_OPTIONS.map((option) => option.value),
);

const shouldResumeOpeningBalanceRecovery = ({
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

type CreateSaveMoneyAccountUseCaseParams = {
  repository: MoneyAccountRepository;
  runMoneyAccountOpeningBalanceWorkflowUseCase: RunMoneyAccountOpeningBalanceWorkflowUseCase;
};

export const createSaveMoneyAccountUseCase = ({
  repository,
  runMoneyAccountOpeningBalanceWorkflowUseCase,
}: CreateSaveMoneyAccountUseCaseParams): SaveMoneyAccountUseCase => ({
  async execute(payload: SaveMoneyAccountPayload) {
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
        error: MoneyAccountValidationError("Owner user remote id is required."),
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

    const existingResult =
      await repository.getMoneyAccountByRemoteId(normalizedRemoteId);
    const existingAccount = existingResult.success
      ? existingResult.value
      : null;

    if (
      !existingResult.success &&
      existingResult.error.type !== MoneyAccountErrorType.MoneyAccountNotFound
    ) {
      return existingResult;
    }

    if (!existingAccount) {
      return runMoneyAccountOpeningBalanceWorkflowUseCase.execute({
        remoteId: normalizedRemoteId,
        ownerUserRemoteId: normalizedOwnerUserRemoteId,
        scopeAccountRemoteId: normalizedScopeAccountRemoteId,
        scopeAccountDisplayNameSnapshot:
          normalizedScopeAccountDisplayNameSnapshot,
        name: normalizedName,
        type: payload.type,
        currentBalance: openingBalance,
        description: normalizedDescription,
        currencyCode: normalizedCurrencyCode,
        isPrimary: payload.isPrimary,
        isActive: payload.isActive,
      });
    }

    if (
      shouldResumeOpeningBalanceRecovery({
        existingAccount,
        normalizedOwnerUserRemoteId,
        normalizedScopeAccountRemoteId,
        openingBalance,
      })
    ) {
      return runMoneyAccountOpeningBalanceWorkflowUseCase.execute({
        remoteId: normalizedRemoteId,
        ownerUserRemoteId: normalizedOwnerUserRemoteId,
        scopeAccountRemoteId: normalizedScopeAccountRemoteId,
        scopeAccountDisplayNameSnapshot:
          normalizedScopeAccountDisplayNameSnapshot,
        name: normalizedName,
        type: payload.type,
        currentBalance: openingBalance,
        description: normalizedDescription,
        currencyCode: normalizedCurrencyCode,
        isPrimary: payload.isPrimary,
        isActive: payload.isActive,
      });
    }

    return repository.saveMoneyAccount({
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
    });
  },
});
