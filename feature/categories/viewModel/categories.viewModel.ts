import { Category, CategoryKindValue } from "@/feature/categories/types/category.types";

export type CategoryFormFieldName = "name" | "kind";

export type CategoryFormFieldErrors = Partial<
  Record<CategoryFormFieldName, string>
>;

export type CategoryFormState = {
  remoteId: string | null;
  name: string;
  kind: CategoryKindValue;
  description: string;
  fieldErrors: CategoryFormFieldErrors;
};

export interface CategoriesViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  categories: readonly Category[];
  filteredCategories: readonly Category[];
  selectedKind: "all" | CategoryKindValue;
  allowedKinds: readonly CategoryKindValue[];
  canCreate: boolean;
  isEditorVisible: boolean;
  editorMode: "create" | "edit";
  editorTitle: string;
  form: CategoryFormState;
  isDeleteModalVisible: boolean;
  pendingDeleteCategoryName: string | null;
  deleteErrorMessage: string | null;
  isDeleting: boolean;
  onRefresh: () => Promise<void>;
  onFilterChange: (value: "all" | CategoryKindValue) => void;
  onOpenCreate: () => void;
  onOpenEdit: (category: Category) => void;
  onCloseEditor: () => void;
  onFormChange: (
    field: keyof Omit<CategoryFormState, "fieldErrors">,
    value: string,
  ) => void;
  onSubmit: () => Promise<void>;
  onRequestDeleteFromEditor: () => void;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => Promise<void>;
}
