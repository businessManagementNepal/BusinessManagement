import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { ReportHomeTab } from "@/feature/reports/types/report.entity.types";
import { REPORT_PERIOD_OPTIONS } from "@/feature/reports/types/report.state.types";
import { ReportsViewModel } from "@/feature/reports/viewModel/reports.viewModel";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import { ArrowLeft, Download, Printer, Share2 } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { isReportPeriodFilterable } from "../utils/reportPeriod.shared";
import { ExportPreviewCard, ReportListItems, ReportMenuSections, ReportsSummaryRow } from "./components/ReportCards";
import { DualLineChart, GroupedBarChart, LineAreaChart, SemiDonutChart, SingleBarChart } from "./components/ReportCharts";

const HOME_TAB_OPTIONS = [
  { value: ReportHomeTab.Overview, label: "Overview" },
  { value: ReportHomeTab.IncomeExpense, label: "Income vs Expense" },
  { value: ReportHomeTab.Categories, label: "Categories" },
  { value: ReportHomeTab.CashFlow, label: "Cash Flow" },
] as const;

type Props = {
  viewModel: ReportsViewModel;
};

export function ReportsScreen({ viewModel }: Props) {
  return (
    <DashboardTabScaffold
      footer={null}
      baseBottomPadding={118}
      contentContainerStyle={styles.contentContainer}
      showDivider={false}
    >
      {viewModel.selectedReportId && viewModel.detail ? (
        <ReportDetailView viewModel={viewModel} />
      ) : (
        <ReportsHomeView viewModel={viewModel} />
      )}
    </DashboardTabScaffold>
  );
}

function ReportsHomeView({ viewModel }: Props) {
  const topSummary = viewModel.dashboard?.topSummary ?? {
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
  };

  const formattedTotalIncome = formatCurrencyAmount({
    amount: topSummary.totalIncome,
    currencyCode: viewModel.dashboard?.currencyCode,
    countryCode: viewModel.dashboard?.countryCode ?? null,
    maximumFractionDigits: 0,
  });
  const formattedTotalExpense = formatCurrencyAmount({
    amount: topSummary.totalExpense,
    currencyCode: viewModel.dashboard?.currencyCode,
    countryCode: viewModel.dashboard?.countryCode ?? null,
    maximumFractionDigits: 0,
  });
  const formattedNetProfit = formatCurrencyAmount({
    amount: topSummary.netProfit,
    currencyCode: viewModel.dashboard?.currencyCode,
    countryCode: viewModel.dashboard?.countryCode ?? null,
    maximumFractionDigits: 0,
  });

  const dashboardPeriodLabel = viewModel.dashboard?.periodLabel ?? "selected period";

  return (
    <View style={styles.screenGap}>
      {viewModel.errorMessage ? <ErrorCard message={viewModel.errorMessage} /> : null}

      <Card style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          <Text style={styles.heroTitle}>This Period</Text>
          <Text style={styles.heroDate}>{viewModel.dashboard?.periodLabel ?? "This Month"}</Text>
        </View>
        <View style={styles.heroMetricsRow}>
          <View style={styles.heroMetricBlock}>
            <Text style={styles.heroMetricLabel}>Total Income</Text>
            <Text style={[styles.heroMetricValue, { color: colors.success }]}>{formattedTotalIncome}</Text>
          </View>
          <View style={styles.heroMetricBlock}>
            <Text style={styles.heroMetricLabel}>Total Expense</Text>
            <Text style={[styles.heroMetricValue, { color: colors.destructive }]}>{formattedTotalExpense}</Text>
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.netRow}>
          <Text style={styles.netLabel}>Net Profit</Text>
          <Text style={[styles.netValue, { color: topSummary.netProfit >= 0 ? colors.success : colors.destructive }]}>{formattedNetProfit}</Text>
        </View>
      </Card>

      <FilterChipGroup
        options={REPORT_PERIOD_OPTIONS}
        selectedValue={viewModel.activePeriod}
        onSelect={(value) => {
          void viewModel.onSelectPeriod(value);
        }}
      />

      <FilterChipGroup
        options={HOME_TAB_OPTIONS}
        selectedValue={viewModel.activeHomeTab}
        onSelect={viewModel.onSelectHomeTab}
      />

      <Card style={styles.chartCard}>
        {viewModel.activeHomeTab === ReportHomeTab.Overview ? (
          <>
            <Text style={styles.chartTitle}>Profit Trend</Text>
            <Text style={styles.chartSubtitle}>
              {`Net profit trend for ${dashboardPeriodLabel}`}
            </Text>
            <LineAreaChart data={viewModel.dashboard?.overviewTrend ?? []} />
          </>
        ) : null}

        {viewModel.activeHomeTab === ReportHomeTab.IncomeExpense ? (
          <>
            <Text style={styles.chartTitle}>Income vs Expense</Text>
            <Text style={styles.chartSubtitle}>
              {`Income vs expense for ${dashboardPeriodLabel}`}
            </Text>
            <GroupedBarChart data={viewModel.dashboard?.incomeExpenseComparison ?? []} />
          </>
        ) : null}

        {viewModel.activeHomeTab === ReportHomeTab.Categories ? (
          <>
            <Text style={styles.chartTitle}>Expense Breakdown</Text>
            <Text style={styles.chartSubtitle}>
              {`Category breakdown for ${dashboardPeriodLabel}`}
            </Text>
            <SemiDonutChart segments={viewModel.dashboard?.categoryBreakdown ?? []} />
          </>
        ) : null}

        {viewModel.activeHomeTab === ReportHomeTab.CashFlow ? (
          <>
            <Text style={styles.chartTitle}>Daily Cash Flow</Text>
            <Text style={styles.chartSubtitle}>
              {`Inflow vs outflow for ${dashboardPeriodLabel}`}
            </Text>
            <DualLineChart data={viewModel.dashboard?.cashFlowSeries ?? []} />
          </>
        ) : null}
      </Card>

      <ReportMenuSections
        sections={viewModel.dashboard?.sections ?? []}
        onOpen={viewModel.onOpenReport}
      />
    </View>
  );
}

function ReportDetailView({ viewModel }: Props) {
  const detail = viewModel.detail;
  if (!detail) {
    return null;
  }

  const supportsPeriodFilter = isReportPeriodFilterable(detail.reportId);

  return (
    <View style={styles.screenGap}>
      <Pressable style={styles.backRow} onPress={viewModel.onBackToReports}>
        <ArrowLeft size={18} color={colors.primary} />
        <Text style={styles.backText}>Back to Reports</Text>
      </Pressable>

      {supportsPeriodFilter ? (
        <FilterChipGroup
          options={REPORT_PERIOD_OPTIONS}
          selectedValue={viewModel.activePeriod}
          onSelect={(value) => {
            void viewModel.onSelectPeriod(value);
          }}
        />
      ) : null}

      {viewModel.canExportReports ? (
        <View style={styles.exportActionsRow}>
          <Pressable
            style={[
              styles.exportActionButton,
              viewModel.isExporting ? styles.exportActionButtonDisabled : null,
            ]}
            disabled={viewModel.isExporting}
            onPress={() => {
              void viewModel.onExportDetail("share");
            }}
          >
            <Share2 size={16} color={colors.primary} />
            <Text style={styles.exportActionText}>
              {viewModel.isExporting ? "Exporting..." : "Share PDF"}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.exportActionButton,
              viewModel.isExporting ? styles.exportActionButtonDisabled : null,
            ]}
            disabled={viewModel.isExporting}
            onPress={() => {
              void viewModel.onExportDetail("save");
            }}
          >
            <Download size={16} color={colors.primary} />
            <Text style={styles.exportActionText}>
              {viewModel.isExporting ? "Exporting..." : "Save PDF"}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.exportActionButton,
              viewModel.isExporting ? styles.exportActionButtonDisabled : null,
            ]}
            disabled={viewModel.isExporting}
            onPress={() => {
              void viewModel.onExportDetail("print");
            }}
          >
            <Printer size={16} color={colors.primary} />
            <Text style={styles.exportActionText}>
              {viewModel.isExporting ? "Exporting..." : "Print"}
            </Text>
          </Pressable>
        </View>
      ) : viewModel.isBusinessMode ? (
        <Text style={styles.permissionHint}>
          You have view access only. Ask admin for export permission.
        </Text>
      ) : null}

      {viewModel.errorMessage ? <ErrorCard message={viewModel.errorMessage} /> : null}

      <ReportsSummaryRow cards={detail.summaryCards} />

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{detail.chartTitle}</Text>
        <Text style={styles.chartSubtitle}>{detail.chartSubtitle}</Text>

        {detail.chartKind === "line" && detail.lineSeries ? <LineAreaChart data={detail.lineSeries} /> : null}
        {detail.chartKind === "bars" && detail.barSeries ? (
          <SingleBarChart
            data={detail.barSeries}
            color={detail.reportId === "payment_report" ? colors.destructive : colors.success}
          />
        ) : null}
        {detail.chartKind === "dual-line" && detail.dualSeries ? <DualLineChart data={detail.dualSeries} /> : null}
        {detail.chartKind === "semi-donut" && detail.segments ? <SemiDonutChart segments={detail.segments} /> : null}
        {detail.chartKind === "semi-donut" && detail.listItems ? <ReportListItems items={detail.listItems} /> : null}
        {detail.chartKind === "export-preview" && detail.csvPreview ? <ExportPreviewCard csvPreview={detail.csvPreview} /> : null}
        {(detail.chartKind === "list" || detail.chartKind === "progress-list") && detail.listItems ? (
          <ReportListItems items={detail.listItems} />
        ) : null}
      </Card>
    </View>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card style={styles.errorCard}>
      <Text style={styles.errorTitle}>Unable to load report</Text>
      <Text style={styles.errorMessage}>{message}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: spacing.md,
  },
  screenGap: {
    gap: spacing.md,
  },
  heroCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTitle: {
    color: colors.cardForeground,
    fontSize: 17,
    fontFamily: "InterBold",
  },
  heroDate: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  heroMetricsRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroMetricBlock: {
    flex: 1,
  },
  heroMetricLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  heroMetricValue: {
    marginTop: 8,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  heroDivider: {
    marginTop: spacing.md,
    height: 1,
    backgroundColor: colors.border,
  },
  netRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netLabel: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  netValue: {
    fontSize: 18,
    fontFamily: "InterBold",
  },
  chartCard: {
    paddingVertical: spacing.md,
  },
  chartTitle: {
    color: colors.cardForeground,
    fontSize: 17,
    fontFamily: "InterBold",
    marginBottom: 4,
  },
  chartSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  backText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  exportActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  exportActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  exportActionButtonDisabled: {
    opacity: 0.6,
  },
  exportActionText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  permissionHint: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  errorCard: {
    backgroundColor: "#FFF6F6",
    borderColor: "#F4D0D0",
  },
  errorTitle: {
    color: colors.destructive,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  errorMessage: {
    marginTop: 6,
    color: colors.mutedForeground,
    fontSize: 12,
  },
});
