import {
  BudgetError,
  BudgetValidationError,
} from "@/feature/budget/types/budget.types";
import { Result } from "@/shared/types/result.types";

const BUDGET_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const MIN_BUDGET_YEAR = 2000;
const MAX_BUDGET_YEAR = 2100;

export function validateBudgetMonth(
  value: string,
): Result<string, BudgetError> {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return {
      success: false,
      error: BudgetValidationError("Budget month is required."),
    };
  }

  const match = BUDGET_MONTH_PATTERN.exec(normalizedValue);

  if (!match) {
    return {
      success: false,
      error: BudgetValidationError("Budget month must use YYYY-MM format."),
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || year < MIN_BUDGET_YEAR || year > MAX_BUDGET_YEAR) {
    return {
      success: false,
      error: BudgetValidationError(
        `Budget year must be between ${MIN_BUDGET_YEAR} and ${MAX_BUDGET_YEAR}.`,
      ),
    };
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return {
      success: false,
      error: BudgetValidationError("Budget month must be between 01 and 12."),
    };
  }

  return {
    success: true,
    value: `${year}-${String(month).padStart(2, "0")}`,
  };
}
