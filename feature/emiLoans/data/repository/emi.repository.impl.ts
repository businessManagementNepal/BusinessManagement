import {
  CompleteInstallmentPaymentPayload,
  EmiOperationResult,
  EmiPlanDetailResult,
  EmiPlanResult,
  EmiPlansResult,
  SaveEmiInstallmentPayload,
  SaveEmiPlanPayload,
} from "@/feature/emiLoans/types/emi.entity.types";
import {
  EmiAlreadyPaidError,
  EmiDatabaseError,
  EmiError,
  EmiInstallmentNotFoundError,
  EmiPlanNotFoundError,
  EmiUnknownError,
} from "@/feature/emiLoans/types/emi.error.types";
import { EmiDatasource } from "../dataSource/emi.datasource";
import { EmiRepository } from "./emi.repository";
import {
  mapEmiInstallmentModelToDomain,
  mapEmiPlanModelToDomain,
} from "./mapper/emi.mapper";

export const createEmiRepository = (
  localDatasource: EmiDatasource,
): EmiRepository => ({
  async savePlanWithInstallments(
    plan: SaveEmiPlanPayload,
    installments: readonly SaveEmiInstallmentPayload[],
  ): Promise<EmiPlanResult> {
    const result = await localDatasource.savePlanWithInstallments(plan, installments);

    if (result.success) {
      try {
        return {
          success: true,
          value: await mapEmiPlanModelToDomain(result.value),
        };
      } catch (error) {
        return {
          success: false,
          error: mapEmiError(error),
        };
      }
    }

    return {
      success: false,
      error: mapEmiError(result.error),
    };
  },

  async getPersonalPlansByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<EmiPlansResult> {
    const result = await localDatasource.getPlansByOwnerUserRemoteId(ownerUserRemoteId);

    if (!result.success) {
      return { success: false, error: mapEmiError(result.error) };
    }

    try {
      return {
        success: true,
        value: await Promise.all(result.value.map(mapEmiPlanModelToDomain)),
      };
    } catch (error) {
      return { success: false, error: mapEmiError(error) };
    }
  },

  async getBusinessPlansByBusinessAccountRemoteId(
    businessAccountRemoteId: string,
  ): Promise<EmiPlansResult> {
    const result =
      await localDatasource.getPlansByBusinessAccountRemoteId(
        businessAccountRemoteId,
      );

    if (!result.success) {
      return { success: false, error: mapEmiError(result.error) };
    }

    try {
      return {
        success: true,
        value: await Promise.all(result.value.map(mapEmiPlanModelToDomain)),
      };
    } catch (error) {
      return { success: false, error: mapEmiError(error) };
    }
  },

  async getPlanDetailByRemoteId(remoteId: string): Promise<EmiPlanDetailResult> {
    const [planResult, installmentsResult] = await Promise.all([
      localDatasource.getPlanByRemoteId(remoteId),
      localDatasource.getInstallmentsByPlanRemoteId(remoteId),
    ]);

    if (!planResult.success) {
      return { success: false, error: mapEmiError(planResult.error) };
    }

    if (!planResult.value) {
      return { success: false, error: EmiPlanNotFoundError };
    }

    if (!installmentsResult.success) {
      return { success: false, error: mapEmiError(installmentsResult.error) };
    }

    try {
      return {
        success: true,
        value: {
          plan: await mapEmiPlanModelToDomain(planResult.value),
          installments: await Promise.all(
            installmentsResult.value.map(mapEmiInstallmentModelToDomain),
          ),
        },
      };
    } catch (error) {
      return { success: false, error: mapEmiError(error) };
    }
  },

  async completeInstallmentPayment(
    payload: CompleteInstallmentPaymentPayload,
  ): Promise<EmiOperationResult> {
    const result = await localDatasource.completeInstallmentPayment(payload);

    if (result.success) {
      return result;
    }

    return { success: false, error: mapEmiError(result.error) };
  },
});

const mapEmiError = (error: Error | unknown): EmiError => {
  if (!(error instanceof Error)) {
    return EmiUnknownError;
  }

  const message = error.message.toLowerCase();

  if (message.includes("plan not found")) {
    return EmiPlanNotFoundError;
  }

  if (message.includes("installment not found")) {
    return EmiInstallmentNotFoundError;
  }

  if (message.includes("already paid")) {
    return EmiAlreadyPaidError;
  }

  const isDatabaseError =
    message.includes("table") ||
    message.includes("schema") ||
    message.includes("database") ||
    message.includes("adapter") ||
    message.includes("timeout");

  if (isDatabaseError) {
    return { ...EmiDatabaseError, message: error.message };
  }

  return { ...EmiUnknownError, message: error.message };
};
