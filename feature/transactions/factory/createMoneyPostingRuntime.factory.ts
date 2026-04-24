import { createLocalAuditDatasource } from "@/feature/audit/data/dataSource/local.audit.datasource.impl";
import { createAuditRepository } from "@/feature/audit/data/repository/audit.repository.impl";
import { createRecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase.impl";
import { createLocalMoneyAccountBalanceDatasource } from "@/feature/transactions/data/dataSource/local.moneyAccountBalance.datasource.impl";
import { createLocalMoneyPostingDatasource } from "@/feature/transactions/data/dataSource/local.moneyPosting.datasource.impl";
import { createMoneyPostingRepository } from "@/feature/transactions/data/repository/moneyPosting.repository.impl";
import { createDeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase.impl";
import { createDeleteMoneyMovementUseCase } from "@/feature/transactions/useCase/deleteMoneyMovement.useCase.impl";
import type { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import type { DeleteMoneyMovementUseCase } from "@/feature/transactions/useCase/deleteMoneyMovement.useCase";
import { createPostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase.impl";
import { createPostMoneyMovementUseCase } from "@/feature/transactions/useCase/postMoneyMovement.useCase.impl";
import type { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import type { PostMoneyMovementUseCase } from "@/feature/transactions/useCase/postMoneyMovement.useCase";
import { createMoneyPostingWorkflowRepository } from "@/feature/transactions/workflow/moneyPosting/repository/moneyPostingWorkflow.repository.impl";
import { createRunMoneyPostingWorkflowUseCase } from "@/feature/transactions/workflow/moneyPosting/useCase/runMoneyPostingWorkflow.useCase.impl";
import { Database } from "@nozbe/watermelondb";

export type MoneyPostingRuntime = {
  postMoneyMovementUseCase: PostMoneyMovementUseCase;
  deleteMoneyMovementUseCase: DeleteMoneyMovementUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
};

export const createMoneyPostingRuntime = (
  database: Database,
): MoneyPostingRuntime => {
  const transactionDatasource = createLocalMoneyPostingDatasource(database);
  const moneyAccountBalanceDatasource =
    createLocalMoneyAccountBalanceDatasource(database);

  const workflowRepository = createMoneyPostingWorkflowRepository({
    transactionDatasource,
    moneyAccountBalanceDatasource,
  });
  const auditDatasource = createLocalAuditDatasource(database);
  const auditRepository = createAuditRepository(auditDatasource);
  const recordAuditEventUseCase = createRecordAuditEventUseCase(auditRepository);
  const runMoneyPostingWorkflowUseCase = createRunMoneyPostingWorkflowUseCase({
    workflowRepository,
    recordAuditEventUseCase,
  });

  const moneyPostingRepository = createMoneyPostingRepository(
    runMoneyPostingWorkflowUseCase,
  );

  const postMoneyMovementUseCase =
    createPostMoneyMovementUseCase(moneyPostingRepository);

  const deleteMoneyMovementUseCase =
    createDeleteMoneyMovementUseCase(moneyPostingRepository);

  return {
    postMoneyMovementUseCase,
    deleteMoneyMovementUseCase,
    postBusinessTransactionUseCase: createPostBusinessTransactionUseCase(
      postMoneyMovementUseCase,
    ),
    deleteBusinessTransactionUseCase: createDeleteBusinessTransactionUseCase(
      deleteMoneyMovementUseCase,
    ),
  };
};
