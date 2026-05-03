import {
  SaveSyncAccountBindingPayload,
  SaveSyncUserBindingPayload,
  SyncAccountBinding,
  SyncIdentityBindingType,
  SyncUserBinding,
} from "../../types/syncIdentity.types";
import {
  SaveSyncIdentityBindingPayload,
  SyncIdentityBindingDatasource,
} from "../dataSource/syncIdentityBinding.datasource";
import { SyncIdentityBindingRepository } from "./syncIdentityBinding.repository";

const mapModelToUserBinding = (
  model: {
    localUserRemoteId: string;
    remoteUserRemoteId: string;
    createdAt: Date;
    updatedAt: Date;
  },
): SyncUserBinding => ({
  localUserRemoteId: model.localUserRemoteId,
  remoteUserRemoteId: model.remoteUserRemoteId,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

const mapModelToAccountBinding = (
  model: {
    localUserRemoteId: string;
    remoteUserRemoteId: string;
    localAccountRemoteId: string | null;
    remoteAccountRemoteId: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
): SyncAccountBinding => {
  if (!model.localAccountRemoteId || !model.remoteAccountRemoteId) {
    throw new Error("Account binding record is incomplete.");
  }

  return {
    localUserRemoteId: model.localUserRemoteId,
    remoteUserRemoteId: model.remoteUserRemoteId,
    localAccountRemoteId: model.localAccountRemoteId,
    remoteAccountRemoteId: model.remoteAccountRemoteId,
    createdAt: model.createdAt.getTime(),
    updatedAt: model.updatedAt.getTime(),
  };
};

const buildSavePayload = (
  payload: SaveSyncIdentityBindingPayload,
): SaveSyncIdentityBindingPayload => ({
  bindingType: payload.bindingType,
  localUserRemoteId: payload.localUserRemoteId.trim(),
  remoteUserRemoteId: payload.remoteUserRemoteId.trim(),
  localAccountRemoteId: payload.localAccountRemoteId?.trim() ?? null,
  remoteAccountRemoteId: payload.remoteAccountRemoteId?.trim() ?? null,
});

export const createSyncIdentityBindingRepository = (
  datasource: SyncIdentityBindingDatasource,
): SyncIdentityBindingRepository => ({
  async saveUserBinding(payload: SaveSyncUserBindingPayload) {
    const result = await datasource.saveBinding(
      buildSavePayload({
        bindingType: SyncIdentityBindingType.User,
        localUserRemoteId: payload.localUserRemoteId,
        remoteUserRemoteId: payload.remoteUserRemoteId,
        localAccountRemoteId: null,
        remoteAccountRemoteId: null,
      }),
    );

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      value: mapModelToUserBinding(result.value),
    };
  },

  async getUserBindingByLocalUserRemoteId(localUserRemoteId: string) {
    const result =
      await datasource.getUserBindingByLocalUserRemoteId(localUserRemoteId.trim());

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      value: result.value ? mapModelToUserBinding(result.value) : null,
    };
  },

  async saveAccountBinding(payload: SaveSyncAccountBindingPayload) {
    const result = await datasource.saveBinding(
      buildSavePayload({
        bindingType: SyncIdentityBindingType.Account,
        localUserRemoteId: payload.localUserRemoteId,
        remoteUserRemoteId: payload.remoteUserRemoteId,
        localAccountRemoteId: payload.localAccountRemoteId,
        remoteAccountRemoteId: payload.remoteAccountRemoteId,
      }),
    );

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      value: mapModelToAccountBinding(result.value),
    };
  },

  async getAccountBindingByLocalAccountRemoteId(localAccountRemoteId: string) {
    const result =
      await datasource.getAccountBindingByLocalAccountRemoteId(
        localAccountRemoteId.trim(),
      );

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      value: result.value ? mapModelToAccountBinding(result.value) : null,
    };
  },
});
