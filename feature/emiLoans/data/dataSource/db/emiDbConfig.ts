import { EmiPlanModel } from "./emiPlan.model";
import { EmiInstallmentModel } from "./emiInstallment.model";
import { InstallmentPaymentLinkModel } from "./installmentPaymentLink.model";
import { emiPlansTable } from "./emiPlan.schema";
import { emiInstallmentsTable } from "./emiInstallment.schema";
import { installmentPaymentLinksTable } from "./installmentPaymentLink.schema";

export const emiDbConfig = {
  models: [EmiPlanModel, EmiInstallmentModel, InstallmentPaymentLinkModel],
  tables: [emiPlansTable, emiInstallmentsTable, installmentPaymentLinksTable],
};
