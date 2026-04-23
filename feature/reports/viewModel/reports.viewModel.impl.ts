import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
  ReportHomeTab,
  ReportPeriod,
  ReportQuery,
  ReportScope,
} from "@/feature/reports/types/report.entity.types";
import { ReportsViewState } from "@/feature/reports/types/report.state.types";
import { DocumentExportAction } from "@/shared/utils/document/exportDocument";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReportsViewModel,
  UseReportsViewModelParams,
} from "./reports.viewModel";

const buildQuery = (params: {
  accountType: UseReportsViewModelParams["accountType"];
  ownerUserRemoteId: string | null;
  accountRemoteId: string | null;
  period: ReportQuery["period"];
  reportId?: ReportQuery["reportId"];
}): ReportQuery => ({
  accountType: params.accountType,
  scope:
    params.accountType === AccountType.Business
      ? ReportScope.Business
      : ReportScope.Personal,
  ownerUserRemoteId: params.ownerUserRemoteId,
  accountRemoteId: params.accountRemoteId,
  period: params.period,
  reportId: params.reportId ?? null,
});

export const useReportsViewModel = (
  params: UseReportsViewModelParams,
): ReportsViewModel => {
  const {
    accountType,
    ownerUserRemoteId,
    accountRemoteId,
    canExportReports,
    getReportsDashboardUseCase,
    getReportDetailUseCase,
    exportReportDetailDocumentUseCase,
  } = params;

  const [state, setState] = useState<ReportsViewState>({
    isLoading: true,
    isExporting: false,
    errorMessage: null,
    activeHomeTab: ReportHomeTab.Overview,
    activePeriod: ReportPeriod.ThisMonth,
    dashboard: null,
    selectedReportId: null,
    detail: null,
  });

  const activeLoadRequestRef = useRef(0);

  const loadDashboard = useCallback(
    async (period: ReportQuery["period"]) => {
      if (
        (accountType === AccountType.Business && !accountRemoteId) ||
        (!ownerUserRemoteId && !accountRemoteId)
      ) {
        setState((current) => ({
          ...current,
          isLoading: false,
          errorMessage: "Active report scope is missing.",
        }));
        return;
      }

      const requestId = activeLoadRequestRef.current + 1;
      activeLoadRequestRef.current = requestId;

      setState((current) => ({
        ...current,
        isLoading: true,
        errorMessage: null,
      }));

      const result = await getReportsDashboardUseCase.execute(
        buildQuery({
          accountType,
          ownerUserRemoteId,
          accountRemoteId,
          period,
        }),
      );

      if (requestId !== activeLoadRequestRef.current) {
        return;
      }

      if (!result.success) {
        setState((current) => ({
          ...current,
          isLoading: false,
          errorMessage: result.error.message,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        isLoading: false,
        errorMessage: null,
        dashboard: result.value,
        activePeriod: period,
      }));
    },
    [
      accountRemoteId,
      accountType,
      getReportsDashboardUseCase,
      ownerUserRemoteId,
    ],
  );

  const loadDetail = useCallback(
    async (
      reportId: NonNullable<ReportQuery["reportId"]>,
      period: ReportQuery["period"],
    ) => {
      if (
        (accountType === AccountType.Business && !accountRemoteId) ||
        (!ownerUserRemoteId && !accountRemoteId)
      ) {
        setState((current) => ({
          ...current,
          isLoading: false,
          errorMessage: "Active report scope is missing.",
        }));
        return;
      }

      const requestId = activeLoadRequestRef.current + 1;
      activeLoadRequestRef.current = requestId;

      setState((current) => ({
        ...current,
        isLoading: true,
        errorMessage: null,
      }));

      const result = await getReportDetailUseCase.execute(
        buildQuery({
          accountType,
          ownerUserRemoteId,
          accountRemoteId,
          period,
          reportId,
        }),
      );

      if (requestId !== activeLoadRequestRef.current) {
        return;
      }

      if (!result.success) {
        setState((current) => ({
          ...current,
          isLoading: false,
          errorMessage: result.error.message,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        isLoading: false,
        errorMessage: null,
        selectedReportId: reportId,
        detail: result.value,
        activePeriod: period,
      }));
    },
    [accountRemoteId, accountType, getReportDetailUseCase, ownerUserRemoteId],
  );

  useEffect(() => {
    void loadDashboard(ReportPeriod.ThisMonth);
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    if (state.selectedReportId && state.detail) {
      await loadDetail(state.selectedReportId, state.activePeriod);
      return;
    }

    await loadDashboard(state.activePeriod);
  }, [
    loadDashboard,
    loadDetail,
    state.activePeriod,
    state.detail,
    state.selectedReportId,
  ]);

  const onSelectHomeTab = useCallback(
    (tab: ReportsViewState["activeHomeTab"]) => {
      setState((current) => ({ ...current, activeHomeTab: tab }));
    },
    [],
  );

  const onSelectPeriod = useCallback(
    async (period: ReportQuery["period"]) => {
      if (state.selectedReportId && state.detail) {
        await loadDetail(state.selectedReportId, period);
        return;
      }

      await loadDashboard(period);
    },
    [loadDashboard, loadDetail, state.detail, state.selectedReportId],
  );

  const onOpenReport = useCallback(
    async (reportId: NonNullable<ReportQuery["reportId"]>) => {
      await loadDetail(reportId, state.activePeriod);
    },
    [loadDetail, state.activePeriod],
  );

  const onBackToReports = useCallback(() => {
    setState((current) => ({
      ...current,
      selectedReportId: null,
      detail: null,
      errorMessage: null,
      isExporting: false,
    }));
  }, []);

  const onExportDetail = useCallback(
    async (action: DocumentExportAction) => {
      if (!state.detail) {
        return;
      }

      if (!canExportReports) {
        setState((current) => ({
          ...current,
          errorMessage:
            "You have view access only. Ask admin for export permission.",
        }));
        return;
      }

      setState((current) => ({
        ...current,
        isExporting: true,
        errorMessage: null,
      }));

      const scopeLabel =
        accountType === AccountType.Business ? "Business" : "Personal";

      const result = await exportReportDetailDocumentUseCase.execute({
        detail: state.detail,
        scopeLabel,
        action,
      });

      if (!result.success) {
        setState((current) => ({
          ...current,
          isExporting: false,
          errorMessage: result.error.message,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        isExporting: false,
        errorMessage: null,
      }));
    },
    [accountType, canExportReports, exportReportDetailDocumentUseCase, state.detail],
  );

  return useMemo(
    () => ({
      ...state,
      isBusinessMode: accountType === AccountType.Business,
      canExportReports,
      onRefresh,
      onSelectHomeTab,
      onSelectPeriod,
      onOpenReport,
      onBackToReports,
      onExportDetail,
    }),
    [
      accountType,
      canExportReports,
      onBackToReports,
      onOpenReport,
      onRefresh,
      onSelectHomeTab,
      onSelectPeriod,
      onExportDetail,
      state,
    ],
  );
};
