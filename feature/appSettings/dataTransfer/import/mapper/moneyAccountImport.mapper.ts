import { SaveMoneyAccountPayload, MoneyAccountType } from "@/feature/accounts/types/moneyAccount.types";

const createRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `macc-import-${randomId}`;
  }

  return `macc-import-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const mapMoneyAccountImportData = (params: {
  normalizedData: Record<string, unknown>;
  activeUserRemoteId: string;
  activeAccountRemoteId: string;
  activeAccountDisplayName: string;
}): SaveMoneyAccountPayload => ({
  remoteId: createRemoteId(),
  ownerUserRemoteId: params.activeUserRemoteId,
  scopeAccountRemoteId: params.activeAccountRemoteId,
  scopeAccountDisplayNameSnapshot: params.activeAccountDisplayName,
  name: String(params.normalizedData["name"] ?? "").trim(),
  type:
    (params.normalizedData["type"] as SaveMoneyAccountPayload["type"]) ??
    MoneyAccountType.Cash,
  currentBalance: Number(params.normalizedData["currentBalance"] ?? 0),
  description:
    (params.normalizedData["description"] as string | null) ?? null,
  currencyCode:
    (params.normalizedData["currencyCode"] as string | null) ?? null,
  isPrimary: Boolean(params.normalizedData["isPrimary"]),
  isActive:
    params.normalizedData["isActive"] === undefined
      ? true
      : Boolean(params.normalizedData["isActive"]),
});
