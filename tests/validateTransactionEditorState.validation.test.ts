import {
  parseTransactionEditorDateInput,
  validateTransactionEditorState,
} from "@/feature/transactions/validation/validateTransactionEditorState";
import { describe, expect, it } from "vitest";

describe("parseTransactionEditorDateInput", () => {
  it("accepts valid calendar dates", () => {
    const result = parseTransactionEditorDateInput("2026-04-22");
    expect(result).not.toBeNull();
  });

  it("rejects impossible calendar dates", () => {
    expect(parseTransactionEditorDateInput("2026-02-30")).toBeNull();
    expect(parseTransactionEditorDateInput("2026-13-01")).toBeNull();
    expect(parseTransactionEditorDateInput("bad-date")).toBeNull();
  });
});

describe("validateTransactionEditorState", () => {
  it("returns inline errors for missing required fields on create", () => {
    const result = validateTransactionEditorState({
      mode: "create",
      title: "",
      accountRemoteId: "",
      settlementMoneyAccountRemoteId: "",
      categoryRemoteId: "",
      selectedAccountExists: false,
      selectedMoneyAccountExists: false,
      selectedCategoryExists: false,
      requiresCategory: true,
      amount: "0",
      happenedAt: "2026-02-30",
    });

    expect(result).toEqual({
      title: "Please enter a title.",
      accountRemoteId: "Please select an account.",
      settlementMoneyAccountRemoteId: "Please select a money account.",
      categoryRemoteId: "Please select a valid category.",
      amount: "Amount must be greater than zero.",
      happenedAt: "Please enter a valid date in YYYY-MM-DD format.",
    });
  });

  it("allows edit mode without forcing a new settlement money account", () => {
    const result = validateTransactionEditorState({
      mode: "edit",
      title: "Salary",
      accountRemoteId: "account-1",
      settlementMoneyAccountRemoteId: "",
      categoryRemoteId: "",
      selectedAccountExists: true,
      selectedMoneyAccountExists: true,
      selectedCategoryExists: false,
      requiresCategory: false,
      amount: "1000",
      happenedAt: "2026-04-22",
    });

    expect(result).toEqual({});
  });
});
