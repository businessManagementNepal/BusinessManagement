export type SyncScope = {
  deviceId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  schemaVersion: number;
};

export type SyncCheckpointCursor = {
  tableName: string;
  serverCursor: string | null;
};
