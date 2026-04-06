import {
  CategoryKind,
  CategoryScope,
  SaveCategoryPayload,
} from "@/feature/categories/types/category.types";
import { RecordSyncStatus } from "@/feature/session/types/authSession.types";
import {
  AccountType,
  AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { CategoryDatasource } from "./category.datasource";
import { CategoryModel } from "./db/category.model";

const CATEGORIES_TABLE = "categories";

type MutableRawTimestamps = {
  _raw: Record<"created_at" | "updated_at", number>;
};

const normalizeRequired = (value: string): string => value.trim();
const normalizeOptional = (value: string | null): string | null => {
  if (value === null) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const setCreatedAndUpdatedAt = (record: unknown, now: number): void => {
  (record as MutableRawTimestamps)._raw.created_at = now;
  (record as MutableRawTimestamps)._raw.updated_at = now;
};

const setUpdatedAt = (record: unknown, now: number): void => {
  (record as MutableRawTimestamps)._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: CategoryModel): void => {
  if (
    !record.recordSyncStatus ||
    record.recordSyncStatus === RecordSyncStatus.Synced
  ) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
  }
};

const buildRemoteId = (
  accountRemoteId: string,
  kind: string,
  name: string,
): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `system-${accountRemoteId}-${kind}-${slug}`;
};

const resolveCategoryRecencyScore = (category: CategoryModel): number => {
  return category.updatedAt.getTime() || category.createdAt.getTime() || 0;
};

const dedupeCategoriesByRemoteId = (
  categories: readonly CategoryModel[],
): CategoryModel[] => {
  const canonicalByRemoteId = new Map<string, CategoryModel>();

  for (const category of categories) {
    const current = canonicalByRemoteId.get(category.remoteId);
    if (!current) {
      canonicalByRemoteId.set(category.remoteId, category);
      continue;
    }

    if (resolveCategoryRecencyScore(category) > resolveCategoryRecencyScore(current)) {
      canonicalByRemoteId.set(category.remoteId, category);
    }
  }

  return Array.from(canonicalByRemoteId.values()).sort((leftCategory, rightCategory) => {
    const kindSort = leftCategory.kind.localeCompare(rightCategory.kind);
    if (kindSort !== 0) {
      return kindSort;
    }
    return leftCategory.name.localeCompare(rightCategory.name);
  });
};

const getSystemCategorySeed = (
  accountRemoteId: string,
  ownerUserRemoteId: string,
  accountType: AccountTypeValue,
): readonly SaveCategoryPayload[] => {
  const scope =
    accountType === AccountType.Business
      ? CategoryScope.Business
      : CategoryScope.Personal;

  const shared = [
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Income, "Salary"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Income,
      name: "Salary",
      description: null,
      isSystem: true,
    },
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Expense, "Food & Dining"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Expense,
      name: "Food & Dining",
      description: null,
      isSystem: true,
    },
  ] as const;

  if (accountType !== AccountType.Business) {
    return shared;
  }

  return [
    ...shared,
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Income, "Rent"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Income,
      name: "Rent",
      description: null,
      isSystem: true,
    },
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Business, "Sale"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Business,
      name: "Sale",
      description: null,
      isSystem: true,
    },
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Business, "Collection"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Business,
      name: "Collection",
      description: null,
      isSystem: true,
    },
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Product, "Grocery"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Product,
      name: "Grocery",
      description: null,
      isSystem: true,
    },
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Product, "Beverages"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Product,
      name: "Beverages",
      description: null,
      isSystem: true,
    },
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Product, "Food"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Product,
      name: "Food",
      description: null,
      isSystem: true,
    },
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Product, "Electronics"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Product,
      name: "Electronics",
      description: null,
      isSystem: true,
    },
    {
      remoteId: buildRemoteId(accountRemoteId, CategoryKind.Product, "Services"),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      scope,
      kind: CategoryKind.Product,
      name: "Services",
      description: null,
      isSystem: true,
    },
  ] as const;
};

const findByRemoteId = async (
  database: Database,
  remoteId: string,
): Promise<CategoryModel | null> => {
  const collection = database.get<CategoryModel>(CATEGORIES_TABLE);
  const matching = await collection.query(
    Q.where("remote_id", remoteId),
    Q.where("deleted_at", Q.eq(null)),
  ).fetch();
  const deduped = dedupeCategoriesByRemoteId(matching);
  return deduped[0] ?? null;
};

export const createLocalCategoryDatasource = (
  database: Database,
): CategoryDatasource => ({
  async ensureSystemCategories({
    ownerUserRemoteId,
    accountRemoteId,
    accountType,
  }) {
    try {
      const normalizedOwnerUserRemoteId = normalizeRequired(ownerUserRemoteId);
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      const normalizedAccountType = accountType;

      if (!normalizedOwnerUserRemoteId) {
        throw new Error("Owner user remote id is required");
      }
      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }
      if (
        normalizedAccountType !== AccountType.Personal &&
        normalizedAccountType !== AccountType.Business
      ) {
        throw new Error("Account type is required");
      }

      const seed = getSystemCategorySeed(
        normalizedAccountRemoteId,
        normalizedOwnerUserRemoteId,
        normalizedAccountType,
      );
      const collection = database.get<CategoryModel>(CATEGORIES_TABLE);
      const existing = await collection
        .query(
          Q.where("account_remote_id", normalizedAccountRemoteId),
          Q.where("is_system", true),
          Q.where("deleted_at", Q.eq(null)),
        )
        .fetch();

      const existingByRemoteId = new Map(
        existing.map((record) => [record.remoteId, record]),
      );

      await database.write(async () => {
        for (const item of seed) {
          const existingRecord = existingByRemoteId.get(item.remoteId);
          if (existingRecord) {
            const hasChanged =
              existingRecord.name !== item.name ||
              existingRecord.description !== item.description ||
              existingRecord.kind !== item.kind ||
              existingRecord.scope !== item.scope ||
              existingRecord.accountType !== item.accountType;

            if (!hasChanged) {
              continue;
            }

            await existingRecord.update((record) => {
              record.kind = item.kind;
              record.scope = item.scope;
              record.accountType = item.accountType;
              record.name = item.name;
              record.description = item.description;
              record.deletedAt = null;
              setUpdatedAt(record, Date.now());
            });
            continue;
          }

          await collection.create((record) => {
            const now = Date.now();
            record.remoteId = item.remoteId;
            record.ownerUserRemoteId = item.ownerUserRemoteId;
            record.accountRemoteId = item.accountRemoteId;
            record.accountType = item.accountType;
            record.scope = item.scope;
            record.kind = item.kind;
            record.name = item.name;
            record.description = item.description;
            record.isSystem = true;
            record.recordSyncStatus = RecordSyncStatus.Synced;
            record.lastSyncedAt = now;
            record.deletedAt = null;
            setCreatedAndUpdatedAt(record, now);
          });
        }
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getCategoriesByAccountRemoteId(accountRemoteId: string) {
    try {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }

      const collection = database.get<CategoryModel>(CATEGORIES_TABLE);
      const categories = await collection
        .query(
          Q.where("account_remote_id", normalizedAccountRemoteId),
          Q.where("deleted_at", Q.eq(null)),
          Q.sortBy("kind", Q.asc),
          Q.sortBy("name", Q.asc),
        )
        .fetch();

      return { success: true, value: dedupeCategoriesByRemoteId(categories) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async saveCategory(payload: SaveCategoryPayload) {
    try {
      const normalizedRemoteId = normalizeRequired(payload.remoteId);
      const normalizedOwnerUserRemoteId = normalizeRequired(payload.ownerUserRemoteId);
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedName = normalizeRequired(payload.name);
      const normalizedDescription = normalizeOptional(payload.description);

      if (!normalizedRemoteId) throw new Error("Category remote id is required");
      if (!normalizedOwnerUserRemoteId) throw new Error("Owner user remote id is required");
      if (!normalizedAccountRemoteId) throw new Error("Account remote id is required");
      if (!normalizedName) throw new Error("Category name is required");

      const collection = database.get<CategoryModel>(CATEGORIES_TABLE);
      const duplicate = await collection
        .query(
          Q.where("account_remote_id", normalizedAccountRemoteId),
          Q.where("kind", payload.kind),
          Q.where("deleted_at", Q.eq(null)),
        )
        .fetch();

      const hasDuplicate = duplicate.some(
        (record) =>
          record.remoteId !== normalizedRemoteId &&
          record.name.trim().toLowerCase() === normalizedName.toLowerCase(),
      );
      if (hasDuplicate) {
        throw new Error("Category name already exists in this scope");
      }

      const existingCategory = await findByRemoteId(database, normalizedRemoteId);
      if (existingCategory) {
        await database.write(async () => {
          await existingCategory.update((record) => {
            record.kind = payload.kind;
            record.name = normalizedName;
            record.description = normalizedDescription;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, Date.now());
          });
        });
        return { success: true, value: existingCategory };
      }

      let created!: CategoryModel;
      await database.write(async () => {
        created = await collection.create((record) => {
          const now = Date.now();
          record.remoteId = normalizedRemoteId;
          record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
          record.accountRemoteId = normalizedAccountRemoteId;
          record.accountType = payload.accountType;
          record.scope = payload.scope;
          record.kind = payload.kind;
          record.name = normalizedName;
          record.description = normalizedDescription;
          record.isSystem = payload.isSystem;
          record.recordSyncStatus = RecordSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;
          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: created };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async archiveCategoryByRemoteId(remoteId: string) {
    try {
      const normalizedRemoteId = normalizeRequired(remoteId);
      if (!normalizedRemoteId) {
        throw new Error("Category remote id is required");
      }

      const existingCategory = await findByRemoteId(database, normalizedRemoteId);
      if (!existingCategory) {
        throw new Error("Category not found");
      }
      if (existingCategory.isSystem) {
        throw new Error("System categories cannot be deleted");
      }

      await database.write(async () => {
        await existingCategory.update((record) => {
          record.deletedAt = Date.now();
          record.recordSyncStatus = RecordSyncStatus.PendingDelete;
          setUpdatedAt(record, Date.now());
        });
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
