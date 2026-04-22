import { validateEmiPlanEditorState } from "@/feature/emiLoans/validation/validateEmiPlanEditorState";
import { describe, expect, it } from "vitest";

describe("validateEmiPlanEditorState", () => {
  it("returns inline errors for missing required fields", () => {
    const result = validateEmiPlanEditorState({
      title: "",
      totalAmount: "",
      installmentCount: "",
      firstDueAt: "",
      reminderEnabled: true,
      reminderDaysBefore: "",
    });

    expect(result).toEqual({
      title: "Please enter a plan title.",
      totalAmount: "Amount is required.",
      installmentCount: "Installment count must be a whole number.",
      firstDueAt: "Please enter the first due date in YYYY-MM-DD format.",
      reminderDaysBefore: "Reminder days must be a whole number.",
    });
  });

  it("returns inline errors for invalid numeric values", () => {
    const result = validateEmiPlanEditorState({
      title: "Phone EMI",
      totalAmount: "-100",
      installmentCount: "2.5",
      firstDueAt: "2026-02-30",
      reminderEnabled: true,
      reminderDaysBefore: "0",
    });

    expect(result).toEqual({
      totalAmount: "Amount must be greater than zero.",
      installmentCount: "Installment count must be a whole number.",
      firstDueAt: "Please enter the first due date in YYYY-MM-DD format.",
      reminderDaysBefore: "Reminder days must be at least 1.",
    });
  });

  it("passes valid values and ignores reminder days when reminder is off", () => {
    const result = validateEmiPlanEditorState({
      title: "Phone EMI",
      totalAmount: "50000",
      installmentCount: "12",
      firstDueAt: "2026-05-01",
      reminderEnabled: false,
      reminderDaysBefore: "",
    });

    expect(result).toEqual({});
  });
});
