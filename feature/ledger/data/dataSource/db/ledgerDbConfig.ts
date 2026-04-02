import { LedgerEntryModel } from "./ledger.model";
import { ledgerEntriesTable } from "./ledger.schema";

export const ledgerDbConfig = {
  models: [LedgerEntryModel],
  tables: [ledgerEntriesTable],
};
