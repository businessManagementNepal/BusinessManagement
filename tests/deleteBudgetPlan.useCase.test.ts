import { createLocalBudgetDatasource } from "@/feature/budget/data/dataSource/local.budget.datasource.impl";
import { createBudgetRepository } from "@/feature/budget/data/repository/budget.repository.impl";
import { BudgetSyncStatus } from "@/feature/budget/types/budget.types";
import { createDeleteBudgetPlanUseCase } from "@/feature/budget/useCase/deleteBudgetPlan.useCase.impl";
import type { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
import type { Database, Model } from "@nozbe/watermelondb";
import { describe, expect, it, vi } from "vitest";

type WhereClause = {
  type: "where";
  left: string;
  comparison: {
    right?: {
      value?: unknown;
    };
  };
};

type MockBudgetPlanRecord = {
  _raw: Record<"created_at" | "updated_at", number>;
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  budgetMonth: string;
  categoryRemoteId: string;
  categoryNameSnapshot: string;
  currencyCode: string | null;
  plannedAmount: number;
  note: string | null;
  recordSyncStatus: string;
  deletedAt: number | null;
  lastSyncedAt: number | null;
  createdAt: Date;
  updatedAt: Date;
  update: (mutator: (record: Model) => void) => Promise<void>;
};

const isWhereClause = (clause: unknown): clause is WhereClause =>
  typeof clause === "object" &&
  clause !== null &&
  "type" in clause &&
  (clause as { type?: string }).type === "where";

const createBudgetPlanRecord = (
  overrides: Partial<MockBudgetPlanRecord> = {},
): MockBudgetPlanRecord => {
  const createdAtMs = overrides.createdAt?.getTime() ?? 1_710_000_000_000;
  const updatedAtMs = overrides.updatedAt?.getTime() ?? createdAtMs;
  const record: MockBudgetPlanRecord = {
    _raw: {
      created_at: createdAtMs,
      updated_at: updatedAtMs,
    },
    remoteId: overrides.remoteId ?? "budget-1",
    ownerUserRemoteId: overrides.ownerUserRemoteId ?? "user-1",
    accountRemoteId: overrides.accountRemoteId ?? "personal-1",
    budgetMonth: overrides.budgetMonth ?? "2026-05",
    categoryRemoteId: overrides.categoryRemoteId ?? "category-food",
    categoryNameSnapshot: overrides.categoryNameSnapshot ?? "Food",
    currencyCode: overrides.currencyCode ?? "NPR",
    plannedAmount: overrides.plannedAmount ?? 500,
    note: overrides.note ?? null,
    recordSyncStatus: overrides.recordSyncStatus ?? BudgetSyncStatus.Synced,
    deletedAt: overrides.deletedAt ?? null,
    lastSyncedAt: overrides.lastSyncedAt ?? null,
    createdAt: overrides.createdAt ?? new Date(createdAtMs),
    updatedAt: overrides.updatedAt ?? new Date(updatedAtMs),
    update: vi.fn(async (mutator: (record: Model) => void) => {
      mutator(record as unknown as Model);
      record.updatedAt = new Date(record._raw.updated_at);
    }),
  };

  return record;
};

const createHarness = (budgetPlan: MockBudgetPlanRecord | null) => {
  const budgetPlans = budgetPlan ? [budgetPlan] : [];
  const collection = {
    query: (...clauses: unknown[]) => ({
      fetch: async () =>
        budgetPlans.filter((record) =>
          clauses.every((clause) => {
            if (!isWhereClause(clause)) {
              return true;
            }

            const value = clause.comparison.right?.value;

            if (clause.left === "account_remote_id") {
              return record.accountRemoteId === value;
            }

            if (clause.left === "remote_id") {
              return record.remoteId === value;
            }

            return true;
          }),
        ) as unknown as Model[],
      unsafeFetchRaw: async () => [],
    }),
  };

  const database = {
    get: vi.fn(() => collection),
    write: vi.fn(async (action: () => Promise<unknown>) => action()),
  } as unknown as Database;

  const datasource = createLocalBudgetDatasource(database);
  const repository = createBudgetRepository(datasource);
  const auditUseCase: RecordAuditEventUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {} as never,
    })),
  };

  return {
    repository,
    auditUseCase,
    budgetPlan,
  };
};

describe("deleteBudgetPlan.useCase", () => {
  it("marks deleted budgets as pending_delete and records an audit event", async () => {
    const budgetPlan = createBudgetPlanRecord();
    const harness = createHarness(budgetPlan);
    const useCase = createDeleteBudgetPlanUseCase(
      harness.repository,
      harness.auditUseCase,
    );

    const result = await useCase.execute({
      accountRemoteId: "personal-1",
      remoteId: "budget-1",
    });

    expect(result).toEqual({ success: true, value: true });
    expect(budgetPlan.deletedAt).not.toBeNull();
    expect(budgetPlan.recordSyncStatus).toBe(BudgetSyncStatus.PendingDelete);
    expect(harness.auditUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        module: "budget",
        action: "budget_delete",
        sourceRemoteId: "budget-1",
        outcome: "success",
      }),
    );
  });

  it("returns false for unknown budgets without emitting an audit event", async () => {
    const harness = createHarness(null);
    const useCase = createDeleteBudgetPlanUseCase(
      harness.repository,
      harness.auditUseCase,
    );

    const result = await useCase.execute({
      accountRemoteId: "personal-1",
      remoteId: "missing-budget",
    });

    expect(result).toEqual({ success: true, value: false });
    expect(harness.auditUseCase.execute).not.toHaveBeenCalled();
  });
});
