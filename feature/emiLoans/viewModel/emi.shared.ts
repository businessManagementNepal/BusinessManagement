import {
  EmiInstallment,
  EmiInstallmentStatus,
  EmiPaymentDirection,
  EmiPaymentDirectionValue,
  EmiPlan,
  EmiPlanMode,
  EmiPlanModeValue,
  EmiPlanStatus,
  EmiPlanType,
  EmiPlanTypeValue,
  SaveEmiInstallmentPayload,
} from "@/feature/emiLoans/types/emi.entity.types";
import {
  EmiInstallmentItemState,
  EmiPlanDetailState,
} from "@/feature/emiLoans/types/emi.state.types";

export const formatCurrency = (
  amount: number,
  currencyCode: string | null,
): string => {
  const normalizedCurrencyCode = currencyCode?.trim().toUpperCase() || "NPR";
  const formattedAmount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

  return `${normalizedCurrencyCode} ${formattedAmount}`;
};

export const formatDateLabel = (timestamp: number | null): string => {
  if (timestamp === null) {
    return "No due";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const parseDateInput = (value: string): number | null => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const [yearText, monthText, dayText] = normalizedValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.getTime();
};

export const formatDateInput = (timestamp: number | null): string => {
  if (timestamp === null) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const addMonths = (timestamp: number, monthsToAdd: number): number => {
  const date = new Date(timestamp);
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + monthsToAdd);

  if (date.getDate() < originalDay) {
    date.setDate(0);
  }

  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const createLocalRemoteId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const resolvePaymentDirectionForPlanType = (
  planType: EmiPlanTypeValue,
): EmiPaymentDirectionValue => {
  if (planType === EmiPlanType.CustomerInstallment) {
    return EmiPaymentDirection.Collect;
  }

  return EmiPaymentDirection.Pay;
};

export const getPlanTypeLabel = (planType: EmiPlanTypeValue): string => {
  switch (planType) {
    case EmiPlanType.MyEmi:
      return "My EMI";
    case EmiPlanType.MyLoan:
      return "My Loan";
    case EmiPlanType.BusinessLoan:
      return "Business Loan";
    case EmiPlanType.CustomerInstallment:
      return "Installment Plan";
    default:
      return "Plan";
  }
};

export const getPlanModeLabel = (planMode: EmiPlanModeValue): string => {
  return planMode === EmiPlanMode.Business ? "Business" : "Personal";
};

export const buildInstallmentSchedule = (
  planRemoteId: string,
  totalAmount: number,
  installmentCount: number,
  firstDueAt: number,
): SaveEmiInstallmentPayload[] => {
  const baseAmount = Math.floor((totalAmount / installmentCount) * 100) / 100;
  const scheduledItems: SaveEmiInstallmentPayload[] = [];
  let allocatedAmount = 0;

  for (let index = 0; index < installmentCount; index += 1) {
    const installmentNumber = index + 1;
    const isLastInstallment = installmentNumber === installmentCount;
    const amount = isLastInstallment
      ? Math.round((totalAmount - allocatedAmount) * 100) / 100
      : baseAmount;

    allocatedAmount += amount;

    scheduledItems.push({
      remoteId: createLocalRemoteId(`emi_installment_${installmentNumber}`),
      planRemoteId,
      installmentNumber,
      amount,
      dueAt: addMonths(firstDueAt, index),
      status: EmiInstallmentStatus.Pending,
      paidAt: null,
    });
  }

  return scheduledItems;
};

export const getRemainingAmount = (plan: EmiPlan): number => {
  return Math.max(0, plan.totalAmount - plan.paidAmount);
};

export const getDueTodayAmount = (installments: readonly EmiInstallment[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  return installments.reduce((sum, installment) => {
    if (
      installment.status === EmiInstallmentStatus.Pending &&
      installment.dueAt === todayTime
    ) {
      return sum + installment.amount;
    }

    return sum;
  }, 0);
};

export const getOverdueAmount = (installments: readonly EmiInstallment[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  return installments.reduce((sum, installment) => {
    if (
      installment.status === EmiInstallmentStatus.Pending &&
      installment.dueAt < todayTime
    ) {
      return sum + installment.amount;
    }

    return sum;
  }, 0);
};

export const isPlanOverdue = (installments: readonly EmiInstallment[]): boolean => {
  return getOverdueAmount(installments) > 0;
};

const buildInstallmentStatusLabel = (
  installment: EmiInstallment,
): string => {
  if (installment.status === EmiInstallmentStatus.Paid) {
    return `Paid on ${formatDateLabel(installment.paidAt)}`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (installment.dueAt < today.getTime()) {
    return "Overdue";
  }

  if (installment.dueAt === today.getTime()) {
    return "Due today";
  }

  return `Due ${formatDateLabel(installment.dueAt)}`;
};

export const buildEmiPlanDetailState = (
  plan: EmiPlan,
  installments: readonly EmiInstallment[],
): EmiPlanDetailState => {
  const dueTodayAmount = getDueTodayAmount(installments);
  const overdueAmount = getOverdueAmount(installments);
  const remainingAmount = getRemainingAmount(plan);
  const nextPendingInstallment = installments.find(
    (installment) => installment.status === EmiInstallmentStatus.Pending,
  );

  const installmentItems: EmiInstallmentItemState[] = installments.map((installment) => {
    const isPaid = installment.status === EmiInstallmentStatus.Paid;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = !isPaid && installment.dueAt < today.getTime();

    return {
      remoteId: installment.remoteId,
      title: `Installment ${installment.installmentNumber}`,
      subtitle: buildInstallmentStatusLabel(installment),
      amountLabel: formatCurrency(installment.amount, plan.currencyCode),
      statusLabel: isPaid ? "Closed" : isOverdue ? "Overdue" : "Due",
      isPaid,
      isOverdue,
    };
  });

  const reminderLabel = plan.reminderEnabled
    ? `${plan.reminderDaysBefore ?? 1} day before due`
    : "Reminder off";

  return {
    remoteId: plan.remoteId,
    title: plan.title,
    subtitle: getPlanTypeLabel(plan.planType),
    totalAmountLabel: formatCurrency(plan.totalAmount, plan.currencyCode),
    remainingAmountLabel: formatCurrency(remainingAmount, plan.currencyCode),
    dueTodayLabel: formatCurrency(dueTodayAmount, plan.currencyCode),
    overdueLabel: formatCurrency(overdueAmount, plan.currencyCode),
    nextDueLabel: nextPendingInstallment
      ? formatDateLabel(nextPendingInstallment.dueAt)
      : "Closed",
    progressLabel: `${plan.paidInstallmentCount}/${plan.installmentCount} paid`,
    reminderLabel,
    statusLabel:
      plan.status === EmiPlanStatus.Closed
        ? "Closed"
        : overdueAmount > 0
          ? "Overdue"
          : "Active",
    paymentDirection: plan.paymentDirection,
    counterpartyName: plan.counterpartyName,
    counterpartyPhone: plan.counterpartyPhone,
    installmentItems,
  };
};
