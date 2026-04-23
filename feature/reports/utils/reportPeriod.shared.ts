import {
    ReportMenuItem,
    ReportMenuItemValue,
    ReportPeriod,
    ReportPeriodValue,
} from "../types/report.entity.types";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type ReportDateRange = {
  startMs: number;
  endMs: number;
  label: string;
};

export type ReportSeriesBucket = {
  label: string;
  startMs: number;
  endMs: number;
};

export const REPORT_PERIOD_FILTERABLE_REPORT_IDS = [
  ReportMenuItem.Sales,
  ReportMenuItem.Collection,
  ReportMenuItem.Payment,
  ReportMenuItem.CategorySummary,
  ReportMenuItem.AccountStatement,
  ReportMenuItem.ExportData,
] as const satisfies readonly ReportMenuItemValue[];

const REPORT_PERIOD_FILTERABLE_REPORT_ID_SET = new Set<ReportMenuItemValue>(
  REPORT_PERIOD_FILTERABLE_REPORT_IDS,
);

const startOfDay = (value: number): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: number): Date => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const createMonthBucket = (year: number, monthIndex: number): ReportSeriesBucket => {
  const bucketDate = new Date(year, monthIndex, 1);

  return {
    label: MONTH_LABELS[bucketDate.getMonth()],
    startMs: new Date(bucketDate.getFullYear(), bucketDate.getMonth(), 1).getTime(),
    endMs: new Date(
      bucketDate.getFullYear(),
      bucketDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ).getTime(),
  };
};

const formatCompactHourLabel = (hour: number): string => {
  const normalizedHour = hour % 12 || 12;
  const suffix = hour >= 12 ? "p" : "a";
  return `${normalizedHour}${suffix}`;
};

export const isReportPeriodFilterable = (
  reportId: ReportMenuItemValue | null | undefined,
): reportId is (typeof REPORT_PERIOD_FILTERABLE_REPORT_IDS)[number] => {
  return reportId != null && REPORT_PERIOD_FILTERABLE_REPORT_ID_SET.has(reportId);
};

export const getReportDateRangeForPeriod = (
  period: ReportPeriodValue,
  nowMs: number,
): ReportDateRange => {
  const now = new Date(nowMs);
  const start = startOfDay(nowMs);
  const end = endOfDay(nowMs);

  switch (period) {
    case ReportPeriod.Today:
      return {
        startMs: start.getTime(),
        endMs: end.getTime(),
        label: "Today",
      };

    case ReportPeriod.ThisWeek: {
      const weekStart = startOfDay(nowMs);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const weekEnd = endOfDay(weekStart.getTime());
      weekEnd.setDate(weekStart.getDate() + 6);

      return {
        startMs: weekStart.getTime(),
        endMs: weekEnd.getTime(),
        label: "This Week",
      };
    }

    case ReportPeriod.ThisMonth:
      return {
        startMs: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
        endMs: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ).getTime(),
        label: `${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`,
      };

    case ReportPeriod.ThisQuarter: {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        startMs: new Date(now.getFullYear(), quarterStartMonth, 1).getTime(),
        endMs: new Date(
          now.getFullYear(),
          quarterStartMonth + 3,
          0,
          23,
          59,
          59,
          999,
        ).getTime(),
        label: "This Quarter",
      };
    }

    case ReportPeriod.ThisYear:
      return {
        startMs: new Date(now.getFullYear(), 0, 1).getTime(),
        endMs: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime(),
        label: `${now.getFullYear()}`,
      };

    case ReportPeriod.LastSixMonths:
    default:
      return {
        startMs: new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime(),
        endMs: end.getTime(),
        label: "Last 6 Months",
      };
  }
};

export const buildReportSeriesBucketsForPeriod = (
  period: ReportPeriodValue,
  nowMs: number,
): readonly ReportSeriesBucket[] => {
  const now = new Date(nowMs);

  switch (period) {
    case ReportPeriod.Today: {
      const dayStart = startOfDay(nowMs);
      return Array.from({ length: 6 }).map((_, index) => {
        const bucketStart = new Date(dayStart);
        bucketStart.setHours(index * 4, 0, 0, 0);

        const bucketEnd = new Date(bucketStart);
        bucketEnd.setHours(bucketStart.getHours() + 3, 59, 59, 999);

        return {
          label: formatCompactHourLabel(bucketStart.getHours()),
          startMs: bucketStart.getTime(),
          endMs: bucketEnd.getTime(),
        };
      });
    }

    case ReportPeriod.ThisWeek: {
      const weekStart = startOfDay(nowMs);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      return Array.from({ length: 7 }).map((_, index) => {
        const bucketStart = new Date(weekStart);
        bucketStart.setDate(weekStart.getDate() + index);

        const bucketEnd = endOfDay(bucketStart.getTime());

        return {
          label: WEEKDAY_LABELS[bucketStart.getDay()],
          startMs: bucketStart.getTime(),
          endMs: bucketEnd.getTime(),
        };
      });
    }

    case ReportPeriod.ThisMonth: {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEndMs = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ).getTime();

      const buckets: ReportSeriesBucket[] = [];
      let bucketStart = new Date(monthStart);
      let weekIndex = 1;

      while (bucketStart.getTime() <= monthEndMs) {
        const bucketEnd = new Date(bucketStart);
        bucketEnd.setDate(bucketStart.getDate() + 6);
        bucketEnd.setHours(23, 59, 59, 999);

        buckets.push({
          label: `W${weekIndex}`,
          startMs: bucketStart.getTime(),
          endMs: Math.min(bucketEnd.getTime(), monthEndMs),
        });

        const nextBucketStart = new Date(bucketStart);
        nextBucketStart.setDate(bucketStart.getDate() + 7);
        nextBucketStart.setHours(0, 0, 0, 0);

        bucketStart = nextBucketStart;
        weekIndex += 1;
      }

      return buckets;
    }

    case ReportPeriod.ThisQuarter: {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return Array.from({ length: 3 }).map((_, index) =>
        createMonthBucket(now.getFullYear(), quarterStartMonth + index),
      );
    }

    case ReportPeriod.ThisYear:
      return Array.from({ length: 12 }).map((_, index) =>
        createMonthBucket(now.getFullYear(), index),
      );

    case ReportPeriod.LastSixMonths:
    default:
      return Array.from({ length: 6 }).map((_, index) =>
        createMonthBucket(now.getFullYear(), now.getMonth() - 5 + index),
      );
  }
};
