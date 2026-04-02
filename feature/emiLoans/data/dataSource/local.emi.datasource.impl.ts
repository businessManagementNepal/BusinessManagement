import { Database, Q } from "@nozbe/watermelondb";
import { Result } from "@/shared/types/result.types";
import {
  CompleteInstallmentPaymentPayload,
  EmiInstallmentStatus,
  EmiPlanStatus,
  EmiSyncStatus,
  SaveEmiInstallmentPayload,
  SaveEmiPlanPayload,
} from "@/feature/emiLoans/types/emi.entity.types";
import { EmiDatasource } from "./emi.datasource";
import { EmiPlanModel } from "./db/emiPlan.model";
import { EmiInstallmentModel } from "./db/emiInstallment.model";
import { InstallmentPaymentLinkModel } from "./db/installmentPaymentLink.model";

const EMI_PLANS_TABLE = "emi_plans";
const EMI_INSTALLMENTS_TABLE = "emi_installments";
const INSTALLMENT_PAYMENT_LINKS_TABLE = "installment_payment_links";

const setCreatedAndUpdatedAt = (
  record:
    | EmiPlanModel
    | EmiInstallmentModel
    | InstallmentPaymentLinkModel,
  now: number,
) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (
  record:
    | EmiPlanModel
    | EmiInstallmentModel
    | InstallmentPaymentLinkModel,
  now: number,
) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const applyPlanPayload = (record: EmiPlanModel, payload: SaveEmiPlanPayload) => {
  record.ownerUserRemoteId = payload.ownerUserRemoteId;
  record.businessAccountRemoteId = payload.businessAccountRemoteId;
  record.planMode = payload.planMode;
  record.planType = payload.planType;
  record.paymentDirection = payload.paymentDirection;
  record.title = payload.title;
  record.counterpartyName = payload.counterpartyName;
  record.counterpartyPhone = payload.counterpartyPhone;
  record.linkedAccountRemoteId = payload.linkedAccountRemoteId;
  record.linkedAccountDisplayNameSnapshot = payload.linkedAccountDisplayNameSnapshot;
  record.currencyCode = payload.currencyCode;
  record.totalAmount = payload.totalAmount;
  record.installmentCount = payload.installmentCount;
  record.paidInstallmentCount = payload.paidInstallmentCount;
  record.paidAmount = payload.paidAmount;
  record.firstDueAt = payload.firstDueAt;
  record.nextDueAt = payload.nextDueAt;
  record.reminderEnabled = payload.reminderEnabled;
  record.reminderDaysBefore = payload.reminderDaysBefore;
  record.note = payload.note;
  record.status = payload.status;
  record.deletedAt = null;
};

const applyInstallmentPayload = (
  record: EmiInstallmentModel,
  payload: SaveEmiInstallmentPayload,
) => {
  record.planRemoteId = payload.planRemoteId;
  record.installmentNumber = payload.installmentNumber;
  record.amount = payload.amount;
  record.dueAt = payload.dueAt;
  record.status = payload.status;
  record.paidAt = payload.paidAt;
};

const getNextDueAtFromInstallments = (
  installments: readonly {
    installmentNumber: number;
    status: string;
    dueAt: number;
  }[],
): number | null => {
  const nextPending = [...installments]
    .filter((installment) => installment.status === EmiInstallmentStatus.Pending)
    .sort((left, right) => left.installmentNumber - right.installmentNumber)[0];

  return nextPending?.dueAt ?? null;
};

export const createLocalEmiDatasource = (
  database: Database,
): EmiDatasource => ({
  async savePlanWithInstallments(
    plan: SaveEmiPlanPayload,
    installments: readonly SaveEmiInstallmentPayload[],
  ): Promise<Result<EmiPlanModel>> {
    try {
      const plansCollection = database.get<EmiPlanModel>(EMI_PLANS_TABLE);
      const installmentsCollection = database.get<EmiInstallmentModel>(
        EMI_INSTALLMENTS_TABLE,
      );

      const existingPlans = await plansCollection
        .query(Q.where("remote_id", plan.remoteId))
        .fetch();
      const existingPlan = existingPlans[0] ?? null;

      let savedPlan!: EmiPlanModel;

      await database.write(async () => {
        const now = Date.now();

        if (existingPlan) {
          savedPlan = existingPlan;
          await existingPlan.update((record) => {
            applyPlanPayload(record, plan);
            if (record.recordSyncStatus === EmiSyncStatus.Synced) {
              record.recordSyncStatus = EmiSyncStatus.PendingUpdate;
            }
            setUpdatedAt(record, now);
          });

          const existingInstallments = await installmentsCollection
            .query(Q.where("plan_remote_id", plan.remoteId))
            .fetch();

          for (const installment of existingInstallments) {
            await installment.markAsDeleted();
            await installment.destroyPermanently();
          }
        } else {
          savedPlan = await plansCollection.create((record) => {
            record.remoteId = plan.remoteId;
            applyPlanPayload(record, plan);
            record.recordSyncStatus = EmiSyncStatus.PendingCreate;
            record.lastSyncedAt = null;
            setCreatedAndUpdatedAt(record, now);
          });
        }

        for (const installment of installments) {
          await installmentsCollection.create((record) => {
            record.remoteId = installment.remoteId;
            applyInstallmentPayload(record, installment);
            setCreatedAndUpdatedAt(record, now);
          });
        }
      });

      return { success: true, value: savedPlan };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getPlansByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<Result<EmiPlanModel[]>> {
    try {
      const plansCollection = database.get<EmiPlanModel>(EMI_PLANS_TABLE);
      const plans = await plansCollection
        .query(
          Q.where("owner_user_remote_id", ownerUserRemoteId),
          Q.where("plan_mode", "personal"),
          Q.sortBy("updated_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: plans.filter((plan) => plan.deletedAt === null),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getPlansByBusinessAccountRemoteId(
    businessAccountRemoteId: string,
  ): Promise<Result<EmiPlanModel[]>> {
    try {
      const plansCollection = database.get<EmiPlanModel>(EMI_PLANS_TABLE);
      const plans = await plansCollection
        .query(
          Q.where("business_account_remote_id", businessAccountRemoteId),
          Q.where("plan_mode", "business"),
          Q.sortBy("updated_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: plans.filter((plan) => plan.deletedAt === null),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getPlanByRemoteId(remoteId: string): Promise<Result<EmiPlanModel | null>> {
    try {
      const plansCollection = database.get<EmiPlanModel>(EMI_PLANS_TABLE);
      const plans = await plansCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();
      const plan = plans[0] ?? null;

      return {
        success: true,
        value: plan?.deletedAt === null ? plan : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getInstallmentsByPlanRemoteId(
    planRemoteId: string,
  ): Promise<Result<EmiInstallmentModel[]>> {
    try {
      const installmentsCollection = database.get<EmiInstallmentModel>(
        EMI_INSTALLMENTS_TABLE,
      );
      const installments = await installmentsCollection
        .query(
          Q.where("plan_remote_id", planRemoteId),
          Q.sortBy("installment_number", Q.asc),
        )
        .fetch();

      return {
        success: true,
        value: installments,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async completeInstallmentPayment(
    payload: CompleteInstallmentPaymentPayload,
  ): Promise<Result<boolean>> {
    try {
      const plansCollection = database.get<EmiPlanModel>(EMI_PLANS_TABLE);
      const installmentsCollection = database.get<EmiInstallmentModel>(
        EMI_INSTALLMENTS_TABLE,
      );
      const linksCollection = database.get<InstallmentPaymentLinkModel>(
        INSTALLMENT_PAYMENT_LINKS_TABLE,
      );

      const [plans, installments] = await Promise.all([
        plansCollection.query(Q.where("remote_id", payload.planRemoteId)).fetch(),
        installmentsCollection
          .query(Q.where("remote_id", payload.installmentRemoteId))
          .fetch(),
      ]);

      const plan = plans[0] ?? null;
      const installment = installments[0] ?? null;

      if (!plan || plan.deletedAt !== null || !installment) {
        return { success: true, value: false };
      }

      await database.write(async () => {
        const now = Date.now();

        await installment.update((record) => {
          record.status = EmiInstallmentStatus.Paid;
          record.paidAt = payload.paidAt;
          setUpdatedAt(record, now);
        });

        await linksCollection.create((record) => {
          record.remoteId = payload.linkRemoteId;
          record.planRemoteId = payload.planRemoteId;
          record.installmentRemoteId = payload.installmentRemoteId;
          record.paymentRecordType = payload.paymentRecordType;
          record.paymentRecordRemoteId = payload.paymentRecordRemoteId;
          record.paymentDirection = payload.paymentDirection;
          record.amount = payload.amount;
          setCreatedAndUpdatedAt(record, now);
        });

        const allInstallments = await installmentsCollection
          .query(Q.where("plan_remote_id", payload.planRemoteId))
          .fetch();

        const normalizedInstallments = allInstallments.map((entry) => ({
          installmentNumber: entry.installmentNumber,
          status:
            entry.remoteId === payload.installmentRemoteId
              ? EmiInstallmentStatus.Paid
              : entry.status,
          dueAt: entry.dueAt,
          amount:
            entry.remoteId === payload.installmentRemoteId ? payload.amount : entry.amount,
        }));

        const paidInstallmentCount = normalizedInstallments.filter(
          (entry) => entry.status === EmiInstallmentStatus.Paid,
        ).length;

        const paidAmount = normalizedInstallments.reduce((sum, entry) => {
          return entry.status === EmiInstallmentStatus.Paid ? sum + entry.amount : sum;
        }, 0);

        const nextDueAt = getNextDueAtFromInstallments(normalizedInstallments);

        await plan.update((record) => {
          record.paidInstallmentCount = paidInstallmentCount;
          record.paidAmount = paidAmount;
          record.nextDueAt = nextDueAt;
          record.status = nextDueAt === null ? EmiPlanStatus.Closed : EmiPlanStatus.Active;
          if (record.recordSyncStatus === EmiSyncStatus.Synced) {
            record.recordSyncStatus = EmiSyncStatus.PendingUpdate;
          }
          setUpdatedAt(record, now);
        });
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
