import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { CategoryRepository } from "@/feature/categories/data/repository/category.repository";
import {
  Category,
  CategoryKind,
  CategoryScope,
  SaveCategoryPayload,
} from "@/feature/categories/types/category.types";
import { createSaveCategoryUseCase } from "@/feature/categories/useCase/saveCategory.useCase.impl";
import { describe, expect, it, vi } from "vitest";

const buildPayload = (
  overrides: Partial<SaveCategoryPayload> = {},
): SaveCategoryPayload => ({
  remoteId: "  category-1  ",
  ownerUserRemoteId: "  user-1  ",
  accountRemoteId: "  account-1  ",
  accountType: AccountType.Business,
  scope: CategoryScope.Business,
  kind: CategoryKind.Business,
  name: "  Operations  ",
  description: "  Office operations  ",
  isSystem: false,
  ...overrides,
});

const buildCategory = (payload: SaveCategoryPayload): Category => ({
  remoteId: payload.remoteId,
  ownerUserRemoteId: payload.ownerUserRemoteId,
  accountRemoteId: payload.accountRemoteId,
  accountType: payload.accountType,
  scope: payload.scope,
  kind: payload.kind,
  name: payload.name,
  description: payload.description,
  isSystem: payload.isSystem,
  createdAt: 1,
  updatedAt: 1,
});

const createRepository = (
  saveCategoryMock: CategoryRepository["saveCategory"],
): CategoryRepository => ({
  ensureSystemCategories: vi.fn(async () => ({
    success: true as const,
    value: true,
  })),
  getCategoriesByAccountRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  saveCategory: saveCategoryMock,
  archiveCategoryByRemoteId: vi.fn(async () => ({
    success: true as const,
    value: true,
  })),
});

describe("saveCategory.useCase", () => {
  it("rejects blank name after trimming", async () => {
    const saveCategoryMock = vi.fn<CategoryRepository["saveCategory"]>(
      async () => ({
        success: true as const,
        value: buildCategory(buildPayload()),
      }),
    );

    const repository = createRepository(saveCategoryMock);
    const useCase = createSaveCategoryUseCase(repository);

    const result = await useCase.execute(
      buildPayload({ name: "   " }),
    );

    expect(result.success).toBe(false);
    expect(saveCategoryMock).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.message).toBe("Category name is required.");
    }
  });

  it("rejects invalid kind for personal accounts", async () => {
    const saveCategoryMock = vi.fn<CategoryRepository["saveCategory"]>(
      async () => ({
        success: true as const,
        value: buildCategory(buildPayload()),
      }),
    );

    const repository = createRepository(saveCategoryMock);
    const useCase = createSaveCategoryUseCase(repository);

    const result = await useCase.execute(
      buildPayload({
        accountType: AccountType.Personal,
        scope: CategoryScope.Personal,
        kind: CategoryKind.Product,
      }),
    );

    expect(result.success).toBe(false);
    expect(saveCategoryMock).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.message).toBe(
        "Selected category type is not allowed for this account.",
      );
    }
  });

  it("normalizes trimmed payload values before saving", async () => {
    const saveCategoryMock = vi.fn<CategoryRepository["saveCategory"]>(
      async (payload) => ({
        success: true as const,
        value: buildCategory(payload),
      }),
    );

    const repository = createRepository(saveCategoryMock);
    const useCase = createSaveCategoryUseCase(repository);

    const result = await useCase.execute(buildPayload());

    expect(result.success).toBe(true);
    expect(saveCategoryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "category-1",
        ownerUserRemoteId: "user-1",
        accountRemoteId: "account-1",
        name: "Operations",
        description: "Office operations",
      }),
    );
  });
});
