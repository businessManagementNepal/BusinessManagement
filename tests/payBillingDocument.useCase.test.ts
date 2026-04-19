import { describe, expect, it, vi } from "vitest";
import { BillingDocumentType } from "@/feature/billing/types/billing.types";
import { createPayBillingDocumentUseCase } from "@/feature/billing/useCase/payBillingDocument.useCase.impl";
import { RunBillingSettlementUseCase } from "@/feature/billing/workflow/billingSettlement/useCase/runBillingSettlement.useCase";

describe("payBillingDocument.useCase", () => {
  it("delegates payment to the billing settlement workflow", async () => {
    const runBillingSettlementUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const useCase = createPayBillingDocumentUseCase(
      runBillingSettlementUseCase as unknown as RunBillingSettlementUseCase,
    );

    const payload = {
      billingDocumentRemoteId: "bill-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      ownerUserRemoteId: "user-1",
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      amount: 500,
      settledAt: 1_710_000_000_000,
      note: "cash payment",
      documentType: BillingDocumentType.Invoice,
      documentNumber: "INV-2026-001",
    };

    const result = await useCase.execute(payload);

    expect(result).toEqual({ success: true, value: true });
    expect(runBillingSettlementUseCase.execute).toHaveBeenCalledTimes(1);
    expect(runBillingSettlementUseCase.execute).toHaveBeenCalledWith(payload);
  });

  it("returns workflow validation failures as-is", async () => {
    const runBillingSettlementUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR" as const,
          message: "Payment amount cannot be greater than outstanding amount.",
        },
      })),
    };

    const useCase = createPayBillingDocumentUseCase(
      runBillingSettlementUseCase as unknown as RunBillingSettlementUseCase,
    );

    const result = await useCase.execute({
      billingDocumentRemoteId: "bill-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      ownerUserRemoteId: "user-1",
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      amount: 1_000,
      settledAt: 1_710_000_000_000,
      note: null,
      documentType: BillingDocumentType.Invoice,
      documentNumber: "INV-2026-001",
    });

    expect(result.success).toBe(false);
    expect(runBillingSettlementUseCase.execute).toHaveBeenCalledTimes(1);
    if (!result.success) {
      expect(result.error.message).toBe(
        "Payment amount cannot be greater than outstanding amount.",
      );
    }
  });
});
