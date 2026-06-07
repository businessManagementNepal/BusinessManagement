import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { buildReportDetailSnapshot } from "@/feature/reports/readModel/buildReportDetailSnapshot.readModel";
import { buildReportsDashboardSnapshot } from "@/feature/reports/readModel/buildReportsDashboardSnapshot.readModel";
import {
  ReportMenuItem,
  ReportPeriod,
  ReportScope,
  type ReportQuery,
  type ReportsDatasetSnapshot,
} from "@/feature/reports/types/report.entity.types";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import { describe, expect, it } from "vitest";

const NOW_MS = new Date("2026-04-15T10:00:00.000Z").getTime();
const CURRENCY_CODE = "NPR";
const COUNTRY_CODE = "NP";

const createQuery = (reportId: ReportQuery["reportId"] = null): ReportQuery => ({
  accountType: AccountType.Business,
  scope: ReportScope.Business,
  ownerUserRemoteId: "owner-1",
  accountRemoteId: "account-1",
  period: ReportPeriod.ThisMonth,
  reportId,
});

const createDataset = (
  overrides: Partial<ReportsDatasetSnapshot> = {},
): ReportsDatasetSnapshot => ({
  transactions: [],
  billingDocuments: [],
  ledgerEntries: [],
  emiPlans: [],
  inventoryMovements: [],
  products: [],
  moneyAccounts: [],
  ...overrides,
});

const formatCurrency = (amount: number) =>
  formatCurrencyAmount({
    amount,
    currencyCode: CURRENCY_CODE,
    countryCode: COUNTRY_CODE,
    maximumFractionDigits: 0,
  });

describe("reportsBusinessTruth.integration", () => {
  it("shows paid POS sales as both sales and cash income without outstanding ledger balance", () => {
    const dataset = createDataset({
      transactions: [
        {
          remoteId: "txn-1",
          title: "POS paid sale",
          amount: 1000,
          categoryLabel: "POS",
          happenedAt: NOW_MS,
          direction: "in",
          transactionType: "income",
          accountDisplayNameSnapshot: "Business Account",
          settlementMoneyAccountRemoteId: "cash-1",
          settlementMoneyAccountDisplayNameSnapshot: "Cash",
        },
      ],
      billingDocuments: [
        {
          remoteId: "doc-1",
          documentType: "receipt",
          customerName: "Walk-in",
          status: "paid",
          totalAmount: 1000,
          issuedAt: NOW_MS,
        },
      ],
    });

    const dashboard = buildReportsDashboardSnapshot({
      query: createQuery(),
      dataset,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      nowMs: NOW_MS,
    });
    const salesDetail = buildReportDetailSnapshot({
      query: createQuery(ReportMenuItem.Sales),
      dataset,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      nowMs: NOW_MS,
    });
    const partyBalances = buildReportDetailSnapshot({
      query: createQuery(ReportMenuItem.PartyBalances),
      dataset,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      nowMs: NOW_MS,
    });

    expect(dashboard.topSummary.totalIncome).toBe(1000);
    expect(
      salesDetail?.summaryCards.find((card) => card.id === "sales-total")?.value,
    ).toBe(formatCurrency(1000));
    expect(
      partyBalances?.summaryCards.find((card) => card.id === "total-outstanding")
        ?.value,
    ).toBe(formatCurrency(0));
  });

  it("does not turn unpaid POS sales into fake cash income while still showing sales and outstanding due", () => {
    const dataset = createDataset({
      billingDocuments: [
        {
          remoteId: "doc-1",
          documentType: "receipt",
          customerName: "Kapil Customer",
          status: "pending",
          totalAmount: 1000,
          issuedAt: NOW_MS,
        },
      ],
      ledgerEntries: [
        {
          remoteId: "due-1",
          partyName: "Kapil Customer",
          partyPhone: "9800000000",
          contactRemoteId: "contact-1",
          entryType: "sale",
          balanceDirection: "receive",
          amount: 1000,
          currencyCode: CURRENCY_CODE,
          happenedAt: NOW_MS,
          dueAt: null,
        },
      ],
    });

    const dashboard = buildReportsDashboardSnapshot({
      query: createQuery(),
      dataset,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      nowMs: NOW_MS,
    });
    const salesDetail = buildReportDetailSnapshot({
      query: createQuery(ReportMenuItem.Sales),
      dataset,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      nowMs: NOW_MS,
    });
    const partyBalances = buildReportDetailSnapshot({
      query: createQuery(ReportMenuItem.PartyBalances),
      dataset,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      nowMs: NOW_MS,
    });

    expect(dashboard.topSummary.totalIncome).toBe(0);
    expect(
      salesDetail?.summaryCards.find((card) => card.id === "sales-total")?.value,
    ).toBe(formatCurrency(1000));
    expect(
      partyBalances?.summaryCards.find((card) => card.id === "total-outstanding")
        ?.value,
    ).toBe(formatCurrency(1000));
  });

  it("separates cash collected from remaining due for partial POS sales", () => {
    const dataset = createDataset({
      transactions: [
        {
          remoteId: "txn-1",
          title: "POS partial payment",
          amount: 400,
          categoryLabel: "POS",
          happenedAt: NOW_MS,
          direction: "in",
          transactionType: "income",
          accountDisplayNameSnapshot: "Business Account",
          settlementMoneyAccountRemoteId: "cash-1",
          settlementMoneyAccountDisplayNameSnapshot: "Cash",
        },
      ],
      billingDocuments: [
        {
          remoteId: "doc-1",
          documentType: "receipt",
          customerName: "Kapil Customer",
          status: "pending",
          totalAmount: 1000,
          issuedAt: NOW_MS,
        },
      ],
      ledgerEntries: [
        {
          remoteId: "due-1",
          partyName: "Kapil Customer",
          partyPhone: "9800000000",
          contactRemoteId: "contact-1",
          entryType: "sale",
          balanceDirection: "receive",
          amount: 600,
          currencyCode: CURRENCY_CODE,
          happenedAt: NOW_MS,
          dueAt: null,
        },
      ],
    });

    const dashboard = buildReportsDashboardSnapshot({
      query: createQuery(),
      dataset,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      nowMs: NOW_MS,
    });
    const salesDetail = buildReportDetailSnapshot({
      query: createQuery(ReportMenuItem.Sales),
      dataset,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      nowMs: NOW_MS,
    });
    const partyBalances = buildReportDetailSnapshot({
      query: createQuery(ReportMenuItem.PartyBalances),
      dataset,
      currencyCode: CURRENCY_CODE,
      countryCode: COUNTRY_CODE,
      nowMs: NOW_MS,
    });

    expect(dashboard.topSummary.totalIncome).toBe(400);
    expect(
      salesDetail?.summaryCards.find((card) => card.id === "sales-total")?.value,
    ).toBe(formatCurrency(1000));
    expect(
      partyBalances?.summaryCards.find((card) => card.id === "total-outstanding")
        ?.value,
    ).toBe(formatCurrency(600));
  });
});
