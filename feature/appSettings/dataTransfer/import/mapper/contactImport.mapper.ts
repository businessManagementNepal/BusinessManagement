import {
  AccountType,
  AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { SaveContactPayload, ContactType } from "@/feature/contacts/types/contact.types";

const createRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `con-import-${randomId}`;
  }

  return `con-import-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const mapContactImportData = (params: {
  normalizedData: Record<string, unknown>;
  activeUserRemoteId: string;
  activeAccountRemoteId: string;
}): SaveContactPayload => ({
  remoteId: createRemoteId(),
  ownerUserRemoteId: params.activeUserRemoteId,
  accountRemoteId: params.activeAccountRemoteId,
  accountType:
    (params.normalizedData["accountType"] as AccountTypeValue | undefined) ??
    AccountType.Business,
  contactType:
    (params.normalizedData["contactType"] as SaveContactPayload["contactType"]) ??
    ContactType.Customer,
  fullName: String(params.normalizedData["fullName"] ?? "").trim(),
  phoneNumber: (params.normalizedData["phoneNumber"] as string | null) ?? null,
  emailAddress:
    (params.normalizedData["emailAddress"] as string | null) ?? null,
  address: (params.normalizedData["address"] as string | null) ?? null,
  taxId: (params.normalizedData["taxId"] as string | null) ?? null,
  openingBalanceAmount: Number(params.normalizedData["openingBalanceAmount"] ?? 0),
  openingBalanceDirection:
    (params.normalizedData["openingBalanceDirection"] as SaveContactPayload["openingBalanceDirection"]) ??
    null,
  notes: (params.normalizedData["notes"] as string | null) ?? null,
  isArchived: false,
});
