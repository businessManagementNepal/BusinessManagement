import { CategoryKind } from "@/feature/categories/types/category.types";
import { validateCategoryForm } from "@/feature/categories/validation/validateCategoryForm";
import { describe, expect, it } from "vitest";

describe("validateCategoryForm", () => {
  it("returns inline errors for missing required fields", () => {
    const result = validateCategoryForm({
      name: "",
      kind: CategoryKind.Income,
      allowedKinds: [CategoryKind.Income, CategoryKind.Expense],
    });

    expect(result).toEqual({
      name: "Category name is required.",
    });
  });

  it("returns inline error when selected kind is not allowed", () => {
    const result = validateCategoryForm({
      name: "Sales",
      kind: CategoryKind.Product,
      allowedKinds: [CategoryKind.Income, CategoryKind.Expense],
    });

    expect(result).toEqual({
      kind: "Selected category type is not allowed.",
    });
  });

  it("passes valid values", () => {
    const result = validateCategoryForm({
      name: "Sales",
      kind: CategoryKind.Income,
      allowedKinds: [CategoryKind.Income, CategoryKind.Expense],
    });

    expect(result).toEqual({});
  });
});
