import { AuditModule, AuditOutcome, AuditSeverity } from "@/feature/audit/types/audit.entity.types";
import { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
import { BudgetRepository } from "@/feature/budget/data/repository/budget.repository";
import {
  BudgetErrorType,
  BudgetValidationError,
} from "@/feature/budget/types/budget.types";
import { DeleteBudgetPlanUseCase } from "./deleteBudgetPlan.useCase";

export const createDeleteBudgetPlanUseCase = (
  repository: BudgetRepository,
  recordAuditEventUseCase?: RecordAuditEventUseCase,
): DeleteBudgetPlanUseCase => ({
  async execute(input) {
    const normalizedAccountRemoteId = input.accountRemoteId.trim();
    const normalizedRemoteId = input.remoteId.trim();

    if (!normalizedAccountRemoteId) {
      return {
        success: false,
        error: BudgetValidationError("Account context is required."),
      };
    }

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: BudgetValidationError("Budget remote id is required."),
      };
    }

    const budgetResult = await repository.getBudgetPlanByRemoteId({
      accountRemoteId: normalizedAccountRemoteId,
      remoteId: normalizedRemoteId,
    });
    const budgetContext = budgetResult.success ? budgetResult.value : null;

    if (
      !budgetResult.success &&
      budgetResult.error.type !== BudgetErrorType.BudgetNotFound
    ) {
      return {
        success: false,
        error: budgetResult.error,
      };
    }

    const deleteResult = await repository.deleteBudgetPlanByRemoteId({
      accountRemoteId: normalizedAccountRemoteId,
      remoteId: normalizedRemoteId,
    });

    if (!deleteResult.success) {
      if (budgetContext) {
        await recordAuditEventUseCase?.execute({
          accountRemoteId: budgetContext.accountRemoteId,
          ownerUserRemoteId: budgetContext.ownerUserRemoteId,
          actorUserRemoteId: budgetContext.ownerUserRemoteId,
          module: AuditModule.Budget,
          action: "budget_delete",
          sourceModule: "budget",
          sourceRemoteId: budgetContext.remoteId,
          sourceAction: "delete_budget",
          outcome: AuditOutcome.Failure,
          severity: AuditSeverity.Warning,
          summary: `Budget delete failed: ${budgetContext.categoryNameSnapshot}`,
          metadataJson: JSON.stringify({
            budgetRemoteId: budgetContext.remoteId,
            budgetMonth: budgetContext.budgetMonth,
            categoryRemoteId: budgetContext.categoryRemoteId,
            errorMessage: deleteResult.error.message,
          }),
        });
      }

      return deleteResult;
    }
    if (!budgetContext || !deleteResult.value) {
      return deleteResult;
    }

    const auditResult = await recordAuditEventUseCase?.execute({
      accountRemoteId: budgetContext.accountRemoteId,
      ownerUserRemoteId: budgetContext.ownerUserRemoteId,
      actorUserRemoteId: budgetContext.ownerUserRemoteId,
      module: AuditModule.Budget,
      action: "budget_delete",
      sourceModule: "budget",
      sourceRemoteId: budgetContext.remoteId,
      sourceAction: "delete_budget",
      outcome: AuditOutcome.Success,
      severity: AuditSeverity.Warning,
      summary: `Budget deleted: ${budgetContext.categoryNameSnapshot}`,
      metadataJson: JSON.stringify({
        budgetRemoteId: budgetContext.remoteId,
        budgetMonth: budgetContext.budgetMonth,
        categoryRemoteId: budgetContext.categoryRemoteId,
      }),
    });

    if (auditResult && !auditResult.success) {
      return {
        success: false,
        error: BudgetValidationError(
          `Budget deleted, but audit event failed: ${auditResult.error.message}`,
        ),
      };
    }

    return deleteResult;
  },
});
