import { Contact } from "@/feature/contacts/types/contact.types";
import { Order, OrderError } from "@/feature/orders/types/order.types";
import { Result } from "@/shared/types/result.types";

export type EnsuredOrderBillingAndDueLinks = {
  order: Order;
  contact: Contact;
  billingDocumentRemoteId: string;
  ledgerDueEntryRemoteId: string;
};

export type EnsureOrderBillingAndDueLinksResult = Result<
  EnsuredOrderBillingAndDueLinks,
  OrderError
>;

export interface EnsureOrderBillingAndDueLinksUseCase {
  execute(orderRemoteId: string): Promise<EnsureOrderBillingAndDueLinksResult>;
}
