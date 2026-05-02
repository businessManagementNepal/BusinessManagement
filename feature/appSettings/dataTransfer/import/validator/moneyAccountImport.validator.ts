import {
  MONEY_ACCOUNT_TYPE_OPTIONS,
  MoneyAccountTypeValue,
} from "@/feature/accounts/types/moneyAccount.types";
import {
  ImportPreviewRowStatus,
  ImportRowPreview,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import {
  getBooleanValue,
  getNumberValue,
  getTextValue,
} from "../parser/importParser.shared";

const MONEY_ACCOUNT_TYPE_SET = new Set(
  MONEY_ACCOUNT_TYPE_OPTIONS.map((option) => option.value),
);

type MoneyAccountValidationContext = {
  existingNames: Set<string>;
  seenNames: Set<string>;
};

export const validateMoneyAccountImportRow = (
  rowNumber: number,
  row: Record<string, unknown>,
  context: MoneyAccountValidationContext,
): ImportRowPreview => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = getTextValue(row, ["name", "account_name"]);
  const typeValue =
    getTextValue(row, ["type", "account_type"])?.toLowerCase() ?? null;
  const currentBalance =
    getNumberValue(row, ["opening_balance", "current_balance", "balance"]) ?? 0;
  const description = getTextValue(row, ["description", "notes"]);
  const currencyCode = getTextValue(row, ["currency", "currency_code"]);
  const isPrimary = getBooleanValue(row, ["is_primary", "primary"]) ?? false;
  const isActive = getBooleanValue(row, ["is_active", "active"]) ?? true;
  const normalizedType = typeValue as MoneyAccountTypeValue | null;

  if (!name) {
    errors.push("Money account name is required.");
  }

  if (
    normalizedType === null ||
    !MONEY_ACCOUNT_TYPE_SET.has(normalizedType)
  ) {
    errors.push("Money account type is invalid.");
  }

  if (!Number.isFinite(currentBalance)) {
    errors.push("Opening balance must be a valid number.");
  } else if (currentBalance < 0) {
    errors.push("Opening balance cannot be negative.");
  }

  const normalizedNameKey = name?.trim().toLowerCase() ?? null;
  if (normalizedNameKey) {
    if (context.existingNames.has(normalizedNameKey)) {
      errors.push("Money account name already exists in this account.");
    }

    if (context.seenNames.has(normalizedNameKey)) {
      errors.push("Money account name is duplicated in this import file.");
    }
  }

  if (errors.length === 0 && normalizedNameKey) {
    context.seenNames.add(normalizedNameKey);
  }

  const normalizedData = {
    name: name ?? "",
    type: normalizedType,
    currentBalance,
    description,
    currencyCode,
    isPrimary,
    isActive,
  };

  const status =
    errors.some((message) => message.toLowerCase().includes("exists") || message.toLowerCase().includes("duplicated"))
      ? ImportPreviewRowStatus.Duplicate
      : errors.length > 0
        ? ImportPreviewRowStatus.Invalid
        : warnings.length > 0
          ? ImportPreviewRowStatus.Warning
          : ImportPreviewRowStatus.Valid;

  return {
    rowNumber,
    status,
    errors,
    warnings,
    normalizedData,
  };
};
