import {
  BillingDocument,
  BillingErrorType,
} from "@/feature/billing/types/billing.types";
import { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import { GetBillingDocumentByRemoteIdUseCase } from "@/feature/billing/useCase/getBillingDocumentByRemoteId.useCase";
import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { UpdateLedgerEntryUseCase } from "@/feature/ledger/useCase/updateLedgerEntry.useCase";
import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import { OrderValidationError } from "@/feature/orders/types/order.types";
import {
  buildBillingDocumentPayloadFromOrder,
  buildLedgerDuePayloadFromOrder,
  buildOrderBillingDocumentRemoteId,
  buildOrderLedgerDueEntryRemoteId,
  isOrderFinancialStatus,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import { mapBillingDocumentToSaveBillingDocumentPayload } from "@/feature/orders/utils/orderCommercialSyncRollback.util";
import { resolvePersistedOrderTotalAmount } from "@/feature/orders/utils/orderSettlementFromTransactions.util";
import {
  EnsureOrderBillingAndDueLinksResult,
  EnsureOrderBillingAndDueLinksUseCase,
} from "./ensureOrderBillingAndDueLinks.useCase";

const buildRollbackAwareValidationError = (params: {
  primaryMessage: string;
  rollbackMessage: string | null;
}) =>
  OrderValidationError(
    params.rollbackMessage
      ? `${params.primaryMessage} Rollback failed: ${params.rollbackMessage}`
      : params.primaryMessage,
  );

const rollbackBillingDocumentState = async (params: {
  previousBillingDocument: BillingDocument | null;
  billingDocumentRemoteId: string;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
}): Promise<string | null> => {
  if (params.previousBillingDocument) {
    const restoreResult = await params.saveBillingDocumentUseCase.execute(
      mapBillingDocumentToSaveBillingDocumentPayload(
        params.previousBillingDocument,
      ),
    );

    if (restoreResult.success) {
      return null;
    }

    return restoreResult.error.message;
  }

  const deleteResult = await params.deleteBillingDocumentUseCase.execute(
    params.billingDocumentRemoteId,
  );

  if (deleteResult.success) {
    return null;
  }

  return deleteResult.error.message;
};

export const createEnsureOrderBillingAndDueLinksUseCase = (params: {
  orderRepository: OrderRepository;
  getContactsUseCase: GetContactsUseCase;
  getBillingDocumentByRemoteIdUseCase: GetBillingDocumentByRemoteIdUseCase;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  addLedgerEntryUseCase: AddLedgerEntryUseCase;
  updateLedgerEntryUseCase: UpdateLedgerEntryUseCase;
}): EnsureOrderBillingAndDueLinksUseCase => ({
  async execute(orderRemoteId: string): Promise<EnsureOrderBillingAndDueLinksResult> {
    const normalizedOrderRemoteId = orderRemoteId.trim();
    if (!normalizedOrderRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Order remote id is required."),
      };
    }

    const orderResult = await params.orderRepository.getOrderByRemoteId(
      normalizedOrderRemoteId,
    );
    if (!orderResult.success) {
      return { success: false, error: orderResult.error };
    }

    const order = orderResult.value;

    if (!isOrderFinancialStatus(order.status)) {
      return {
        success: false,
        error: OrderValidationError(
          "Move the order to a confirmed business status before creating billing and due effects.",
        ),
      };
    }

    const normalizedCustomerRemoteId = order.customerRemoteId?.trim() ?? "";
    if (!normalizedCustomerRemoteId) {
      return {
        success: false,
        error: OrderValidationError(
          "Select a customer contact before confirming this order.",
        ),
      };
    }

    const resolvedTotalAmount = resolvePersistedOrderTotalAmount(order);
    if (resolvedTotalAmount === null || resolvedTotalAmount <= 0) {
      return {
        success: false,
        error: OrderValidationError(
          "Order total must be available before creating billing and ledger effects.",
        ),
      };
    }

    const contactsResult = await params.getContactsUseCase.execute({
      accountRemoteId: order.accountRemoteId,
    });
    if (!contactsResult.success) {
      return {
        success: false,
        error: OrderValidationError(contactsResult.error.message),
      };
    }

    const contact = contactsResult.value.find(
      (item) => item.remoteId === normalizedCustomerRemoteId,
    );
    if (!contact) {
      return {
        success: false,
        error: OrderValidationError(
          "The selected customer contact could not be found.",
        ),
      };
    }

    const billingDocumentRemoteId =
      buildOrderBillingDocumentRemoteId(order.remoteId);
    const ledgerDueEntryRemoteId =
      buildOrderLedgerDueEntryRemoteId(order.remoteId);

    const existingBillingDocumentResult =
      await params.getBillingDocumentByRemoteIdUseCase.execute(
        billingDocumentRemoteId,
      );

    let previousBillingDocument: BillingDocument | null = null;

    if (existingBillingDocumentResult.success) {
      previousBillingDocument = existingBillingDocumentResult.value;
    } else if (
      existingBillingDocumentResult.error.type !== BillingErrorType.DocumentNotFound
    ) {
      return {
        success: false,
        error: OrderValidationError(existingBillingDocumentResult.error.message),
      };
    }

    const saveBillingDocumentResult =
      await params.saveBillingDocumentUseCase.execute(
        buildBillingDocumentPayloadFromOrder({
          order,
          contact,
          billingDocumentRemoteId,
          linkedLedgerEntryRemoteId: ledgerDueEntryRemoteId,
        }),
      );

    if (!saveBillingDocumentResult.success) {
      return {
        success: false,
        error: OrderValidationError(saveBillingDocumentResult.error.message),
      };
    }

    const ledgerEntriesResult = await params.getLedgerEntriesUseCase.execute({
      businessAccountRemoteId: order.accountRemoteId,
    });
    if (!ledgerEntriesResult.success) {
      const rollbackMessage = await rollbackBillingDocumentState({
        previousBillingDocument,
        billingDocumentRemoteId,
        saveBillingDocumentUseCase: params.saveBillingDocumentUseCase,
        deleteBillingDocumentUseCase: params.deleteBillingDocumentUseCase,
      });

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: ledgerEntriesResult.error.message,
          rollbackMessage,
        }),
      };
    }

    const hadExistingLedgerDue = ledgerEntriesResult.value.some(
      (entry) => entry.remoteId === ledgerDueEntryRemoteId,
    );

    const ledgerDuePayload = buildLedgerDuePayloadFromOrder({
      order,
      contact,
      billingDocumentRemoteId,
      ledgerDueEntryRemoteId,
    });

    const saveLedgerResult = hadExistingLedgerDue
      ? await params.updateLedgerEntryUseCase.execute(ledgerDuePayload)
      : await params.addLedgerEntryUseCase.execute(ledgerDuePayload);

    if (!saveLedgerResult.success) {
      const rollbackMessage = await rollbackBillingDocumentState({
        previousBillingDocument,
        billingDocumentRemoteId,
        saveBillingDocumentUseCase: params.saveBillingDocumentUseCase,
        deleteBillingDocumentUseCase: params.deleteBillingDocumentUseCase,
      });

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: saveLedgerResult.error.message,
          rollbackMessage,
        }),
      };
    }

    return {
      success: true,
      value: {
        order,
        contact,
        billingDocumentRemoteId,
        ledgerDueEntryRemoteId,
      },
    };
  },
});
