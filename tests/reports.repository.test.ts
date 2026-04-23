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
          name: "Rice",
          categoryName: "Groceries",
          salePrice: 12,
          costPrice: 10,
          stockQuantity: 3,
          status: "active",
        },
        {
          name: "Soap",
          categoryName: "Household",
          salePrice: 5,
          costPrice: null,
          stockQuantity: null,
          status: "active",
        },
      ],
      inventoryMovements: [
        {
          productNameSnapshot: "Soap",
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
      amount: 50,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      maximumFractionDigits: 0,
    });
    const stockValueCard = result.value.summaryCards.find(
      (item) => item.id === "stock-value",
    );

    expect(stockValueCard?.value).toBe(expectedStockValue);
    expect(result.value.listItems?.[0]?.subtitle.includes("|")).toBe(true);
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
          customerName: "Walk-in",
          status: "paid",
          totalAmount: 120,
          issuedAt: currentIssuedAt,
        },
        {
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
          customerName: "Walk-in",
          status: "paid",
          totalAmount: 100,
          issuedAt: now,
        },
        {
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
        {
          partyName: "Old Supplier",
          entryType: "payment_out",
          balanceDirection: "pay",
          amount: 300,
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
      result.value.overviewTrend.reduce((sum, item) => sum + item.value, 0),
    ).toBe(80);

    expect(
      result.value.incomeExpenseComparison.reduce(
        (sum, item) => sum + item.primaryValue,
        0,
      ),
    ).toBe(120);

    expect(
      result.value.incomeExpenseComparison.reduce(
        (sum, item) => sum + item.secondaryValue,
        0,
      ),
    ).toBe(40);

    expect(
      result.value.cashFlowSeries.reduce(
        (sum, item) => sum + item.primaryValue,
        0,
      ),
    ).toBe(120);

    expect(
      result.value.cashFlowSeries.reduce(
        (sum, item) => sum + item.secondaryValue,
        0,
      ),
    ).toBe(40);

    expect(
      result.value.categoryBreakdown.reduce((sum, item) => sum + item.value, 0),
    ).toBe(15);
  });
});

