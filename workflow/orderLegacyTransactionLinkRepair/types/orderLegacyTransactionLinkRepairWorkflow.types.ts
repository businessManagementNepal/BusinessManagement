export type OrderLegacyTransactionLinkRepairWorkflowInput = {
  ownerUserRemoteId: string;
  accountRemoteId: string;
};

export type OrderLegacyTransactionLinkRepairWorkflowResult = {
  scannedCount: number;
  repairedCount: number;
  ambiguousCount: number;
  skippedCount: number;
};

export const ORDER_LEGACY_TITLE_PREFIX = {
  Payment: "Order Payment ",
  Refund: "Order Refund ",
} as const;

export const ORDER_LINKED_SOURCE_ACTION = {
  Payment: "payment",
  Refund: "refund",
} as const;
