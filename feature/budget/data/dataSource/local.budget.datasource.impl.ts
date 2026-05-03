import { BudgetDatasource } from "@/feature/budget/data/dataSource/budget.datasource";
import { BudgetPlanModel } from "@/feature/budget/data/dataSource/db/budgetPlan.model";
import {
  BudgetSyncStatus,
  SaveBudgetPlanPayload,
} from "@/feature/budget/types/budget.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";

const BUDGET_PLANS_TABLE = "budget_plans";
const DUPLICATE_BUDGET_PLAN_ERROR_MESSAGE =
  "A budget already exists for this category in the selected month.";

type MutableRawTimestamps = {
  _raw: Record<"created_at" | "updated_at", number>;
};

const setCreatedAndUpdatedAt = (record: unknown, now: number): void => {
  (record as MutableRawTimestamps)._raw.created_at = now;
  (record as MutableRawTimestamps)._raw.updated_at = now;
};

const setUpdatedAt = (record: unknown, now: number): void => {
  (record as MutableRawTimestamps)._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: BudgetPlanModel): void => {
  if (
    !record.recordSyncStatus ||
    record.recordSyncStatus === BudgetSyncStatus.Synced
  ) {
    record.recordSyncStatus = BudgetSyncStatus.PendingUpdate;
  }
};

const markBudgetPlanPendingDelete = (record: BudgetPlanModel): void => {
  record.recordSyncStatus = BudgetSyncStatus.PendingDelete;
};

const normalizeRequired = (value: string): string => value.trim();
const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const hasActiveDuplicateBudgetPlan = async (
  database: Database,
  params: {
    accountRemoteId: string;
    budgetMonth: string;
    categoryRemoteId: string;
    excludeRemoteId: string;
  },
): Promise<boolean> => {
  const budgetPlansCollection = database.get<BudgetPlanModel>(BUDGET_PLANS_TABLE);
  const duplicateRows = await budgetPlansCollection
    .query(
      Q.unsafeSqlQuery(
        `
          SELECT remote_id
          FROM ${BUDGET_PLANS_TABLE}
          WHERE account_remote_id = ?
            AND budget_month = ?
            AND category_remote_id = ?
            AND deleted_at IS NULL
            AND remote_id <> ?
          LIMIT 1;
        `,
        [
          params.accountRemoteId,
          params.budgetMonth,
          params.categoryRemoteId,
          params.excludeRemoteId,
        ],
      ),
    )
    .unsafeFetchRaw();

  return duplicateRows.length > 0;
};

export const createLocalBudgetDatasource = (
  database: Database,
): BudgetDatasource => ({
  async saveBudgetPlan(
    payload: SaveBudgetPlanPayload,
  ): Promise<Result<BudgetPlanModel>> {
    try {
      const normalizedRemoteId = normalizeRequired(payload.remoteId);
      const normalizedOwnerUserRemoteId = normalizeRequired(payload.ownerUserRemoteId);
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedBudgetMonth = normalizeRequired(payload.budgetMonth);
      const normalizedCategoryRemoteId = normalizeRequired(payload.categoryRemoteId);
      const normalizedCategoryNameSnapshot = normalizeRequired(
        payload.categoryNameSnapshot,
      );
      const normalizedCurrencyCode = normalizeOptional(payload.currencyCode);
      const normalizedNote = normalizeOptional(payload.note);

      if (!normalizedRemoteId) {
        throw new Error("Budget remote id is required");
      }
      if (!normalizedOwnerUserRemoteId) {
        throw new Error("Owner user context is required");
      }
      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }
      if (!normalizedBudgetMonth) {
        throw new Error("Budget month is required");
      }
      if (!normalizedCategoryRemoteId) {
        throw new Error("Budget category is required");
      }
      if (!normalizedCategoryNameSnapshot) {
        throw new Error("Budget category label is required");
      }
      if (!Number.isFinite(payload.plannedAmount) || payload.plannedAmount <= 0) {
        throw new Error("Planned amount must be greater than zero");
      }

      const budgetPlansCollection = database.get<BudgetPlanModel>(
        BUDGET_PLANS_TABLE,
      );
      const matchingPlans = await budgetPlansCollection
        .query(Q.where("remote_id", normalizedRemoteId))
        .fetch();

      const existingPlan = matchingPlans[0];
      const duplicateExistsBeforeWrite = await hasActiveDuplicateBudgetPlan(
        database,
        {
          accountRemoteId: normalizedAccountRemoteId,
          budgetMonth: normalizedBudgetMonth,
          categoryRemoteId: normalizedCategoryRemoteId,
          excludeRemoteId: normalizedRemoteId,
        },
      );

      if (duplicateExistsBeforeWrite) {
        throw new Error(DUPLICATE_BUDGET_PLAN_ERROR_MESSAGE);
      }

      if (existingPlan) {
        await database.write(async () => {
          const duplicateExistsAtWriteTime = await hasActiveDuplicateBudgetPlan(
            database,
            {
              accountRemoteId: normalizedAccountRemoteId,
              budgetMonth: normalizedBudgetMonth,
              categoryRemoteId: normalizedCategoryRemoteId,
              excludeRemoteId: normalizedRemoteId,
            },
          );

          if (duplicateExistsAtWriteTime) {
            throw new Error(DUPLICATE_BUDGET_PLAN_ERROR_MESSAGE);
          }

          await existingPlan.update((record) => {
            record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
            record.accountRemoteId = normalizedAccountRemoteId;
            record.budgetMonth = normalizedBudgetMonth;
            record.categoryRemoteId = normalizedCategoryRemoteId;
            record.categoryNameSnapshot = normalizedCategoryNameSnapshot;
            record.currencyCode = normalizedCurrencyCode;
            record.plannedAmount = payload.plannedAmount;
            record.note = normalizedNote;
            record.deletedAt = null;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, Date.now());
          });
        });

        return { success: true, value: existingPlan };
      }

      let createdPlan!: BudgetPlanModel;

      await database.write(async () => {
        const duplicateExistsAtWriteTime = await hasActiveDuplicateBudgetPlan(
          database,
          {
            accountRemoteId: normalizedAccountRemoteId,
            budgetMonth: normalizedBudgetMonth,
            categoryRemoteId: normalizedCategoryRemoteId,
            excludeRemoteId: normalizedRemoteId,
          },
        );

        if (duplicateExistsAtWriteTime) {
          throw new Error(DUPLICATE_BUDGET_PLAN_ERROR_MESSAGE);
        }

        createdPlan = await budgetPlansCollection.create((record) => {
          const now = Date.now();

          record.remoteId = normalizedRemoteId;
          record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
          record.accountRemoteId = normalizedAccountRemoteId;
          record.budgetMonth = normalizedBudgetMonth;
          record.categoryRemoteId = normalizedCategoryRemoteId;
          record.categoryNameSnapshot = normalizedCategoryNameSnapshot;
          record.currencyCode = normalizedCurrencyCode;
          record.plannedAmount = payload.plannedAmount;
          record.note = normalizedNote;
          record.recordSyncStatus = BudgetSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: createdPlan };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getBudgetPlansByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<BudgetPlanModel[]>> {
    try {
      const budgetPlansCollection = database.get<BudgetPlanModel>(
        BUDGET_PLANS_TABLE,
      );
      const budgetPlans = await budgetPlansCollection
        .query(
          Q.where("account_remote_id", accountRemoteId),
          Q.sortBy("budget_month", Q.desc),
          Q.sortBy("category_name_snapshot", Q.asc),
        )
        .fetch();

      return {
        success: true,
        value: budgetPlans.filter((budgetPlan) => budgetPlan.deletedAt === null),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getBudgetPlanByRemoteId(
    input,
  ): Promise<Result<BudgetPlanModel | null>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(input.accountRemoteId);
      const normalizedRemoteId = normalizeRequired(input.remoteId);

      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }

      if (!normalizedRemoteId) {
        throw new Error("Budget remote id is required");
      }

      const budgetPlansCollection = database.get<BudgetPlanModel>(
        BUDGET_PLANS_TABLE,
      );
      const matchingPlans = await budgetPlansCollection
        .query(
          Q.where("account_remote_id", normalizedAccountRemoteId),
          Q.where("remote_id", normalizedRemoteId),
        )
        .fetch();

      const budgetPlan = matchingPlans[0] ?? null;
      return {
        success: true,
        value: budgetPlan?.deletedAt === null ? budgetPlan : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteBudgetPlanByRemoteId(input): Promise<Result<boolean>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(input.accountRemoteId);
      const normalizedRemoteId = normalizeRequired(input.remoteId);

      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }

      if (!normalizedRemoteId) {
        throw new Error("Budget remote id is required");
      }

      const budgetPlansCollection = database.get<BudgetPlanModel>(
        BUDGET_PLANS_TABLE,
      );
      const matchingPlans = await budgetPlansCollection
        .query(
          Q.where("account_remote_id", normalizedAccountRemoteId),
          Q.where("remote_id", normalizedRemoteId),
        )
        .fetch();

      const budgetPlan = matchingPlans[0];

      if (!budgetPlan) {
        return { success: true, value: false };
      }

      await database.write(async () => {
        await budgetPlan.update((record) => {
          record.deletedAt = Date.now();
          markBudgetPlanPendingDelete(record);
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
