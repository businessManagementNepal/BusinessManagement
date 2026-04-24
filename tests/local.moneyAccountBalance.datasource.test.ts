import { MoneyAccountModel } from "@/feature/accounts/data/dataSource/db/moneyAccount.model";
import { createLocalMoneyAccountBalanceDatasource } from "@/feature/transactions/data/dataSource/local.moneyAccountBalance.datasource.impl";
import { Database, Q } from "@nozbe/watermelondb";
import { describe, expect, it, vi } from "vitest";

type WatermelonWhereClause = ReturnType<typeof Q.where>;

const createDatabaseHarness = (records: readonly MoneyAccountModel[]) => {
  const fetch = vi.fn(async () => records);
  const query = vi.fn((...clauses: readonly WatermelonWhereClause[]) => ({
    fetch,
    clauses,
  }));

  const database = {
    get: vi.fn(() => ({
      query,
    })),
  } as unknown as Database;

  return {
    database,
    fetch,
    query,
  };
};

describe("local.moneyAccountBalance.datasource", () => {
  it("queries by remote id, active status, and not-deleted status", async () => {
    const activeMoneyAccount = {
      id: "money-account-model-1",
    } as unknown as MoneyAccountModel;

    const { database, query } = createDatabaseHarness([activeMoneyAccount]);
    const datasource = createLocalMoneyAccountBalanceDatasource(database);

    const result = await datasource.getActiveMoneyAccountByRemoteId("money-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(activeMoneyAccount);
    }

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      Q.where("remote_id", "money-1"),
      Q.where("is_active", true),
      Q.where("deleted_at", Q.eq(null)),
    );
  });

  it("returns null when the active account query has no matching record", async () => {
    const { database } = createDatabaseHarness([]);
    const datasource = createLocalMoneyAccountBalanceDatasource(database);

    const result = await datasource.getActiveMoneyAccountByRemoteId("missing-money");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBeNull();
    }
  });
});
