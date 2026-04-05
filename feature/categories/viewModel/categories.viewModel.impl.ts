import {
  CATEGORY_FILTER_OPTIONS,
  Category,
  CategoryKind,
  CategoryKindValue,
  CategoryScope,
} from "@/feature/categories/types/category.types";
import { GetCategoriesUseCase } from "@/feature/categories/useCase/getCategories.useCase";
import { SaveCategoryUseCase } from "@/feature/categories/useCase/saveCategory.useCase";
import { AccountType, AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoriesViewModel, CategoryFormState } from "./categories.viewModel";

const EMPTY_FORM: CategoryFormState = {
  remoteId: null,
  name: "",
  kind: CategoryKind.Income,
  description: "",
};

const mapCategoryToForm = (category: Category): CategoryFormState => ({
  remoteId: category.remoteId,
  name: category.name,
  kind: category.kind,
  description: category.description ?? "",
});

type Params = {
  ownerUserRemoteId: string | null;
  accountRemoteId: string | null;
  accountType: AccountTypeValue | null;
  canManage: boolean;
  getCategoriesUseCase: GetCategoriesUseCase;
  saveCategoryUseCase: SaveCategoryUseCase;
};

export const useCategoriesViewModel = ({
  ownerUserRemoteId,
  accountRemoteId,
  accountType,
  canManage,
  getCategoriesUseCase,
  saveCategoryUseCase,
}: Params): CategoriesViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedKind, setSelectedKind] = useState<"all" | CategoryKindValue>("all");
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);

  const allowedKinds = useMemo<readonly CategoryKindValue[]>(() => {
    if (accountType === AccountType.Business) {
      return [
        CategoryKind.Income,
        CategoryKind.Expense,
        CategoryKind.Business,
        CategoryKind.Product,
      ];
    }

    return [CategoryKind.Income, CategoryKind.Expense];
  }, [accountType]);

  const loadCategories = useCallback(async () => {
    if (!ownerUserRemoteId || !accountRemoteId || !accountType) {
      setCategories([]);
      setErrorMessage("An active account is required to manage categories.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await getCategoriesUseCase.execute({
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
    });

    if (!result.success) {
      setCategories([]);
      setErrorMessage(result.error.message);
      setIsLoading(false);
      return;
    }

    const nextCategories = result.value.filter((category) =>
      allowedKinds.includes(category.kind),
    );

    setCategories(nextCategories);
    setErrorMessage(null);
    setIsLoading(false);
  }, [accountRemoteId, accountType, allowedKinds, getCategoriesUseCase, ownerUserRemoteId]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (selectedKind === "all") {
        return true;
      }
      return category.kind === selectedKind;
    });
  }, [categories, selectedKind]);

  const onOpenCreate = useCallback(() => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage categories.");
      return;
    }

    if (allowedKinds.length === 0) {
      setErrorMessage("An active account is required to manage categories.");
      return;
    }

    setEditorMode("create");
    setForm({ ...EMPTY_FORM, kind: allowedKinds[0] ?? CategoryKind.Income });
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [allowedKinds, canManage]);

  const onOpenEdit = useCallback((category: Category) => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage categories.");
      return;
    }

    if (category.isSystem) {
      setErrorMessage("System categories are locked to preserve report stability.");
      return;
    }

    setEditorMode("edit");
    setForm(mapCategoryToForm(category));
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage]);

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
  }, []);

  const onFormChange = useCallback((field: keyof CategoryFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage categories.");
      return;
    }

    if (!ownerUserRemoteId || !accountRemoteId || !accountType) {
      setErrorMessage("An active account is required to manage categories.");
      return;
    }

    const result = await saveCategoryUseCase.execute({
      remoteId: form.remoteId ?? Crypto.randomUUID(),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope: accountType === AccountType.Business ? CategoryScope.Business : CategoryScope.Personal,
      kind: form.kind,
      name: form.name,
      description: form.description || null,
      isSystem: false,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setCategories((currentCategories) => {
      const existingIndex = currentCategories.findIndex(
        (category) => category.remoteId === result.value.remoteId,
      );
      if (existingIndex === -1) {
        return [result.value, ...currentCategories];
      }
      return currentCategories.map((category, index) =>
        index === existingIndex ? result.value : category,
      );
    });
    setErrorMessage(null);
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    void loadCategories();
  }, [accountRemoteId, accountType, canManage, form, loadCategories, ownerUserRemoteId, saveCategoryUseCase]);

  useEffect(() => {
    if (selectedKind !== "all" && !allowedKinds.includes(selectedKind)) {
      setSelectedKind("all");
    }
  }, [allowedKinds, selectedKind]);

  return useMemo<CategoriesViewModel>(
    () => ({
      isLoading,
      errorMessage,
      categories,
      filteredCategories,
      selectedKind,
      canCreate: Boolean(ownerUserRemoteId && accountRemoteId && accountType && canManage),
      isEditorVisible,
      editorMode,
      editorTitle: editorMode === "create" ? "New Category" : "Edit Category",
      form,
      onRefresh: loadCategories,
      onFilterChange: setSelectedKind,
      onOpenCreate,
      onOpenEdit,
      onCloseEditor,
      onFormChange,
      onSubmit,
    }),
    [accountRemoteId, accountType, canManage, categories, editorMode, errorMessage, filteredCategories, form, isEditorVisible, isLoading, loadCategories, onCloseEditor, onFormChange, onOpenCreate, onOpenEdit, onSubmit, ownerUserRemoteId, selectedKind],
  );
};

export { CATEGORY_FILTER_OPTIONS };
