import { describe, expect, it } from "vitest";
import { BillingDocumentFormState } from "@/feature/billing/viewModel/billing.viewModel";
import { LedgerEditorFormState } from "@/feature/ledger/types/ledger.state.types";

type HasPublicKey<TState, TKey extends PropertyKey> = TKey extends keyof TState
  ? true
  : false;

describe("public view model state contracts", () => {
  it("keeps Billing persistence metadata out of the public form state", () => {
    const remoteIdIsPublic: HasPublicKey<
      BillingDocumentFormState,
      "remoteId"
    > = false;
    const statusIsPublic: HasPublicKey<
      BillingDocumentFormState,
      "status"
    > = false;

    expect(remoteIdIsPublic).toBe(false);
    expect(statusIsPublic).toBe(false);
  });

  it("keeps Ledger persistence metadata out of the public editor state", () => {
    const editingRemoteIdIsPublic: HasPublicKey<
      LedgerEditorFormState,
      "editingRemoteId"
    > = false;
    const linkedDocumentRemoteIdIsPublic: HasPublicKey<
      LedgerEditorFormState,
      "linkedDocumentRemoteId"
    > = false;
    const linkedTransactionRemoteIdIsPublic: HasPublicKey<
      LedgerEditorFormState,
      "linkedTransactionRemoteId"
    > = false;

    expect(editingRemoteIdIsPublic).toBe(false);
    expect(linkedDocumentRemoteIdIsPublic).toBe(false);
    expect(linkedTransactionRemoteIdIsPublic).toBe(false);
  });
});
