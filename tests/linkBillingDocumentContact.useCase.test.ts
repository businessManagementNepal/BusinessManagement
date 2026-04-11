import { describe, expect, it, vi } from "vitest";
import { createLinkBillingDocumentContactUseCase } from "@/feature/billing/useCase/linkBillingDocumentContact.useCase.impl";
import { BillingRepository } from "@/feature/billing/data/repository/billing.repository";
import { BillingValidationError } from "@/feature/billing/types/billing.types";

describe("linkBillingDocumentContact.useCase", () => {
  it("forwards the billing document id and contact id to the repository", async () => {
    const repository = {
      linkBillingDocumentContactRemoteId: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const useCase = createLinkBillingDocumentContactUseCase(
      repository as unknown as BillingRepository,
    );

    const result = await useCase.execute({
      billingDocumentRemoteId: "bill-1",
      contactRemoteId: "contact-1",
    });

    expect(result.success).toBe(true);
    expect(repository.linkBillingDocumentContactRemoteId).toHaveBeenCalledWith(
      "bill-1",
      "contact-1",
    );
  });

  it("supports clearing the contact link and propagates repository failures unchanged", async () => {
    const repository = {
      linkBillingDocumentContactRemoteId: vi.fn(async () => ({
        success: false as const,
        error: BillingValidationError("document not found"),
      })),
    };

    const useCase = createLinkBillingDocumentContactUseCase(
      repository as unknown as BillingRepository,
    );

    const result = await useCase.execute({
      billingDocumentRemoteId: "bill-404",
      contactRemoteId: null,
    });

    expect(repository.linkBillingDocumentContactRemoteId).toHaveBeenCalledWith(
      "bill-404",
      null,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("document not found");
    }
  });
});
