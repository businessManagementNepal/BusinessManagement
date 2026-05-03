import { Result } from "@/shared/types/result.types";

export const SyncIdentityBindingType = {
  User: "user",
  Account: "account",
} as const;

export type SyncIdentityBindingTypeValue =
  (typeof SyncIdentityBindingType)[keyof typeof SyncIdentityBindingType];

export type SaveSyncUserBindingPayload = {
  localUserRemoteId: string;
  remoteUserRemoteId: string;
};

export type SaveSyncAccountBindingPayload = {
  localUserRemoteId: string;
  remoteUserRemoteId: string;
  localAccountRemoteId: string;
  remoteAccountRemoteId: string;
};

export type SyncUserBinding = {
  localUserRemoteId: string;
  remoteUserRemoteId: string;
  createdAt: number;
  updatedAt: number;
};

export type SyncAccountBinding = {
  localUserRemoteId: string;
  remoteUserRemoteId: string;
  localAccountRemoteId: string;
  remoteAccountRemoteId: string;
  createdAt: number;
  updatedAt: number;
};

export type SyncUserBindingResult = Result<SyncUserBinding | null, Error>;
export type SyncAccountBindingResult = Result<SyncAccountBinding | null, Error>;
