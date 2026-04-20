export type OrderLegacyTransactionLinkRepairWorkflowInput = {
  ownerUserRemoteId: string;
  accountRemoteId: string;
};

export type OrderLegacyTransactionLinkRepairWorkflowResult = {
  scannedCount: number;
  repairedCount: number;
};
