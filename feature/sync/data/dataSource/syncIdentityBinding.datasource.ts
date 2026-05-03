import { Result } from "@/shared/types/result.types";
import { SyncIdentityBindingTypeValue } from "../../types/syncIdentity.types";
import { SyncIdentityBindingModel } from "./db/syncIdentityBinding.model";

export type SaveSyncIdentityBindingPayload = {
  bindingType: SyncIdentityBindingTypeValue;
  localUserRemoteId: string;
  remoteUserRemoteId: string;
  localAccountRemoteId: string | null;
  remoteAccountRemoteId: string | null;
};

export interface SyncIdentityBindingDatasource {
  saveBinding(
    payload: SaveSyncIdentityBindingPayload,
  ): Promise<Result<SyncIdentityBindingModel>>;
  getUserBindingByLocalUserRemoteId(
    localUserRemoteId: string,
  ): Promise<Result<SyncIdentityBindingModel | null>>;
  getAccountBindingByLocalAccountRemoteId(
    localAccountRemoteId: string,
  ): Promise<Result<SyncIdentityBindingModel | null>>;
}
