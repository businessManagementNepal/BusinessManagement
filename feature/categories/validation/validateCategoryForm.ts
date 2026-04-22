import { CategoryKindValue } from "@/feature/categories/types/category.types";
import { CategoryFormFieldErrors } from "@/feature/categories/viewModel/categories.viewModel";

type ValidateCategoryFormParams = {
  name: string;
  kind: CategoryKindValue;
  allowedKinds: readonly CategoryKindValue[];
};

export const validateCategoryForm = ({
  name,
  kind,
  allowedKinds,
}: ValidateCategoryFormParams): CategoryFormFieldErrors => {
  const nextFieldErrors: CategoryFormFieldErrors = {};

  if (!name.trim()) {
    nextFieldErrors.name = "Category name is required.";
  }

  if (!allowedKinds.includes(kind)) {
    nextFieldErrors.kind = "Selected category type is not allowed.";
  }

  return nextFieldErrors;
};
