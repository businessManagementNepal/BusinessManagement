import {
  LedgerEntriesResult,
  LedgerEntryResult,
  LedgerOperationResult,
  SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerDatabaseError,
  LedgerEntryNotFoundError,
  LedgerError,
  LedgerUnknownError,
} from "@/feature/ledger/types/ledger.error.types";
import { LedgerDatasource } from "../dataSource/ledger.datasource";
import { LedgerRepository } from "./ledger.repository";
import { mapLedgerEntryModelToDomain } from "./mapper/ledger.mapper";

export const createLedgerRepository = (
  localDatasource: LedgerDatasource,
): LedgerRepository => ({
  async saveLedgerEntry(payload: SaveLedgerEntryPayload): Promise<LedgerEntryResult> {
    const result = await localDatasource.saveLedgerEntry(payload);

    if (result.success) {
      return mapLedgerModel(result.value);
    }

    return {
      success: false,
      error: mapLedgerError(result.error),
    };
  },

  async getLedgerEntriesByBusinessAccountRemoteId(
    businessAccountRemoteId: string,
  ): Promise<LedgerEntriesResult> {
    const result = await localDatasource.getLedgerEntriesByBusinessAccountRemoteId(
      businessAccountRemoteId,
    );

    if (!result.success) {
      return {
        success: false,
        error: mapLedgerError(result.error),
      };
    }

    try {
      const mappedEntries = await Promise.all(
        result.value.map((entryModel) => mapLedgerEntryModelToDomain(entryModel)),
      );

      return {
        success: true,
        value: mappedEntries,
      };
    } catch (error) {
      return {
        success: false,
        error: mapLedgerError(error),
      };
    }
  },

  async getLedgerEntryByRemoteId(remoteId: string): Promise<LedgerEntryResult> {
    const result = await localDatasource.getLedgerEntryByRemoteId(remoteId);

    if (!result.success) {
      return {
        success: false,
        error: mapLedgerError(result.error),
      };
    }

    if (!result.value) {
      return {
        success: false,
        error: LedgerEntryNotFoundError,
      };
    }

    return mapLedgerModel(result.value);
  },

  async deleteLedgerEntryByRemoteId(
    remoteId: string,
  ): Promise<LedgerOperationResult> {
    const result = await localDatasource.deleteLedgerEntryByRemoteId(remoteId);

    if (result.success) {
      return result;
    }

    return {
      success: false,
      error: mapLedgerError(result.error),
    };
  },
});

const mapLedgerModel = async (
  model: Parameters<typeof mapLedgerEntryModelToDomain>[0],
): Promise<LedgerEntryResult> => {
  try {
    return {
      success: true,
      value: await mapLedgerEntryModelToDomain(model),
    };
  } catch (error) {
    return {
      success: false,
      error: mapLedgerError(error),
    };
  }
};

const mapLedgerError = (error: Error | unknown): LedgerError => {
  if (!(error instanceof Error)) {
    return LedgerUnknownError;
  }

  const message = error.message.toLowerCase();

  if (message.includes("ledger entry not found")) {
    return LedgerEntryNotFoundError;
  }

  const isDatabaseError =
    message.includes("table") ||
    message.includes("schema") ||
    message.includes("database") ||
    message.includes("adapter") ||
    message.includes("timeout");

  if (isDatabaseError) {
    return {
      ...LedgerDatabaseError,
      message: error.message,
    };
  }

  return {
    ...LedgerUnknownError,
    message: error.message,
  };
};
