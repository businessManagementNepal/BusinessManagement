export const SyncOperation = {
  Create: "create",
  Update: "update",
  Delete: "delete",
} as const;

export type SyncOperationValue =
  (typeof SyncOperation)[keyof typeof SyncOperation];
