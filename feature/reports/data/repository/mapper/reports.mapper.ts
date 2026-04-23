import { BillingDocumentModel } from "@/feature/billing/data/dataSource/db/billingDocument.model";
import { BillingDocumentTypeValue } from "@/feature/billing/types/billing.types";
import { EmiPlanModel } from "@/feature/emiLoans/data/dataSource/db/emiPlan.model";
import { InventoryMovementModel } from "@/feature/inventory/data/dataSource/db/inventoryMovement.model";
import { LedgerEntryModel } from "@/feature/ledger/data/dataSource/db/ledger.model";
import { ProductModel } from "@/feature/products/data/dataSource/db/product.model";
import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import { MoneyAccountModel } from "@/feature/accounts/data/dataSource/db/moneyAccount.model";

export type TransactionRecord = {
  title: string;
  amount: number;
  categoryLabel: string | null;
  happenedAt: number;
  direction: string;
  transactionType: string;
  accountDisplayNameSnapshot: string;
};

export type BillingDocumentRecord = {
  remoteId: string;
  documentType: BillingDocumentTypeValue;
  customerName: string;
  status: string;
  totalAmount: number;
  issuedAt: number;
};

export type LedgerEntryRecord = {
  partyName: string;
  entryType: string;
  balanceDirection: string;
  amount: number;
  currencyCode: string | null;
  happenedAt: number;
  dueAt: number | null;
};

export type EmiPlanRecord = {
  title: string;
  totalAmount: number;
  paidAmount: number;
  installmentCount: number;
  paidInstallmentCount: number;
  nextDueAt: number | null;
  status: string;
};

export type InventoryMovementRecord = {
  productRemoteId: string;
  productNameSnapshot: string;
  productUnitLabelSnapshot: string | null;
  movementType: string;
  deltaQuantity: number;
  unitRate: number | null;
  movementAt: number;
};

export type ProductRecord = {
  remoteId: string;
  name: string;
  categoryName: string | null;
  salePrice: number;
  costPrice: number | null;
  stockQuantity: number | null;
  unitLabel: string | null;
  status: string;
};

export type MoneyAccountRecord = {
  name: string;
  accountType: string;
  currentBalance: number;
  currencyCode: string | null;
  isPrimary: boolean;
};

export const mapTransactionModel = (model: TransactionModel): TransactionRecord => ({
  title: model.title,
  amount: model.amount,
  categoryLabel: model.categoryLabel,
  happenedAt: model.happenedAt,
  direction: model.direction,
  transactionType: model.transactionType,
  accountDisplayNameSnapshot: model.accountDisplayNameSnapshot,
});

export const mapBillingDocumentModel = (
  model: BillingDocumentModel,
): BillingDocumentRecord => ({
  remoteId: model.remoteId,
  documentType: model.documentType,
  customerName: model.customerName,
  status: model.status,
  totalAmount: model.totalAmount,
  issuedAt: model.issuedAt,
});

export const mapLedgerEntryModel = (model: LedgerEntryModel): LedgerEntryRecord => ({
  partyName: model.partyName,
  entryType: model.entryType,
  balanceDirection: model.balanceDirection,
  amount: model.amount,
  currencyCode: model.currencyCode,
  happenedAt: model.happenedAt,
  dueAt: model.dueAt,
});

export const mapEmiPlanModel = (model: EmiPlanModel): EmiPlanRecord => ({
  title: model.title,
  totalAmount: model.totalAmount,
  paidAmount: model.paidAmount,
  installmentCount: model.installmentCount,
  paidInstallmentCount: model.paidInstallmentCount,
  nextDueAt: model.nextDueAt,
  status: model.status,
});

export const mapInventoryMovementModel = (
  model: InventoryMovementModel,
): InventoryMovementRecord => ({
  productRemoteId: model.productRemoteId,
  productNameSnapshot: model.productNameSnapshot,
  productUnitLabelSnapshot: model.productUnitLabelSnapshot,
  movementType: model.movementType,
  deltaQuantity: model.deltaQuantity,
  unitRate: model.unitRate,
  movementAt: model.movementAt,
});

export const mapProductModel = (model: ProductModel): ProductRecord => ({
  remoteId: model.remoteId,
  name: model.name,
  categoryName: model.categoryName,
  salePrice: model.salePrice,
  costPrice: model.costPrice,
  stockQuantity: model.stockQuantity,
  unitLabel: model.unitLabel,
  status: model.status,
});

export const mapMoneyAccountModel = (
  model: MoneyAccountModel,
): MoneyAccountRecord => ({
  name: model.name,
  accountType: model.accountType,
  currentBalance: model.currentBalance,
  currencyCode: model.currencyCode,
  isPrimary: model.isPrimary,
});
