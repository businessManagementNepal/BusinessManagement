import { MoneyAccountModel } from "@/feature/accounts/data/dataSource/db/moneyAccount.model";
import { BillingDocumentModel } from "@/feature/billing/data/dataSource/db/billingDocument.model";
import { EmiPlanModel } from "@/feature/emiLoans/data/dataSource/db/emiPlan.model";
import { EmiPlanMode } from "@/feature/emiLoans/types/emi.entity.types";
import { InventoryMovementModel } from "@/feature/inventory/data/dataSource/db/inventoryMovement.model";
import { LedgerEntryModel } from "@/feature/ledger/data/dataSource/db/ledger.model";
import { LedgerEntryType } from "@/feature/ledger/types/ledger.entity.types";
import { ProductModel } from "@/feature/products/data/dataSource/db/product.model";
import {
    ReportMenuItem,
    ReportQuery,
    ReportScope,
} from "@/feature/reports/types/report.entity.types";
import { getReportDateRangeForPeriod } from "@/feature/reports/utils/reportPeriod.shared";
import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { ReportsDatasource, ReportsRawDataset } from "./reports.datasource";

const TRANSACTIONS_TABLE = "transactions";
const BILLING_DOCUMENTS_TABLE = "billing_documents";
const LEDGER_TABLE = "ledger_entries";
const EMI_TABLE = "emi_plans";
const INVENTORY_TABLE = "inventory_movements";
const PRODUCTS_TABLE = "products";
const MONEY_ACCOUNTS_TABLE = "money_accounts";

type DateWindow = {
  startMs: number | null;
  endMs: number | null;
};

type DatasetRequirements = {
  loadTransactions: boolean;
  loadBillingDocuments: boolean;
  loadLedgerEntries: boolean;
  loadEmiPlans: boolean;
  loadInventoryMovements: boolean;
  loadProducts: boolean;
  loadMoneyAccounts: boolean;
  dateWindow: DateWindow;
  ledgerEntryTypes: readonly string[] | null;
};


const resolveDatasetRequirements = (
  query: ReportQuery,
  nowMs: number,
): DatasetRequirements => {
  const periodWindow = getReportDateRangeForPeriod(query.period, nowMs);
  const businessFinancialDataRequired = query.scope === ReportScope.Business;

  switch (query.reportId) {
    case undefined:
    case null:
      return {
        loadTransactions: true,
        loadBillingDocuments: businessFinancialDataRequired,
        loadLedgerEntries: businessFinancialDataRequired,
        loadEmiPlans: false,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: false,
        dateWindow: periodWindow,
        ledgerEntryTypes: null,
      };

    case ReportMenuItem.Sales:
      return {
        loadTransactions: false,
        loadBillingDocuments: true,
        loadLedgerEntries: false,
        loadEmiPlans: false,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: false,
        dateWindow: periodWindow,
        ledgerEntryTypes: null,
      };

    case ReportMenuItem.PartyBalances:
      return {
        loadTransactions: false,
        loadBillingDocuments: false,
        loadLedgerEntries: true,
        loadEmiPlans: false,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: false,
        dateWindow: { startMs: null, endMs: null },
        ledgerEntryTypes: null,
      };

    case ReportMenuItem.Collection:
      return {
        loadTransactions: false,
        loadBillingDocuments: false,
        loadLedgerEntries: true,
        loadEmiPlans: false,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: false,
        dateWindow: periodWindow,
        ledgerEntryTypes: [LedgerEntryType.Collection],
      };

    case ReportMenuItem.Payment:
      return {
        loadTransactions: false,
        loadBillingDocuments: false,
        loadLedgerEntries: true,
        loadEmiPlans: false,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: false,
        dateWindow: periodWindow,
        ledgerEntryTypes: [LedgerEntryType.PaymentOut],
      };

    case ReportMenuItem.CategorySummary:
      return {
        loadTransactions: true,
        loadBillingDocuments: false,
        loadLedgerEntries: false,
        loadEmiPlans: false,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: false,
        dateWindow: periodWindow,
        ledgerEntryTypes: null,
      };

    case ReportMenuItem.AccountStatement:
      return {
        loadTransactions: true,
        loadBillingDocuments: false,
        loadLedgerEntries: false,
        loadEmiPlans: false,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: true,
        dateWindow: periodWindow,
        ledgerEntryTypes: null,
      };

    case ReportMenuItem.EmiLoan:
      return {
        loadTransactions: false,
        loadBillingDocuments: false,
        loadLedgerEntries: false,
        loadEmiPlans: true,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: false,
        dateWindow: { startMs: null, endMs: null },
        ledgerEntryTypes: null,
      };

    case ReportMenuItem.Stock:
      return {
        loadTransactions: false,
        loadBillingDocuments: false,
        loadLedgerEntries: false,
        loadEmiPlans: false,
        loadInventoryMovements: true,
        loadProducts: true,
        loadMoneyAccounts: false,
        dateWindow: { startMs: null, endMs: null },
        ledgerEntryTypes: null,
      };

    case ReportMenuItem.ExportData:
      return {
        loadTransactions: true,
        loadBillingDocuments: businessFinancialDataRequired,
        loadLedgerEntries: businessFinancialDataRequired,
        loadEmiPlans: false,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: false,
        dateWindow: periodWindow,
        ledgerEntryTypes: null,
      };

    default:
      return {
        loadTransactions: true,
        loadBillingDocuments: businessFinancialDataRequired,
        loadLedgerEntries: businessFinancialDataRequired,
        loadEmiPlans: false,
        loadInventoryMovements: false,
        loadProducts: false,
        loadMoneyAccounts: false,
        dateWindow: periodWindow,
        ledgerEntryTypes: null,
      };
  }
};

const appendDateWindowClause = (
  clauses: ReturnType<typeof Q.where>[],
  columnName: string,
  dateWindow: DateWindow,
): void => {
  if (dateWindow.startMs === null || dateWindow.endMs === null) {
    return;
  }

  clauses.push(Q.where(columnName, Q.between(dateWindow.startMs, dateWindow.endMs)));
};

export const createLocalReportsDatasource = (
  database: Database,
): ReportsDatasource => ({
  async getDataset(query: ReportQuery): Promise<Result<ReportsRawDataset>> {
    try {
      const requirements = resolveDatasetRequirements(query, Date.now());

      const [transactions, billingDocuments, ledgerEntries, emiPlans, inventoryMovements, products, moneyAccounts] =
        await Promise.all([
          requirements.loadTransactions
            ? loadTransactions(database, query, requirements.dateWindow)
            : Promise.resolve([]),
          requirements.loadBillingDocuments
            ? loadBillingDocuments(database, query, requirements.dateWindow)
            : Promise.resolve([]),
          requirements.loadLedgerEntries
            ? loadLedgerEntries(
                database,
                query,
                requirements.dateWindow,
                requirements.ledgerEntryTypes,
              )
            : Promise.resolve([]),
          requirements.loadEmiPlans
            ? loadEmiPlans(database, query)
            : Promise.resolve([]),
          requirements.loadInventoryMovements
            ? loadInventoryMovements(database, query)
            : Promise.resolve([]),
          requirements.loadProducts ? loadProducts(database, query) : Promise.resolve([]),
          requirements.loadMoneyAccounts
            ? loadMoneyAccounts(database, query)
            : Promise.resolve([]),
        ]);

      return {
        success: true,
        value: {
          transactions,
          billingDocuments,
          ledgerEntries,
          emiPlans,
          inventoryMovements,
          products,
          moneyAccounts,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});

const loadTransactions = async (
  database: Database,
  query: ReportQuery,
  dateWindow: DateWindow,
): Promise<TransactionModel[]> => {
  const collection = database.get<TransactionModel>(TRANSACTIONS_TABLE);
  const clauses: ReturnType<typeof Q.where>[] = [Q.where("deleted_at", Q.eq(null))];

  if (query.accountRemoteId) {
    clauses.push(Q.where("account_remote_id", query.accountRemoteId));
  } else if (query.ownerUserRemoteId) {
    clauses.push(Q.where("owner_user_remote_id", query.ownerUserRemoteId));
  }

  appendDateWindowClause(clauses, "happened_at", dateWindow);

  return collection.query(...clauses, Q.sortBy("happened_at", Q.desc)).fetch();
};

const loadBillingDocuments = async (
  database: Database,
  query: ReportQuery,
  dateWindow: DateWindow,
): Promise<BillingDocumentModel[]> => {
  if (!query.accountRemoteId) {
    return [];
  }

  const collection = database.get<BillingDocumentModel>(BILLING_DOCUMENTS_TABLE);
  const clauses: ReturnType<typeof Q.where>[] = [
    Q.where("account_remote_id", query.accountRemoteId),
    Q.where("deleted_at", Q.eq(null)),
  ];

  appendDateWindowClause(clauses, "issued_at", dateWindow);

  return collection.query(...clauses, Q.sortBy("issued_at", Q.desc)).fetch();
};

const loadLedgerEntries = async (
  database: Database,
  query: ReportQuery,
  dateWindow: DateWindow,
  ledgerEntryTypes: readonly string[] | null,
): Promise<LedgerEntryModel[]> => {
  if (!query.accountRemoteId) {
    return [];
  }

  const collection = database.get<LedgerEntryModel>(LEDGER_TABLE);
  const clauses: ReturnType<typeof Q.where>[] = [
    Q.where("business_account_remote_id", query.accountRemoteId),
    Q.where("deleted_at", Q.eq(null)),
  ];

  appendDateWindowClause(clauses, "happened_at", dateWindow);

  if (ledgerEntryTypes && ledgerEntryTypes.length === 1) {
    clauses.push(Q.where("entry_type", ledgerEntryTypes[0]));
  } else if (ledgerEntryTypes && ledgerEntryTypes.length > 1) {
    clauses.push(Q.where("entry_type", Q.oneOf([...ledgerEntryTypes])));
  }

  return collection.query(...clauses, Q.sortBy("happened_at", Q.desc)).fetch();
};

const loadEmiPlans = async (
  database: Database,
  query: ReportQuery,
): Promise<EmiPlanModel[]> => {
  const collection = database.get<EmiPlanModel>(EMI_TABLE);

  if (query.scope === ReportScope.Business) {
    if (!query.accountRemoteId) {
      return [];
    }

    return collection
      .query(
        Q.where("business_account_remote_id", query.accountRemoteId),
        Q.where("deleted_at", Q.eq(null)),
        Q.sortBy("next_due_at", Q.asc),
      )
      .fetch();
  }

  if (!query.ownerUserRemoteId) {
    return [];
  }

  return collection
    .query(
      Q.where("owner_user_remote_id", query.ownerUserRemoteId),
      Q.where("plan_mode", EmiPlanMode.Personal),
      Q.where("deleted_at", Q.eq(null)),
      Q.sortBy("next_due_at", Q.asc),
    )
    .fetch();
};

const loadInventoryMovements = async (
  database: Database,
  query: ReportQuery,
): Promise<InventoryMovementModel[]> => {
  if (!query.accountRemoteId) {
    return [];
  }

  const collection = database.get<InventoryMovementModel>(INVENTORY_TABLE);
  return collection
    .query(
      Q.where("account_remote_id", query.accountRemoteId),
      Q.where("deleted_at", Q.eq(null)),
      Q.sortBy("movement_at", Q.desc),
    )
    .fetch();
};

const loadProducts = async (
  database: Database,
  query: ReportQuery,
): Promise<ProductModel[]> => {
  if (!query.accountRemoteId) {
    return [];
  }

  const collection = database.get<ProductModel>(PRODUCTS_TABLE);
  return collection
    .query(
      Q.where("account_remote_id", query.accountRemoteId),
      Q.where("deleted_at", Q.eq(null)),
      Q.sortBy("updated_at", Q.desc),
    )
    .fetch();
};

const loadMoneyAccounts = async (
  database: Database,
  query: ReportQuery,
): Promise<MoneyAccountModel[]> => {
  if (!query.accountRemoteId) {
    return [];
  }

  const collection = database.get<MoneyAccountModel>(MONEY_ACCOUNTS_TABLE);
  return collection
    .query(
      Q.where("scope_account_remote_id", query.accountRemoteId),
      Q.where("deleted_at", Q.eq(null)),
      Q.sortBy("updated_at", Q.desc),
    )
    .fetch();
};
