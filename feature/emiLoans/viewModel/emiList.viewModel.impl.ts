import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EmiInstallmentStatus,
  EmiPaymentDirection,
  EmiPlan,
  EmiPlanMode,
} from "@/feature/emiLoans/types/emi.entity.types";
import {
  EmiListFilter,
  EmiListFilterValue,
  EmiPlanListItemState,
  EmiSummaryCardState,
} from "@/feature/emiLoans/types/emi.state.types";
import { GetEmiPlansUseCase } from "@/feature/emiLoans/useCase/getEmiPlans.useCase";
import {
  formatCurrency,
  formatDateLabel,
    getRemainingAmount,
} from "./emi.shared";
import { EmiListViewModel } from "./emiList.viewModel";

type UseEmiListViewModelParams = {
  planMode: "personal" | "business";
  ownerUserRemoteId: string | null;
  businessAccountRemoteId: string | null;
  fallbackCurrencyCode: string;
  fallbackCountryCode: string | null;
  getEmiPlansUseCase: GetEmiPlansUseCase;
  getPlanDetailByRemoteId: (remoteId: string) => Promise<EmiPlanDetailLookupResult>;
  onOpenCreate: () => void;
  onOpenDetail: (remoteId: string) => void;
  reloadSignal: number;
};

type EmiPlanInstallmentLookupItem = {
  amount: number;
  dueAt: number;
  status: string;
};

type EmiPlanDetailLookupSuccess = {
  success: true;
  value: {
    installments: EmiPlanInstallmentLookupItem[];
  };
};

type EmiPlanDetailLookupFailure = {
  success: false;
  error: {
    message: string;
  };
};

type EmiPlanDetailLookupResult =
  | EmiPlanDetailLookupSuccess
  | EmiPlanDetailLookupFailure;

type PlanSnapshot = EmiPlan & {
  dueTodayAmount: number;
  overdueAmount: number;
  isOverdue: boolean;
  remainingAmount: number;
};

const buildPlanSnapshot = async (
  plan: EmiPlan,
  getPlanDetailByRemoteId: UseEmiListViewModelParams["getPlanDetailByRemoteId"],
): Promise<PlanSnapshot> => {
  const detailResult = await getPlanDetailByRemoteId(plan.remoteId);

  if (!detailResult.success) {
    return {
      ...plan,
      dueTodayAmount: 0,
      overdueAmount: 0,
      isOverdue: false,
      remainingAmount: getRemainingAmount(plan),
    };
  }

  const installments = detailResult.value.installments;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const dueTodayAmount = installments.reduce((sum, installment) => {
    return installment.status === EmiInstallmentStatus.Pending && installment.dueAt === todayTime
      ? sum + installment.amount
      : sum;
  }, 0);

  const overdueAmount = installments.reduce((sum, installment) => {
    return installment.status === EmiInstallmentStatus.Pending && installment.dueAt < todayTime
      ? sum + installment.amount
      : sum;
  }, 0);

  return {
    ...plan,
    dueTodayAmount,
    overdueAmount,
    isOverdue: overdueAmount > 0,
    remainingAmount: getRemainingAmount(plan),
  };
};

const buildSubtitle = (plan: PlanSnapshot): string => {
  const nextDueLabel = formatDateLabel(plan.nextDueAt);

  if (plan.planMode === EmiPlanMode.Business) {
    const partyLabel = plan.counterpartyName?.trim() || "No party linked";
    return `${partyLabel} | Next ${nextDueLabel}`;
  }

  const linkedLabel = plan.counterpartyName?.trim() || plan.linkedAccountDisplayNameSnapshot;
  return `${linkedLabel} | Next ${nextDueLabel}`;
};

const buildBadgeLabel = (plan: PlanSnapshot): string => {
  if (plan.status === "closed") {
    return "Closed";
  }

  if (plan.isOverdue) {
    return "Overdue";
  }

  return plan.paymentDirection === EmiPaymentDirection.Collect ? "Collect" : "Pay";
};

const buildSummaryCards = (
  planMode: "personal" | "business",
  plans: readonly PlanSnapshot[],
  fallbackCurrencyCode: string,
  fallbackCountryCode: string | null,
): EmiSummaryCardState[] => {
  const currencyCode = plans[0]?.currencyCode ?? fallbackCurrencyCode;

  if (planMode === "business") {
    const toCollect = plans.reduce((sum, plan) => {
      return plan.paymentDirection === EmiPaymentDirection.Collect
        ? sum + plan.remainingAmount
        : sum;
    }, 0);
    const toPay = plans.reduce((sum, plan) => {
      return plan.paymentDirection === EmiPaymentDirection.Pay
        ? sum + plan.remainingAmount
        : sum;
    }, 0);
    const dueToday = plans.reduce((sum, plan) => sum + plan.dueTodayAmount, 0);
    const overdue = plans.reduce((sum, plan) => sum + plan.overdueAmount, 0);

    return [
      {
        id: "to-collect",
        label: "To Collect",
        value: formatCurrency(toCollect, currencyCode, fallbackCountryCode),
        tone: "collect",
      },
      {
        id: "to-pay",
        label: "To Pay",
        value: formatCurrency(toPay, currencyCode, fallbackCountryCode),
        tone: "pay",
      },
      {
        id: "due-today",
        label: "Due Today",
        value: formatCurrency(dueToday, currencyCode, fallbackCountryCode),
        tone: "neutral",
      },
      {
        id: "overdue",
        label: "Overdue",
        value: formatCurrency(overdue, currencyCode, fallbackCountryCode),
        tone: "overdue",
      },
    ];
  }

  const activePlans = plans.filter((plan) => plan.status !== "closed").length;
  const dueToday = plans.reduce((sum, plan) => sum + plan.dueTodayAmount, 0);
  const overdue = plans.reduce((sum, plan) => sum + plan.overdueAmount, 0);
  const remaining = plans.reduce((sum, plan) => sum + plan.remainingAmount, 0);

  return [
    {
      id: "my-plans",
      label: "My Plans",
      value: `${activePlans}`,
      tone: "neutral",
    },
    {
      id: "due-today",
      label: "Due Today",
      value: formatCurrency(dueToday, currencyCode, fallbackCountryCode),
      tone: "pay",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: formatCurrency(overdue, currencyCode, fallbackCountryCode),
      tone: "overdue",
    },
    {
      id: "remaining",
      label: "Remaining",
      value: formatCurrency(remaining, currencyCode, fallbackCountryCode),
      tone: "neutral",
    },
  ];
};

const matchesFilter = (
  plan: PlanSnapshot,
  filter: EmiListFilterValue,
): boolean => {
  switch (filter) {
    case EmiListFilter.Active:
      return plan.status !== "closed";
    case EmiListFilter.Due:
      return plan.dueTodayAmount > 0;
    case EmiListFilter.Overdue:
      return plan.overdueAmount > 0;
    case EmiListFilter.Closed:
      return plan.status === "closed";
    case EmiListFilter.Collect:
      return plan.paymentDirection === EmiPaymentDirection.Collect;
    case EmiListFilter.Pay:
      return plan.paymentDirection === EmiPaymentDirection.Pay;
    default:
      return true;
  }
};

export const useEmiListViewModel = ({
  planMode,
  ownerUserRemoteId,
  businessAccountRemoteId,
  fallbackCurrencyCode,
  fallbackCountryCode,
  getEmiPlansUseCase,
  getPlanDetailByRemoteId,
  onOpenCreate,
  onOpenDetail,
  reloadSignal,
}: UseEmiListViewModelParams): EmiListViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [plans, setPlans] = useState<readonly PlanSnapshot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<EmiListFilterValue>(
    EmiListFilter.All,
  );

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    const result = await getEmiPlansUseCase.execute({
      planMode,
      ownerUserRemoteId,
      businessAccountRemoteId,
    });

    if (!result.success) {
      setPlans([]);
      setErrorMessage(result.error.message);
      setIsLoading(false);
      return;
    }

    const snapshotPlans = await Promise.all(
      result.value.map((plan) => buildPlanSnapshot(plan, getPlanDetailByRemoteId)),
    );

    setPlans(snapshotPlans.sort((left, right) => right.updatedAt - left.updatedAt));
    setErrorMessage(null);
    setIsLoading(false);
  }, [
    businessAccountRemoteId,
    getEmiPlansUseCase,
    getPlanDetailByRemoteId,
    ownerUserRemoteId,
    planMode,
  ]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans, reloadSignal]);

  const filteredPlans = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        plan.title.toLowerCase().includes(normalizedSearch) ||
        (plan.counterpartyName ?? "").toLowerCase().includes(normalizedSearch) ||
        (plan.counterpartyPhone ?? "").toLowerCase().includes(normalizedSearch);

      return matchesSearch && matchesFilter(plan, selectedFilter);
    });
  }, [plans, searchQuery, selectedFilter]);

  const summaryCards = useMemo(
    () =>
      buildSummaryCards(
        planMode,
        plans,
        fallbackCurrencyCode,
        fallbackCountryCode,
      ),
    [fallbackCountryCode, fallbackCurrencyCode, planMode, plans],
  );

  const zeroAmountLabel = useMemo(
    () => formatCurrency(0, fallbackCurrencyCode, fallbackCountryCode),
    [fallbackCountryCode, fallbackCurrencyCode],
  );

  const planItems = useMemo<readonly EmiPlanListItemState[]>(() => {
    return filteredPlans.map((plan) => ({
      remoteId: plan.remoteId,
      title: plan.title,
      subtitle: buildSubtitle(plan),
      amountLabel: formatCurrency(plan.remainingAmount, plan.currencyCode),
      progressLabel: `${plan.paidInstallmentCount}/${plan.installmentCount} paid`,
      badgeLabel: buildBadgeLabel(plan),
      tone: plan.paymentDirection === EmiPaymentDirection.Collect ? "collect" : "pay",
      isOverdue: plan.overdueAmount > 0,
      isClosed: plan.status === "closed",
    }));
  }, [filteredPlans]);

  const emptyStateMessage = useMemo(() => {
    if (plans.length === 0) {
      return planMode === "business"
        ? "No business plans yet. Add your first business loan or installment plan."
        : "No EMI plans yet. Add your first personal EMI or loan plan.";
    }

    return "No plans match your current search or filter.";
  }, [planMode, plans.length]);

  const title = planMode === "business" ? "Business Loan" : "My EMI";
  const subtitle =
    planMode === "business"
      ? "Track to collect and to pay plans"
      : "Track your due, overdue, and remaining EMI";
  const primaryActionLabel = planMode === "business" ? "Add Plan" : "Add My Plan";

  return {
    planMode,
    title,
    subtitle,
    primaryActionLabel,
    isLoading,
    errorMessage,
    searchQuery,
    selectedFilter,
    summaryCards,
    zeroAmountLabel,
    planItems,
    emptyStateMessage,
    refresh: loadPlans,
    onChangeSearchQuery: setSearchQuery,
    onChangeFilter: setSelectedFilter,
    onOpenCreate,
    onOpenDetail,
  };
};

