import {
  EmiPlanListItemState,
  EmiSummaryCardState,
  EmiListFilterValue,
} from "@/feature/emiLoans/types/emi.state.types";

export interface EmiListViewModel {
  planMode: "personal" | "business";
  title: string;
  subtitle: string;
  primaryActionLabel: string;
  isLoading: boolean;
  errorMessage: string | null;
  searchQuery: string;
  selectedFilter: EmiListFilterValue;
  summaryCards: readonly EmiSummaryCardState[];
  zeroAmountLabel: string;
  planItems: readonly EmiPlanListItemState[];
  emptyStateMessage: string;
  refresh: () => Promise<void>;
  onChangeSearchQuery: (value: string) => void;
  onChangeFilter: (filter: EmiListFilterValue) => void;
  onOpenCreate: () => void;
  onOpenDetail: (remoteId: string) => void;
}
