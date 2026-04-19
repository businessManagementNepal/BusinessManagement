import { BillingRepository } from "@/feature/billing/data/repository/billing.repository";
import { LinkBillingDocumentLedgerEntryUseCase } from "./linkBillingDocumentLedgerEntry.useCase";

export const createLinkBillingDocumentLedgerEntryUseCase = (
  repository: BillingRepository,
): LinkBillingDocumentLedgerEntryUseCase => ({
  execute(documentRemoteId: string, ledgerEntryRemoteId: string | null) {
    return repository.linkBillingDocumentLedgerEntryRemoteId(
      documentRemoteId.trim(),
      ledgerEntryRemoteId?.trim() || null,
    );
  },
});
