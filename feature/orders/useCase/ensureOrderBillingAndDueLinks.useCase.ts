import { Result } from "../../../shared/types/result.types";
import { Contact } from "../../contacts/types/contact.types";
import { Order, OrderError } from "../types/order.types";

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
