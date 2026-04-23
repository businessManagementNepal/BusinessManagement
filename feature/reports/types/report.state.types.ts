import {
  ReportDetailSnapshot,
  ReportHomeTabValue,
  ReportMenuItemValue,
  ReportPeriodValue,
  ReportsDashboardSnapshot,
} from "./report.entity.types";

export const REPORT_PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "last_6_months", label: "6 Months" },
] as const;

export type ReportsViewState = {
  isLoading: boolean;
  isExporting: boolean;
  errorMessage: string | null;
  activeHomeTab: ReportHomeTabValue;
  activePeriod: ReportPeriodValue;
  dashboard: ReportsDashboardSnapshot | null;
  selectedReportId: ReportMenuItemValue | null;
  detail: ReportDetailSnapshot | null;
};
