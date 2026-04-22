import { parseDateInput } from "@/feature/emiLoans/viewModel/emi.shared";
import { EmiPlanEditorFieldErrors } from "@/feature/emiLoans/types/emi.state.types";

type ValidateEmiPlanEditorStateParams = {
  title: string;
  totalAmount: string;
  installmentCount: string;
  firstDueAt: string;
  reminderEnabled: boolean;
  reminderDaysBefore: string;
};

const parseDecimalInput = (value: string): number | null => {
  const normalizedValue = value.trim().replace(/,/g, "");
  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const parseIntegerInput = (value: string): number | null => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  if (!/^-?\d+$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isInteger(parsedValue) ? parsedValue : null;
};

export const validateEmiPlanEditorState = ({
  title,
  totalAmount,
  installmentCount,
  firstDueAt,
  reminderEnabled,
  reminderDaysBefore,
}: ValidateEmiPlanEditorStateParams): EmiPlanEditorFieldErrors => {
  const nextFieldErrors: EmiPlanEditorFieldErrors = {};

  if (!title.trim()) {
    nextFieldErrors.title = "Please enter a plan title.";
  }

  const parsedTotalAmount = parseDecimalInput(totalAmount);
  if (parsedTotalAmount === null) {
    nextFieldErrors.totalAmount = "Amount is required.";
  } else if (parsedTotalAmount <= 0) {
    nextFieldErrors.totalAmount = "Amount must be greater than zero.";
  }

  const parsedInstallmentCount = parseIntegerInput(installmentCount);
  if (parsedInstallmentCount === null) {
    nextFieldErrors.installmentCount =
      "Installment count must be a whole number.";
  } else if (parsedInstallmentCount <= 0) {
    nextFieldErrors.installmentCount =
      "Installment count must be greater than zero.";
  }

  if (parseDateInput(firstDueAt) === null) {
    nextFieldErrors.firstDueAt =
      "Please enter the first due date in YYYY-MM-DD format.";
  }

  if (reminderEnabled) {
    const parsedReminderDaysBefore = parseIntegerInput(reminderDaysBefore);
    if (parsedReminderDaysBefore === null) {
      nextFieldErrors.reminderDaysBefore =
        "Reminder days must be a whole number.";
    } else if (parsedReminderDaysBefore < 1) {
      nextFieldErrors.reminderDaysBefore =
        "Reminder days must be at least 1.";
    }
  }

  return nextFieldErrors;
};
