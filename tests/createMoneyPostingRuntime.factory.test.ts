import type { Database } from "@nozbe/watermelondb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createLocalMoneyPostingDatasource: vi.fn(),
  createLocalMoneyAccountBalanceDatasource: vi.fn(),
  createMoneyPostingWorkflowRepository: vi.fn(),
  createLocalAuditDatasource: vi.fn(),
  createAuditRepository: vi.fn(),
  createRecordAuditEventUseCase: vi.fn(),
  createRunMoneyPostingWorkflowUseCase: vi.fn(),
  createMoneyPostingRepository: vi.fn(),
  createPostMoneyMovementUseCase: vi.fn(),
  createDeleteMoneyMovementUseCase: vi.fn(),
}));

vi.mock(
  "@/feature/transactions/data/dataSource/local.moneyPosting.datasource.impl",
  () => ({
    createLocalMoneyPostingDatasource: mocks.createLocalMoneyPostingDatasource,
  }),
);

vi.mock(
  "@/feature/transactions/data/dataSource/local.moneyAccountBalance.datasource.impl",
  () => ({
    createLocalMoneyAccountBalanceDatasource:
      mocks.createLocalMoneyAccountBalanceDatasource,
  }),
);

vi.mock(
  "@/feature/transactions/workflow/moneyPosting/repository/moneyPostingWorkflow.repository.impl",
  () => ({
    createMoneyPostingWorkflowRepository:
      mocks.createMoneyPostingWorkflowRepository,
  }),
);

vi.mock("@/feature/audit/data/dataSource/local.audit.datasource.impl", () => ({
  createLocalAuditDatasource: mocks.createLocalAuditDatasource,
}));

vi.mock("@/feature/audit/data/repository/audit.repository.impl", () => ({
  createAuditRepository: mocks.createAuditRepository,
}));

vi.mock("@/feature/audit/useCase/recordAuditEvent.useCase.impl", () => ({
  createRecordAuditEventUseCase: mocks.createRecordAuditEventUseCase,
}));

vi.mock(
  "@/feature/transactions/workflow/moneyPosting/useCase/runMoneyPostingWorkflow.useCase.impl",
  () => ({
    createRunMoneyPostingWorkflowUseCase:
      mocks.createRunMoneyPostingWorkflowUseCase,
  }),
);

vi.mock("@/feature/transactions/data/repository/moneyPosting.repository.impl", () => ({
  createMoneyPostingRepository: mocks.createMoneyPostingRepository,
}));

vi.mock("@/feature/transactions/useCase/postMoneyMovement.useCase.impl", () => ({
  createPostMoneyMovementUseCase: mocks.createPostMoneyMovementUseCase,
}));

vi.mock("@/feature/transactions/useCase/deleteMoneyMovement.useCase.impl", () => ({
  createDeleteMoneyMovementUseCase: mocks.createDeleteMoneyMovementUseCase,
}));

describe("createMoneyPostingRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds canonical posting runtime in the factory layer", async () => {
    const { createMoneyPostingRuntime } = await import(
      "@/feature/transactions/factory/createMoneyPostingRuntime.factory"
    );

    const database = {} as Database;
    const transactionDatasource = { id: "tx-datasource" };
    const moneyAccountBalanceDatasource = { id: "balance-datasource" };
    const workflowRepository = { id: "workflow-repository" };
    const auditDatasource = { id: "audit-datasource" };
    const auditRepository = { id: "audit-repository" };
    const recordAuditEventUseCase = { execute: vi.fn() };
    const runMoneyPostingWorkflowUseCase = {
      postMoneyMovement: vi.fn(),
      deleteMoneyMovementByRemoteId: vi.fn(),
    };
    const moneyPostingRepository = { id: "money-posting-repository" };

    const postMoneyMovementUseCase = { execute: vi.fn() };
    const deleteMoneyMovementUseCase = { execute: vi.fn() };

    mocks.createLocalMoneyPostingDatasource.mockReturnValue(transactionDatasource);
    mocks.createLocalMoneyAccountBalanceDatasource.mockReturnValue(
      moneyAccountBalanceDatasource,
    );
    mocks.createMoneyPostingWorkflowRepository.mockReturnValue(workflowRepository);
    mocks.createLocalAuditDatasource.mockReturnValue(auditDatasource);
    mocks.createAuditRepository.mockReturnValue(auditRepository);
    mocks.createRecordAuditEventUseCase.mockReturnValue(recordAuditEventUseCase);
    mocks.createRunMoneyPostingWorkflowUseCase.mockReturnValue(
      runMoneyPostingWorkflowUseCase,
    );
    mocks.createMoneyPostingRepository.mockReturnValue(moneyPostingRepository);
    mocks.createPostMoneyMovementUseCase.mockReturnValue(postMoneyMovementUseCase);
    mocks.createDeleteMoneyMovementUseCase.mockReturnValue(
      deleteMoneyMovementUseCase,
    );

    const runtime = createMoneyPostingRuntime(database);

    expect(mocks.createLocalMoneyPostingDatasource).toHaveBeenCalledWith(database);
    expect(mocks.createLocalMoneyAccountBalanceDatasource).toHaveBeenCalledWith(
      database,
    );
    expect(mocks.createMoneyPostingWorkflowRepository).toHaveBeenCalledWith({
      transactionDatasource,
      moneyAccountBalanceDatasource,
    });
    expect(mocks.createLocalAuditDatasource).toHaveBeenCalledWith(database);
    expect(mocks.createAuditRepository).toHaveBeenCalledWith(auditDatasource);
    expect(mocks.createRecordAuditEventUseCase).toHaveBeenCalledWith(
      auditRepository,
    );
    expect(mocks.createRunMoneyPostingWorkflowUseCase).toHaveBeenCalledWith({
      workflowRepository,
      recordAuditEventUseCase,
    });
    expect(mocks.createMoneyPostingRepository).toHaveBeenCalledWith(
      runMoneyPostingWorkflowUseCase,
    );
    expect(mocks.createPostMoneyMovementUseCase).toHaveBeenCalledWith(
      moneyPostingRepository,
    );
    expect(mocks.createDeleteMoneyMovementUseCase).toHaveBeenCalledWith(
      moneyPostingRepository,
    );

    expect(runtime.postMoneyMovementUseCase).toBe(postMoneyMovementUseCase);
    expect(runtime.deleteMoneyMovementUseCase).toBe(deleteMoneyMovementUseCase);
    expect(runtime.postBusinessTransactionUseCase).toBe(postMoneyMovementUseCase);
    expect(runtime.deleteBusinessTransactionUseCase).toBe(
      deleteMoneyMovementUseCase,
    );
  });
});
