import { TransactionEditorFieldErrors } from "@/feature/transactions/types/transaction.state.types";

type ValidateTransactionEditorStateParams = {
  mode: "create" | "edit";
  title: string;
  accountRemoteId: string;
  settlementMoneyAccountRemoteId: string;
  categoryRemoteId: string;
  selectedAccountExists: boolean;
  selectedMoneyAccountExists: boolean;
  selectedCategoryExists: boolean;
  requiresCategory: boolean;
  amount: string;
  happenedAt: string;
};

export const parseTransactionEditorDateInput = (
  value: string,
): number | null => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const [yearText, monthText, dayText] = normalizedValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.getTime();
};

export const validateTransactionEditorState = ({
  mode,
  title,
  accountRemoteId,
  settlementMoneyAccountRemoteId,
  categoryRemoteId,
  selectedAccountExists,
  selectedMoneyAccountExists,
  selectedCategoryExists,
  requiresCategory,
  amount,
  happenedAt,
}: ValidateTransactionEditorStateParams): TransactionEditorFieldErrors => {
  const nextFieldErrors: TransactionEditorFieldErrors = {};
  const parsedAmount = Number(amount.replace(/,/g, "").trim());
  const parsedDate = parseTransactionEditorDateInput(happenedAt);

  if (!title.trim()) {
    nextFieldErrors.title = "Please enter a title.";
  }

  if (!accountRemoteId.trim() || !selectedAccountExists) {
    nextFieldErrors.accountRemoteId = "Please select an account.";
  }

  if (mode === "create" && settlementMoneyAccountRemoteId.trim().length === 0) {
    nextFieldErrors.settlementMoneyAccountRemoteId =
      "Please select a money account.";
  }

  if (
    settlementMoneyAccountRemoteId.trim().length > 0 &&
    !selectedMoneyAccountExists
  ) {
    nextFieldErrors.settlementMoneyAccountRemoteId =
      "Please select a valid money account.";
  }

  if (
    requiresCategory &&
    (!categoryRemoteId.trim() || !selectedCategoryExists)
  ) {
    nextFieldErrors.categoryRemoteId = "Please select a valid category.";
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    nextFieldErrors.amount = "Amount must be greater than zero.";
  }

  if (parsedDate === null) {
    nextFieldErrors.happenedAt =
      "Please enter a valid date in YYYY-MM-DD format.";
  }

  return nextFieldErrors;
};
