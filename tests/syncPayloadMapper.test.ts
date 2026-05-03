import { mapLocalRecordToRemoteSyncPayload } from "@/feature/sync/mapper/mapLocalRecordToRemoteSyncPayload";
import { mapRemoteSyncPayloadToLocalRecord } from "@/feature/sync/mapper/mapRemoteSyncPayloadToLocalRecord";
import { describe, expect, it } from "vitest";

describe("sync payload mappers", () => {
  it("maps transaction direction and posting status at the sync boundary", () => {
    expect(
      mapLocalRecordToRemoteSyncPayload("transactions", {
        remote_id: "transaction-1",
        direction: "in",
        transaction_type: "income",
        posting_status: "voided",
        amount: 100,
        sync_status: "pending_create",
        server_revision: "rev-1",
      }),
    ).toEqual({
      remote_id: "transaction-1",
      direction: "inflow",
      transaction_type: "income",
      posting_status: "void",
      amount: 100,
    });
  });

  it("maps ledger balance direction back to the local domain vocabulary", () => {
    expect(
      mapRemoteSyncPayloadToLocalRecord({
        tableName: "ledger_entries",
        payload: {
          remote_id: "ledger-1",
          balance_direction: "credit",
          amount: 250,
        },
        serverRevision: "rev-2",
      }),
    ).toEqual({
      remote_id: "ledger-1",
      balance_direction: "pay",
      amount: 250,
      server_revision: "rev-2",
    });
  });

  it("does not allow remote stock projection to overwrite local product stock", () => {
    expect(
      mapRemoteSyncPayloadToLocalRecord({
        tableName: "products",
        payload: {
          remote_id: "product-1",
          name: "Fixture Product",
          stock_quantity: 999,
        },
        serverRevision: "rev-product-1",
      }),
    ).toEqual({
      remote_id: "product-1",
      name: "Fixture Product",
      server_revision: "rev-product-1",
    });
  });

  it("does not allow remote money account balance projection to overwrite local balance", () => {
    expect(
      mapRemoteSyncPayloadToLocalRecord({
        tableName: "money_accounts",
        payload: {
          remote_id: "money-1",
          display_name: "Cash",
          current_balance: 999,
        },
        serverRevision: "rev-money-1",
      }),
    ).toEqual({
      remote_id: "money-1",
      display_name: "Cash",
      server_revision: "rev-money-1",
    });
  });
});
