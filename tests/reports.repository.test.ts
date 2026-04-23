import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { ReportsDatasource } from "@/feature/reports/data/dataSource/reports.datasource";
import { createReportsRepository } from "@/feature/reports/data/repository/reports.repository.impl";
import {
  ReportMenuItem,
  ReportPeriod,
  ReportQuery,
  ReportScope,
} from "@/feature/reports/types/report.entity.types";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import { describe, expect, it, vi } from "vitest";

const CURRENCY_CODE = "NPR";
const COUNTRY_CODE = "NP";

const createBaseQuery = (reportId: ReportQuery["reportId"]): ReportQuery => ({
  accountType: AccountType.Business,
  scope: ReportScope.Business,
  ownerUserRemoteId: "owner-1",
  accountRemoteId: "account-1",
  period: ReportPeriod.ThisMonth,
  reportId,
});

const createDataset = (overrides: Partial<{
  transactions: unknown[];
  billingDocuments: unknown[];
  ledgerEntries: unknown[];
  emiPlans: unknown[];
  inventoryMovements: unknown[];
  products: unknown[];
  moneyAccounts: unknown[];
}> = {}) => ({
  transactions: [],
  billingDocuments: [],
  ledgerEntries: [],
  emiPlans: [],
  inventoryMovements: [],
  products: [],
  moneyAccounts: [],
  ...overrides,
});

const createDatasource = (dataset: ReturnType<typeof createDataset>): ReportsDatasource => ({
  getDataset: vi.fn(async () => ({
    success: true as const,
    value: dataset as never,
  })),
});

describe("reports.repository", () => {
  it("sorts party balances using numeric outstanding amounts", async () => {
    const dataset = createDataset({
      ledgerEntries: [
        {
          partyName: "Party A",
          entryType: "collection",
          balanceDirection: "receive",
          amount: 100000,
          currencyCode: CURRENCY_CODE,
          happenedAt: Date.now(),
          dueAt: null,
        },
        {
          partyName: "Party B",
          entryType: "payment_out",
          balanceDirection: "pay",
          amount: 800,
          currencyCode: CURRENCY_CODE,
          happenedAt: Date.now(),
          dueAt: null,
        },
        {
          partyName: "Party B",
          entryType: "collection",
          balanceDirection: "receive",
          amount: 300,
          currencyCode: CURRENCY_CODE,
          happenedAt: Date.now(),
          dueAt: null,
        },
        {
          partyName: "Party C",
          entryType: "collection",
          balanceDirection: "receive",
          amount: 5000,
          currencyCode: CURRENCY_CODE,
          happenedAt: Date.now(),
          dueAt: null,
        },
      ],
    });

    const repository = createReportsRepository(createDatasource(dataset), {
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
    });

    const result = await repository.getReportDetail(
      createBaseQuery(ReportMenuItem.PartyBalances),
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.listItems?.map((item) => item.title)).toEqual([
      "Party A",
      "Party C",
      "Party B",
    ]);
    expect(result.value.segments?.map((segment) => segment.value)).toEqual([
      100000,
      5000,
      500,
    ]);
  });

  it("computes stock value from numeric valuations without parsing formatted strings", async () => {
    const dataset = createDataset({
      products: [
        {
          remoteId: "product-rice",
          name: "Rice",
          categoryName: "Groceries",
          salePrice: 12,
          costPrice: 10,
          stockQuantity: 3,
          unitLabel: "kg",
          status: "active",
        },
        {
          remoteId: "product-soap",
          name: "Soap",
          categoryName: "Household",
          salePrice: 5,
          costPrice: null,
          stockQuantity: null,
          unitLabel: "pcs",
          status: "active",
        },
      ],
      inventoryMovements: [
        {
          productRemoteId: "product-soap",
          productNameSnapshot: "Soap",
          productUnitLabelSnapshot: "pcs",
          movementType: "purchase_in",
          deltaQuantity: 4,
          unitRate: 5,
          movementAt: Date.now(),
        },
      ],
    });

    const repository = createReportsRepository(createDatasource(dataset), {
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
    });

    const result = await repository.getReportDetail(
      createBaseQuery(ReportMenuItem.Stock),
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const expectedStockValue = formatCurrencyAmount({
      amount: 20,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      maximumFractionDigits: 0,
    });
    const stockValueCard = result.value.summaryCards.find(
      (item) => item.id === "stock-value",
    );

    expect(stockValueCard?.value).toBe(expectedStockValue);
    expect(result.value.listItems?.[0]?.subtitle).toContain("4 pcs");
  });

  it("uses the selected period for the sales detail trend instead of a fixed six-month window", async () => {
    const currentIssuedAt = Date.now();
    const olderIssuedAt = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 2,
      1,
    ).getTime();

    const dataset = createDataset({
      billingDocuments: [
        {
          remoteId: "doc-current",
          documentType: "invoice",
          customerName: "Walk-in",
          status: "paid",
          totalAmount: 120,
          issuedAt: currentIssuedAt,
        },
        {
          remoteId: "doc-older",
          documentType: "invoice",
          customerName: "Archived",
          status: "paid",
          totalAmount: 900,
          issuedAt: olderIssuedAt,
        },
      ],
    });

    const repository = createReportsRepository(createDatasource(dataset), {
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
    });

    const result = await repository.getReportDetail({
      ...createBaseQuery(ReportMenuItem.Sales),
      period: ReportPeriod.ThisWeek,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.lineSeries).toHaveLength(7);
    expect(
      result.value.lineSeries?.reduce((sum, item) => sum + item.value, 0),
    ).toBe(120);

    const salesTotalCard = result.value.summaryCards.find(
      (item) => item.id === "sales-total",
    );

    expect(salesTotalCard?.value).toBe(
      formatCurrencyAmount({
        amount: 120,
        currencyCode: CURRENCY_CODE,
        countryCode: COUNTRY_CODE,
        maximumFractionDigits: 0,
      }),
    );
  });

  it("uses the selected period for all dashboard analytics instead of mixed fixed windows", async () => {
    const now = Date.now();
    const olderAt = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 2,
      1,
    ).getTime();

    const dataset = createDataset({
      transactions: [
        {
          title: "Fuel",
          amount: 15,
          categoryLabel: "Transport",
          happenedAt: now,
          direction: "out",
          transactionType: "expense",
          accountDisplayNameSnapshot: "Cash",
        },
        {
          title: "Old expense",
          amount: 200,
          categoryLabel: "Old",
          happenedAt: olderAt,
          direction: "out",
          transactionType: "expense",
          accountDisplayNameSnapshot: "Cash",
        },
      ],
      billingDocuments: [
        {
          remoteId: "doc-now",
          documentType: "invoice",
          customerName: "Walk-in",
          status: "paid",
          totalAmount: 100,
          issuedAt: now,
        },
        {
          remoteId: "doc-old",
          documentType: "invoice",
          customerName: "Archived",
          status: "paid",
          totalAmount: 900,
          issuedAt: olderAt,
        },
      ],
      ledgerEntries: [
        {
          partyName: "Customer A",
          entryType: "collection",
          balanceDirection: "receive",
          amount: 20,
          currencyCode: CURRENCY_CODE,
          happenedAt: now,
          dueAt: null,
        },
        {
          partyName: "Supplier A",
          entryType: "payment_out",
          balanceDirection: "pay",
          amount: 40,
          currencyCode: CURRENCY_CODE,
          happenedAt: now,
          dueAt: null,
        },
        {
          partyName: "Old Customer",
          entryType: "collection",
          balanceDirection: "receive",
          amount: 50,
          currencyCode: CURRENCY_CODE,
          happenedAt: olderAt,
          dueAt: null,
        },
      ],
    });

    const repository = createReportsRepository(createDatasource(dataset), {
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
    });

    const result = await repository.getReportsDashboard({
      ...createBaseQuery(null),
      period: ReportPeriod.ThisWeek,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.periodLabel).toBe("This Week");
    expect(result.value.overviewTrend).toHaveLength(7);
    expect(result.value.incomeExpenseComparison).toHaveLength(7);
    expect(result.value.cashFlowSeries).toHaveLength(7);
    expect(
      result.value.categoryBreakdown.reduce((sum, item) => sum + item.value, 0),
    ).toBe(15);
  });

  it("uses transaction money truth for business dashboard totals instead of combining billing and ledger values", async () => {
    const now = Date.now();

    const dataset = createDataset({
      transactions: [
        {
          title: "Cash sale",
          amount: 100,
          categoryLabel: "Sales",
          happenedAt: now,
          direction: "in",
          transactionType: "sale",
          accountDisplayNameSnapshot: "Cash",
        },
        {
          title: "Expense",
          amount: 30,
          categoryLabel: "Utilities",
          happenedAt: now,
          direction: "out",
          transactionType: "expense",
          accountDisplayNameSnapshot: "Cash",
        },
      ],
      billingDocuments: [
        {
          remoteId: "doc-1",
          documentType: "invoice",
          customerName: "Customer",
          status: "paid",
          totalAmount: 900,
          issuedAt: now,
        },
      ],
      ledgerEntries: [
        {
          partyName: "Customer A",
          entryType: "collection",
          balanceDirection: "receive",
          amount: 50,
          currencyCode: CURRENCY_CODE,
          happenedAt: now,
          dueAt: null,
        },
        {
          partyName: "Supplier A",
          entryType: "payment_out",
          balanceDirection: "pay",
          amount: 40,
          currencyCode: CURRENCY_CODE,
          happenedAt: now,
          dueAt: null,
        },
      ],
    });

    const repository = createReportsRepository(createDatasource(dataset), {
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
    });

    const result = await repository.getReportsDashboard(createBaseQuery(null));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.topSummary.totalIncome).toBe(100);
    expect(result.value.topSummary.totalExpense).toBe(30);
    expect(result.value.topSummary.netProfit).toBe(70);
  });

  it("uses inventory movement remote-id truth for stock quantity instead of product snapshot stock", async () => {
    const dataset = createDataset({
      products: [
        {
          remoteId: "product-soap",
          name: "Soap",
          categoryName: "Household",
          salePrice: 5,
          costPrice: 10,
          stockQuantity: 99,
          unitLabel: "pcs",
          status: "active",
        },
      ],
      inventoryMovements: [
        {
          productRemoteId: "product-soap",
          productNameSnapshot: "Soap",
          productUnitLabelSnapshot: "pcs",
          movementType: "purchase_in",
          deltaQuantity: 4,
          unitRate: 10,
          movementAt: Date.now(),
        },
      ],
    });

    const repository = createReportsRepository(createDatasource(dataset), {
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
    });

    const result = await repository.getReportDetail(
      createBaseQuery(ReportMenuItem.Stock),
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const stockValueCard = result.value.summaryCards.find(
      (item) => item.id === "stock-value",
    );

    expect(stockValueCard?.value).toBe(
      formatCurrencyAmount({
        amount: 40,
        currencyCode: CURRENCY_CODE,
        countryCode: COUNTRY_CODE,
        maximumFractionDigits: 0,
      }),
    );

    expect(result.value.listItems?.[0]?.subtitle).toContain("4 pcs");
  });
});
