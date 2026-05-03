export const SYNC_PUSH_ENDPOINT = "/api/v1/sync/push";
export const SYNC_PULL_ENDPOINT = "/api/v1/sync/pull";
export const SYNC_BACKEND_AUTH_REQUIRED_MESSAGE =
  "Sync is enabled, but no backend access token is stored for this session. Sign in to the connected backend before running sync.";

export const SYNC_INFRA_TABLES = [
  "sync_checkpoints",
  "sync_runs",
  "sync_errors",
  "sync_conflicts",
  "sync_outbox",
] as const;

export const SYNC_DEFAULT_BATCH_SIZE = 100;
