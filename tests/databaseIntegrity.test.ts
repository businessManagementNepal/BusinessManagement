import { BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME } from "@/feature/billing/data/dataSource/db/billingDocument.uniqueIndex";
import { CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME } from "@/feature/contacts/data/dataSource/db/contactPhone.uniqueIndex";
import { runDatabaseIntegrityChecks } from "@/shared/database/databaseIntegrity";
import type {
  DatabaseIntegrityRawRow,
  DatabaseIntegritySqlRunner,
} from "@/shared/database/databaseIntegrity.types";
import { describe, expect, it, vi } from "vitest";

const createRunner = (
  responses: readonly (readonly DatabaseIntegrityRawRow[])[],
): {
  runner: DatabaseIntegritySqlRunner;
  fetchRaw: ReturnType<typeof vi.fn>;
} => {
  const queuedResponses = responses.map((rows) => [...rows]);
  const fetchRaw = vi.fn(async () => queuedResponses.shift() ?? []);
  const runner: DatabaseIntegritySqlRunner = {
    fetchRaw,
  };

  return { runner, fetchRaw };
};

describe("database integrity checks", () => {
  it("passes when required indexes exist and no duplicate active rows remain", async () => {
    const { runner, fetchRaw } = createRunner([
      [{ name: BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME }],
      [],
      [{ name: CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME }],
      [],
    ]);

    await expect(runDatabaseIntegrityChecks(runner)).resolves.toBeUndefined();

    expect(fetchRaw).toHaveBeenCalledTimes(4);
    expect(fetchRaw).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("sqlite_master"),
      ["index", BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME],
    );
    expect(fetchRaw).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("sqlite_master"),
      ["index", CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME],
    );
  });

  it("fails when the billing document unique index is missing", async () => {
    const { runner } = createRunner([[]]);

    await expect(runDatabaseIntegrityChecks(runner)).rejects.toThrow(
      `Database integrity check failed: missing unique index ${BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME}.`,
    );
  });

  it("fails when duplicate active billing document numbers exist", async () => {
    const { runner } = createRunner([
      [{ name: BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME }],
      [
        {
          account_remote_id: "business-1",
          document_number: "INV-001",
          duplicate_count: 2,
        },
      ],
    ]);

    await expect(runDatabaseIntegrityChecks(runner)).rejects.toThrow(
      "Database integrity check failed: duplicate active billing document numbers detected.",
    );
  });

  it("fails when the contact identity phone unique index is missing", async () => {
    const { runner } = createRunner([
      [{ name: BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME }],
      [],
      [],
    ]);

    await expect(runDatabaseIntegrityChecks(runner)).rejects.toThrow(
      `Database integrity check failed: missing unique index ${CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME}.`,
    );
  });

  it("fails when duplicate active contact identity phone numbers exist", async () => {
    const { runner } = createRunner([
      [{ name: BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME }],
      [],
      [{ name: CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME }],
      [
        {
          account_remote_id: "business-1",
          contact_type: "customer",
          normalized_phone_number: "9800000000",
          duplicate_count: 2,
        },
      ],
    ]);

    await expect(runDatabaseIntegrityChecks(runner)).rejects.toThrow(
      "Database integrity check failed: duplicate active contact identity phone numbers detected.",
    );
  });
});
