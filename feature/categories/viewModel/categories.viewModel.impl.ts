import {
  CATEGORY_FILTER_OPTIONS,
  Category,
  CategoryKind,
  CategoryKindValue,
  CategoryScope,
} from "@/feature/categories/types/category.types";
import { GetCategoriesUseCase } from "@/feature/categories/useCase/getCategories.useCase";
import { SaveCategoryUseCase } from "@/feature/categories/useCase/saveCategory.useCase";
import { ArchiveCategoryUseCase } from "@/feature/categories/useCase/archiveCategory.useCase";
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
  archiveCategoryUseCase: ArchiveCategoryUseCase;
};

export const useCategoriesViewModel = ({
  ownerUserRemoteId,
  accountRemoteId,
  accountType,
  canManage,
  getCategoriesUseCase,
  saveCategoryUseCase,
  archiveCategoryUseCase,
}: Params): CategoriesViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedKind, setSelectedKind] = useState<"all" | CategoryKindValue>("all");
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [pendingDeleteRemoteId, setPendingDeleteRemoteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

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
    setDeleteErrorMessage(null);
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
    setDeleteErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage]);

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    setDeleteErrorMessage(null);
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

  const onRequestDeleteFromEditor = useCallback((): void => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage categories.");
      return;
    }

    if (editorMode !== "edit" || !form.remoteId) {
      return;
    }

    const targetCategory = categories.find((category) => category.remoteId === form.remoteId);
    if (!targetCategory) {
      setErrorMessage("Category not found.");
      return;
    }
    if (targetCategory.isSystem) {
      setErrorMessage("System categories are locked to preserve report stability.");
      return;
    }

    setPendingDeleteRemoteId(targetCategory.remoteId);
    setDeleteErrorMessage(null);
  }, [canManage, categories, editorMode, form.remoteId]);

  const onCloseDeleteModal = useCallback((): void => {
    if (isDeleting) {
      return;
    }
    setPendingDeleteRemoteId(null);
    setDeleteErrorMessage(null);
  }, [isDeleting]);

  const onConfirmDelete = useCallback(async (): Promise<void> => {
    if (!canManage) {
      setDeleteErrorMessage("You do not have permission to manage categories.");
      return;
    }
    if (!pendingDeleteRemoteId) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    const archiveCategoryResult = await archiveCategoryUseCase.execute(
      pendingDeleteRemoteId,
    );
    setIsDeleting(false);

    if (!archiveCategoryResult.success) {
      setDeleteErrorMessage(archiveCategoryResult.error.message);
      return;
    }

    setCategories((currentCategories) =>
      currentCategories.filter((category) => category.remoteId !== pendingDeleteRemoteId),
    );
    setPendingDeleteRemoteId(null);
    setDeleteErrorMessage(null);
    setErrorMessage(null);
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    void loadCategories();
  }, [
    archiveCategoryUseCase,
    canManage,
    loadCategories,
    pendingDeleteRemoteId,
  ]);

  useEffect(() => {
    if (selectedKind !== "all" && !allowedKinds.includes(selectedKind)) {
      setSelectedKind("all");
    }
  }, [allowedKinds, selectedKind]);

  const pendingDeleteCategoryName = useMemo(() => {
    if (!pendingDeleteRemoteId) {
      return null;
    }
    const targetCategory = categories.find(
      (category) => category.remoteId === pendingDeleteRemoteId,
    );
    return targetCategory?.name ?? null;
  }, [categories, pendingDeleteRemoteId]);

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
      isDeleteModalVisible: Boolean(pendingDeleteRemoteId),
      pendingDeleteCategoryName,
      deleteErrorMessage,
      isDeleting,
      onRefresh: loadCategories,
      onFilterChange: setSelectedKind,
      onOpenCreate,
      onOpenEdit,
      onCloseEditor,
      onFormChange,
      onSubmit,
      onRequestDeleteFromEditor,
      onCloseDeleteModal,
      onConfirmDelete,
    }),
    [
      accountRemoteId,
      accountType,
      canManage,
      categories,
      deleteErrorMessage,
      editorMode,
      errorMessage,
      filteredCategories,
      form,
      isDeleting,
      isEditorVisible,
      isLoading,
      loadCategories,
      onCloseDeleteModal,
      onCloseEditor,
      onConfirmDelete,
      onFormChange,
      onOpenCreate,
      onOpenEdit,
      onRequestDeleteFromEditor,
      onSubmit,
      ownerUserRemoteId,
      pendingDeleteCategoryName,
      pendingDeleteRemoteId,
      selectedKind,
    ],
  );
};

export { CATEGORY_FILTER_OPTIONS };
