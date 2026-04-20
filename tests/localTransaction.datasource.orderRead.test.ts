import { createLocalTransactionDatasource } from "@/feature/transactions/data/dataSource/local.transaction.datasource.impl";
import { TransactionPostingStatus } from "@/feature/transactions/types/transaction.entity.types";
import type { Database } from "@nozbe/watermelondb";
import { describe, expect, it, vi } from "vitest";

type WhereClause = {
  type: "where";
  left: string;
  comparison: {
    operator: string;
    right?: {
      value?: unknown;
      values?: unknown[];
    };
  };
};

type SortByClause = {
  type: "sortBy";
  sortColumn: string;
  sortOrder: "asc" | "desc";
};

const isWhereClause = (clause: unknown): clause is WhereClause =>
  typeof clause === "object" &&
  clause !== null &&
  "type" in clause &&
  (clause as { type?: string }).type === "where";

const isSortByClause = (clause: unknown): clause is SortByClause =>
  typeof clause === "object" &&
  clause !== null &&
  "type" in clause &&
  (clause as { type?: string }).type === "sortBy";

const createTransactionModel = (overrides: Partial<any> = {}) =>
  ({
    remoteId: overrides.remoteId ?? "txn-1",
    accountRemoteId: overrides.accountRemoteId ?? "business-1",
    sourceModule: overrides.sourceModule ?? "orders",
    sourceRemoteId: overrides.sourceRemoteId ?? "order-1",
    sourceAction: overrides.sourceAction ?? "payment",
    postingStatus: overrides.postingStatus ?? TransactionPostingStatus.Posted,
    deletedAt: overrides.deletedAt ?? null,
    happenedAt: overrides.happenedAt ?? 1_710_000_000_000,
  }) as any;

describe("local transaction datasource order read paths", () => {
  it("builds strict linked-order query clauses and returns posted rows", async () => {
    const querySpy = vi.fn(() => ({
      fetch: async () => [
        createTransactionModel({
          remoteId: "txn-posted",
          postingStatus: TransactionPostingStatus.Posted,
          deletedAt: null,
        }),
        createTransactionModel({
          remoteId: "txn-voided",
          postingStatus: TransactionPostingStatus.Voided,
          deletedAt: null,
        }),
      ],
    }));

    const database = {
      get: vi.fn(() => ({
        query: querySpy,
      })),
    } as unknown as Database;

    const datasource = createLocalTransactionDatasource(database);
    const result =
      await datasource.getPostedOrderLinkedTransactionsByOrderRemoteIds({
        accountRemoteId: "business-1",
        orderRemoteIds: [" order-1 ", "", "order-2", "order-1"],
      });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value.map((item) => item.remoteId)).toEqual(["txn-posted"]);
    expect(querySpy).toHaveBeenCalledTimes(1);

    const clauses = ((querySpy.mock.calls[0] as unknown[]) ?? []) as unknown[];
    const whereClauses = clauses.filter(isWhereClause);
    const sortClauses = clauses.filter(isSortByClause);

    expect(
      whereClauses.some(
        (clause) =>
          clause.left === "account_remote_id" &&
          clause.comparison.right?.value === "business-1",
      ),
    ).toBe(true);
    expect(
      whereClauses.some(
        (clause) =>
          clause.left === "source_module" &&
          clause.comparison.right?.value === "orders",
      ),
    ).toBe(true);
    expect(
      whereClauses.some(
        (clause) =>
          clause.left === "source_remote_id" &&
          Array.isArray(clause.comparison.right?.values) &&
          JSON.stringify(clause.comparison.right?.values) ===
            JSON.stringify(["order-1", "order-2"]),
      ),
    ).toBe(true);
    expect(
      whereClauses.some(
        (clause) =>
          clause.left === "source_action" &&
          Array.isArray(clause.comparison.right?.values) &&
          JSON.stringify(clause.comparison.right?.values) ===
            JSON.stringify(["payment", "refund"]),
      ),
    ).toBe(true);
    expect(
      whereClauses.some(
        (clause) =>
          clause.left === "posting_status" &&
          clause.comparison.right?.value === TransactionPostingStatus.Posted,
      ),
    ).toBe(true);
    expect(
      sortClauses.some(
        (clause) =>
          clause.sortColumn === "happened_at" && clause.sortOrder === "desc",
      ),
    ).toBe(true);
  });

  it("returns empty list without querying when remote ids are blank", async () => {
    const querySpy = vi.fn();
    const database = {
      get: vi.fn(() => ({
        query: querySpy,
      })),
    } as unknown as Database;

    const datasource = createLocalTransactionDatasource(database);
    const result =
      await datasource.getPostedOrderLinkedTransactionsByOrderRemoteIds({
        accountRemoteId: "business-1",
        orderRemoteIds: ["", "   "],
      });

    expect(result).toEqual({ success: true, value: [] });
    expect(querySpy).not.toHaveBeenCalled();
  });

  it("builds strict legacy-unlinked repair query clauses", async () => {
    const querySpy = vi.fn(() => ({
      fetch: async () => [createTransactionModel({ remoteId: "txn-legacy-1" })],
    }));

    const database = {
      get: vi.fn(() => ({
        query: querySpy,
      })),
    } as unknown as Database;

    const datasource = createLocalTransactionDatasource(database);
    const result =
      await datasource.getLegacyUnlinkedOrderTransactionsForRepair({
        accountRemoteId: "business-1",
      });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value.map((item) => item.remoteId)).toEqual(["txn-legacy-1"]);
    expect(querySpy).toHaveBeenCalledTimes(1);

    const clauses = ((querySpy.mock.calls[0] as unknown[]) ?? []) as unknown[];
    const whereClauses = clauses.filter(isWhereClause);

    expect(
      whereClauses.some(
        (clause) =>
          clause.left === "account_remote_id" &&
          clause.comparison.right?.value === "business-1",
      ),
    ).toBe(true);
    expect(
      whereClauses.some(
        (clause) =>
          clause.left === "source_module" &&
          clause.comparison.right?.value === "orders",
      ),
    ).toBe(true);
    expect(
      whereClauses.some(
        (clause) =>
          clause.left === "source_action" &&
          Array.isArray(clause.comparison.right?.values) &&
          JSON.stringify(clause.comparison.right?.values) ===
            JSON.stringify(["payment", "refund"]),
      ),
    ).toBe(true);
    expect(
      whereClauses.some(
        (clause) =>
          clause.left === "posting_status" &&
          clause.comparison.right?.value === TransactionPostingStatus.Posted,
      ),
    ).toBe(true);
  });
});
