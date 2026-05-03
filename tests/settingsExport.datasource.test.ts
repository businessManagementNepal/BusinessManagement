import { vi } from "vitest";

(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;

vi.mock("react-native", () => ({
  Platform: {
    OS: "web",
    select: <T,>(values: { web?: T; default?: T }) =>
      values.web ?? values.default,
  },
  TurboModuleRegistry: {
    getEnforcing: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

import { createLocalSettingsDatasource } from "@/feature/appSettings/settings/data/dataSource/local.settings.datasource.impl";
import { SettingsDataTransferModule } from "@/feature/appSettings/settings/types/settings.types";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { Database } from "@nozbe/watermelondb";
import { describe, expect, it } from "vitest";

type RawRow = Record<string, unknown>;

type SqlQueryDescriptor = {
  type: "sqlQuery";
  sql: string;
  values: readonly (string | number | null)[];
};

const createFakeDatabase = (rowsByTable: Record<string, readonly RawRow[]>) => {
  const getScopedRows = (
    tableName: string,
    query: SqlQueryDescriptor,
  ): readonly RawRow[] => {
    const activeAccountRemoteId = String(query.values[0] ?? "");

    if (tableName === "transactions") {
      return rowsByTable.transactions.filter(
        (row) =>
          row.account_remote_id === activeAccountRemoteId &&
          row.deleted_at === null,
      );
    }

    if (tableName === "orders") {
      return rowsByTable.orders.filter(
        (row) =>
          row.account_remote_id === activeAccountRemoteId &&
          row.deleted_at === null,
      );
    }

    if (tableName === "order_lines") {
      return rowsByTable.order_lines.filter((row) => {
        const matchingOrder = rowsByTable.orders.find(
          (order) => order.remote_id === row.order_remote_id,
        );

        return (
          matchingOrder?.account_remote_id === activeAccountRemoteId &&
          matchingOrder.deleted_at === null &&
          row.deleted_at === null
        );
      });
    }

    return rowsByTable[tableName] ?? [];
  };

  return {
    get: (tableName: string) => ({
      query: (query: SqlQueryDescriptor) => ({
        unsafeFetchRaw: async () => [...getScopedRows(tableName, query)],
      }),
    }),
  } as unknown as Database;
};

describe("settings export datasource", () => {
  it("exports only rows from the active account, including child order rows", async () => {
    const database = createFakeDatabase({
      transactions: [
        {
          id: "txn-row-1",
          remote_id: "txn-1",
          account_remote_id: "account-1",
          deleted_at: null,
        },
        {
          id: "txn-row-2",
          remote_id: "txn-2",
          account_remote_id: "account-2",
          deleted_at: null,
        },
      ],
      orders: [
        {
          id: "order-row-1",
          remote_id: "order-1",
          account_remote_id: "account-1",
          deleted_at: null,
        },
        {
          id: "order-row-2",
          remote_id: "order-2",
          account_remote_id: "account-2",
          deleted_at: null,
        },
      ],
      order_lines: [
        {
          id: "line-row-1",
          remote_id: "line-1",
          order_remote_id: "order-1",
          deleted_at: null,
        },
        {
          id: "line-row-2",
          remote_id: "line-2",
          order_remote_id: "order-2",
          deleted_at: null,
        },
      ],
    });

    const datasource = createLocalSettingsDatasource(database);
    const result = await datasource.exportDataBundle({
      moduleIds: [
        SettingsDataTransferModule.Transactions,
        SettingsDataTransferModule.Orders,
      ],
      activeAccountRemoteId: "account-1",
      activeAccountType: AccountType.Business,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const transactionsModule = result.value.modules.find(
      (moduleItem) => moduleItem.moduleId === SettingsDataTransferModule.Transactions,
    );
    const ordersModule = result.value.modules.find(
      (moduleItem) => moduleItem.moduleId === SettingsDataTransferModule.Orders,
    );

    expect(transactionsModule?.tables[0]?.rows).toEqual([
      expect.objectContaining({ remote_id: "txn-1" }),
    ]);
    expect(ordersModule?.tables[0]?.rows).toEqual([
      expect.objectContaining({ remote_id: "order-1" }),
    ]);
    expect(ordersModule?.tables[1]?.rows).toEqual([
      expect.objectContaining({ remote_id: "line-1", order_remote_id: "order-1" }),
    ]);
  });
});
