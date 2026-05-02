import { SyncCheckpointModel } from "./syncCheckpoint.model";
import { syncCheckpointsTable } from "./syncCheckpoint.schema";
import { SyncConflictModel } from "./syncConflict.model";
import { syncConflictsTable } from "./syncConflict.schema";
import { SyncErrorModel } from "./syncError.model";
import { syncErrorsTable } from "./syncError.schema";
import { SyncOutboxModel } from "./syncOutbox.model";
import { syncOutboxTable } from "./syncOutbox.schema";
import { SyncRunModel } from "./syncRun.model";
import { syncRunsTable } from "./syncRun.schema";

export const syncDbConfig = {
  models: [
    SyncCheckpointModel,
    SyncRunModel,
    SyncErrorModel,
    SyncConflictModel,
    SyncOutboxModel,
  ],
  tables: [
    syncCheckpointsTable,
    syncRunsTable,
    syncErrorsTable,
    syncConflictsTable,
    syncOutboxTable,
  ],
};
