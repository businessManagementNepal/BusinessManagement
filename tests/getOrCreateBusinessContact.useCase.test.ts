import { describe, expect, it, vi } from "vitest";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { ContactType } from "@/feature/contacts/types/contact.types";
import { createGetOrCreateBusinessContactUseCase } from "@/feature/contacts/useCase/getOrCreateBusinessContact.useCase.impl";
import { GetOrCreateContactUseCase } from "@/feature/contacts/useCase/getOrCreateContact.useCase";

describe("getOrCreateBusinessContact.useCase", () => {
  it("delegates to the generic contact use case with business defaults", async () => {
    const getOrCreateContactUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "contact-1",
          accountRemoteId: "business-1",
          accountType: AccountType.Business,
          contactType: ContactType.Customer,
          fullName: "Acme Traders",
          phoneNumber: null,
          emailAddress: null,
          address: null,
          taxId: null,
          openingBalanceAmount: 0,
          openingBalanceDirection: null,
          notes: "from bill",
          isArchived: false,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };

    const useCase = createGetOrCreateBusinessContactUseCase(
      getOrCreateContactUseCase as unknown as GetOrCreateContactUseCase,
    );

    const result = await useCase.execute({
      accountRemoteId: "business-1",
      contactType: ContactType.Customer,
      fullName: "Acme Traders",
      ownerUserRemoteId: "user-1",
      notes: "from bill",
    });

    expect(result.success).toBe(true);
    expect(getOrCreateContactUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getOrCreateContactUseCase.execute).toHaveBeenCalledWith({
      accountRemoteId: "business-1",
      accountType: AccountType.Business,
      contactType: ContactType.Customer,
      fullName: "Acme Traders",
      ownerUserRemoteId: "user-1",
      phoneNumber: null,
      emailAddress: null,
      address: null,
      taxId: null,
      openingBalanceAmount: 0,
      openingBalanceDirection: null,
      notes: "from bill",
      isArchived: false,
    });
  });

  it("normalizes missing notes to null before delegating", async () => {
    const getOrCreateContactUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "contact-2",
          accountRemoteId: "business-1",
          accountType: AccountType.Business,
          contactType: ContactType.Supplier,
          fullName: "Vendor Ltd",
          phoneNumber: null,
          emailAddress: null,
          address: null,
          taxId: null,
          openingBalanceAmount: 0,
          openingBalanceDirection: null,
          notes: null,
          isArchived: false,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };

    const useCase = createGetOrCreateBusinessContactUseCase(
      getOrCreateContactUseCase as unknown as GetOrCreateContactUseCase,
    );

    await useCase.execute({
      accountRemoteId: "business-1",
      contactType: ContactType.Supplier,
      fullName: "Vendor Ltd",
      ownerUserRemoteId: "user-1",
    });

    expect(getOrCreateContactUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: AccountType.Business,
        contactType: ContactType.Supplier,
        notes: null,
      }),
    );
  });
});
