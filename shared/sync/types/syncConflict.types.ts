export const SyncConflictPolicy = {
  ServerWins: "server_wins",
  ClientWins: "client_wins",
  VersionBased: "version_based",
  FieldLevelMerge: "field_level_merge",
  ManualReview: "manual_review",
} as const;

export type SyncConflictPolicyValue =
  (typeof SyncConflictPolicy)[keyof typeof SyncConflictPolicy];

export const SyncConflictStatus = {
  Open: "open",
  ResolvedLocal: "resolved_local",
  ResolvedServer: "resolved_server",
  ResolvedKeepBoth: "resolved_keep_both",
  ManualFixed: "manual_fixed",
} as const;

export type SyncConflictStatusValue =
  (typeof SyncConflictStatus)[keyof typeof SyncConflictStatus];

export const SyncConflictResolutionAction = {
  UseLocal: "use_local",
  UseServer: "use_server",
  KeepBoth: "keep_both",
  MarkManualFixed: "mark_manual_fixed",
} as const;

export type SyncConflictResolutionActionValue =
  (typeof SyncConflictResolutionAction)[keyof typeof SyncConflictResolutionAction];
