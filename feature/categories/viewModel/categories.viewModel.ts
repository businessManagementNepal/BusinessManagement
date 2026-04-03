import { Category, CategoryKindValue } from "@/feature/categories/types/category.types";

export type CategoryFormState = {
  remoteId: string | null;
  name: string;
  kind: CategoryKindValue;
  description: string;
};

export interface CategoriesViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  categories: readonly Category[];
  filteredCategories: readonly Category[];
  selectedKind: "all" | CategoryKindValue;
  canCreate: boolean;
  isEditorVisible: boolean;
  editorMode: "create" | "edit";
  editorTitle: string;
  form: CategoryFormState;
  onRefresh: () => Promise<void>;
  onFilterChange: (value: "all" | CategoryKindValue) => void;
  onOpenCreate: () => void;
  onOpenEdit: (category: Category) => void;
  onCloseEditor: () => void;
  onFormChange: (field: keyof CategoryFormState, value: string) => void;
  onSubmit: () => Promise<void>;
}
