import { Result } from "@/shared/types/result.types";
import {
  SaveSyncAccountBindingPayload,
  SaveSyncUserBindingPayload,
  SyncAccountBinding,
  SyncAccountBindingResult,
  SyncUserBinding,
  SyncUserBindingResult,
} from "../../types/syncIdentity.types";

export interface SyncIdentityBindingRepository {
  saveUserBinding(
    payload: SaveSyncUserBindingPayload,
  ): Promise<Result<SyncUserBinding>>;
  getUserBindingByLocalUserRemoteId(
    localUserRemoteId: string,
  ): Promise<SyncUserBindingResult>;
  saveAccountBinding(
    payload: SaveSyncAccountBindingPayload,
  ): Promise<Result<SyncAccountBinding>>;
  getAccountBindingByLocalAccountRemoteId(
    localAccountRemoteId: string,
  ): Promise<SyncAccountBindingResult>;
}
