import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchCountMock = vi.fn();
const unsafeFetchRawMock = vi.fn();
const unsafeSqlQueryMock = vi.fn(
  (sql: string, args?: readonly unknown[]) => ({
    sql,
    args,
  }),
);
const queryMock = vi.fn(() => ({
  fetchCount: fetchCountMock,
  unsafeFetchRaw: unsafeFetchRawMock,
}));

const getMock = vi.fn(() => ({
  query: queryMock,
}));

const fakeDatabase = {
  get: getMock,
};

const assertDatabaseSetupHealthyMock = vi.fn();
const runDatabaseIntegrityChecksMock = vi.fn();
const createDatabaseMock = vi.fn(() => fakeDatabase);

vi.mock("@/shared/database/createDatabase", () => ({
  assertDatabaseSetupHealthy: assertDatabaseSetupHealthyMock,
  createDatabase: createDatabaseMock,
}));

vi.mock("@/shared/database/databaseIntegrity", () => ({
  runDatabaseIntegrityChecks: runDatabaseIntegrityChecksMock,
}));

vi.mock("@/shared/database/migration", () => ({
  migrations: { migrations: [] },
}));

vi.mock("@nozbe/watermelondb", async () => {
  const actual =
    await vi.importActual<typeof import("@nozbe/watermelondb")>(
      "@nozbe/watermelondb",
    );

  return {
    ...actual,
    Q: {
      unsafeSqlQuery: unsafeSqlQueryMock,
    },
    appSchema: vi.fn((value) => value),
  };
});

describe("app database startup orchestration", () => {
  beforeEach(() => {
    fetchCountMock.mockReset();
    unsafeFetchRawMock.mockReset();
    unsafeSqlQueryMock.mockClear();
    queryMock.mockClear();
    getMock.mockClear();
    createDatabaseMock.mockClear();
    assertDatabaseSetupHealthyMock.mockClear();
    runDatabaseIntegrityChecksMock.mockReset();

    fetchCountMock.mockResolvedValue(1);
    unsafeFetchRawMock.mockResolvedValue([]);
    runDatabaseIntegrityChecksMock.mockResolvedValue(undefined);
  });

  it("checks health, warms the database, runs integrity checks, and checks health again in order", async () => {
    const { ensureDatabaseReady } = await import("@/shared/database/appDatabase");

    await ensureDatabaseReady();

    expect(assertDatabaseSetupHealthyMock).toHaveBeenCalledTimes(2);
    expect(getMock).toHaveBeenCalledWith("app_settings");
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(fetchCountMock).toHaveBeenCalledTimes(1);
    expect(runDatabaseIntegrityChecksMock).toHaveBeenCalledTimes(1);

    const firstHealthOrder =
      assertDatabaseSetupHealthyMock.mock.invocationCallOrder[0];
    const secondHealthOrder =
      assertDatabaseSetupHealthyMock.mock.invocationCallOrder[1];
    const fetchCountOrder = fetchCountMock.mock.invocationCallOrder[0];
    const integrityOrder =
      runDatabaseIntegrityChecksMock.mock.invocationCallOrder[0];

    expect(firstHealthOrder).toBeLessThan(fetchCountOrder);
    expect(fetchCountOrder).toBeLessThan(integrityOrder);
    expect(integrityOrder).toBeLessThan(secondHealthOrder);
  });

  it("passes a SQL runner into the integrity checker", async () => {
    const { ensureDatabaseReady } = await import("@/shared/database/appDatabase");

    await ensureDatabaseReady();

    const runnerArg = runDatabaseIntegrityChecksMock.mock.calls[0]?.[0] as
      | { fetchRaw?: (sql: string, args?: readonly unknown[]) => Promise<unknown> }
      | undefined;

    expect(runnerArg).toBeDefined();
    expect(typeof runnerArg?.fetchRaw).toBe("function");

    await runnerArg?.fetchRaw?.("SELECT 1", ["x"]);

    expect(unsafeSqlQueryMock).toHaveBeenCalledWith("SELECT 1", ["x"]);
    expect(unsafeFetchRawMock).toHaveBeenCalledTimes(1);
  });
});
