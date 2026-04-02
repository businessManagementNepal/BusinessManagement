import { Result } from "@/shared/types/result.types";

export const EmiPlanMode = {
  Personal: "personal",
  Business: "business",
} as const;

export type EmiPlanModeValue = (typeof EmiPlanMode)[keyof typeof EmiPlanMode];

export const EmiPlanType = {
  MyEmi: "my_emi",
  MyLoan: "my_loan",
  BusinessLoan: "business_loan",
  CustomerInstallment: "customer_installment",
} as const;

export type EmiPlanTypeValue = (typeof EmiPlanType)[keyof typeof EmiPlanType];

export const EmiPaymentDirection = {
  Pay: "pay",
  Collect: "collect",
} as const;

export type EmiPaymentDirectionValue =
  (typeof EmiPaymentDirection)[keyof typeof EmiPaymentDirection];

export const EmiPlanStatus = {
  Active: "active",
  Closed: "closed",
} as const;

export type EmiPlanStatusValue = (typeof EmiPlanStatus)[keyof typeof EmiPlanStatus];

export const EmiInstallmentStatus = {
  Pending: "pending",
  Paid: "paid",
} as const;

export type EmiInstallmentStatusValue =
  (typeof EmiInstallmentStatus)[keyof typeof EmiInstallmentStatus];

export const EmiSyncStatus = {
  PendingCreate: "pending_create",
  PendingUpdate: "pending_update",
  PendingDelete: "pending_delete",
  Synced: "synced",
  Failed: "failed",
} as const;

export type EmiSyncStatusValue = (typeof EmiSyncStatus)[keyof typeof EmiSyncStatus];

export const InstallmentPaymentRecordType = {
  Transaction: "transaction",
  Ledger: "ledger",
} as const;

export type InstallmentPaymentRecordTypeValue =
  (typeof InstallmentPaymentRecordType)[keyof typeof InstallmentPaymentRecordType];

export type EmiPlan = {
  remoteId: string;
  ownerUserRemoteId: string;
  businessAccountRemoteId: string | null;
  planMode: EmiPlanModeValue;
  planType: EmiPlanTypeValue;
  paymentDirection: EmiPaymentDirectionValue;
  title: string;
  counterpartyName: string | null;
  counterpartyPhone: string | null;
  linkedAccountRemoteId: string;
  linkedAccountDisplayNameSnapshot: string;
  currencyCode: string | null;
  totalAmount: number;
  installmentCount: number;
  paidInstallmentCount: number;
  paidAmount: number;
  firstDueAt: number;
  nextDueAt: number | null;
  reminderEnabled: boolean;
  reminderDaysBefore: number | null;
  note: string | null;
  status: EmiPlanStatusValue;
  createdAt: number;
  updatedAt: number;
};

export type EmiInstallment = {
  remoteId: string;
  planRemoteId: string;
  installmentNumber: number;
  amount: number;
  dueAt: number;
  status: EmiInstallmentStatusValue;
  paidAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type InstallmentPaymentLink = {
  remoteId: string;
  planRemoteId: string;
  installmentRemoteId: string;
  paymentRecordType: InstallmentPaymentRecordTypeValue;
  paymentRecordRemoteId: string;
  paymentDirection: EmiPaymentDirectionValue;
  amount: number;
  createdAt: number;
  updatedAt: number;
};

export type EmiPlanDetail = {
  plan: EmiPlan;
  installments: EmiInstallment[];
};

export type SaveEmiPlanPayload = {
  remoteId: string;
  ownerUserRemoteId: string;
  businessAccountRemoteId: string | null;
  planMode: EmiPlanModeValue;
  planType: EmiPlanTypeValue;
  paymentDirection: EmiPaymentDirectionValue;
  title: string;
  counterpartyName: string | null;
  counterpartyPhone: string | null;
  linkedAccountRemoteId: string;
  linkedAccountDisplayNameSnapshot: string;
  currencyCode: string | null;
  totalAmount: number;
  installmentCount: number;
  paidInstallmentCount: number;
  paidAmount: number;
  firstDueAt: number;
  nextDueAt: number | null;
  reminderEnabled: boolean;
  reminderDaysBefore: number | null;
  note: string | null;
  status: EmiPlanStatusValue;
};

export type SaveEmiInstallmentPayload = {
  remoteId: string;
  planRemoteId: string;
  installmentNumber: number;
  amount: number;
  dueAt: number;
  status: EmiInstallmentStatusValue;
  paidAt: number | null;
};

export type CompleteInstallmentPaymentPayload = {
  linkRemoteId: string;
  planRemoteId: string;
  installmentRemoteId: string;
  paymentRecordType: InstallmentPaymentRecordTypeValue;
  paymentRecordRemoteId: string;
  paymentDirection: EmiPaymentDirectionValue;
  amount: number;
  paidAt: number;
};

export type EmiPlansResult = Result<
  EmiPlan[],
  import("./emi.error.types").EmiError
>;

export type EmiPlanResult = Result<
  EmiPlan,
  import("./emi.error.types").EmiError
>;

export type EmiPlanDetailResult = Result<
  EmiPlanDetail,
  import("./emi.error.types").EmiError
>;

export type EmiOperationResult = Result<
  boolean,
  import("./emi.error.types").EmiError
>;
