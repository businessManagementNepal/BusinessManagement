import {
  TransactionDateFilterValue,
  TransactionFilterOption,
  TransactionListFilterValue,
  TransactionListItemState,
  TransactionPostingFilterValue,
  TransactionSourceFilterValue,
  TransactionSummaryCardState,
} from "@/feature/transactions/types/transaction.state.types";
import { TransactionTypeValue } from "@/feature/transactions/types/transaction.entity.types";

export interface TransactionsListViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  searchQuery: string;
  selectedFilter: TransactionListFilterValue;
  selectedSourceFilter: TransactionSourceFilterValue;
  selectedDateFilter: TransactionDateFilterValue;
  selectedPostingFilter: TransactionPostingFilterValue;
  selectedMoneyAccountFilter: string;
  sourceFilterOptions: readonly { label: string; value: TransactionSourceFilterValue }[];
  dateFilterOptions: readonly { label: string; value: TransactionDateFilterValue }[];
  postingFilterOptions: readonly { label: string; value: TransactionPostingFilterValue }[];
  moneyAccountFilterOptions: readonly TransactionFilterOption[];
  summaryCards: readonly TransactionSummaryCardState[];
  transactionItems: readonly TransactionListItemState[];
  emptyStateMessage: string;
  refresh: () => Promise<void>;
  onChangeSearchQuery: (value: string) => void;
  onChangeFilter: (filter: TransactionListFilterValue) => void;
  onChangeSourceFilter: (filter: TransactionSourceFilterValue) => void;
  onChangeDateFilter: (filter: TransactionDateFilterValue) => void;
  onChangePostingFilter: (filter: TransactionPostingFilterValue) => void;
  onChangeMoneyAccountFilter: (value: string) => void;
  onOpenCreate: (type: TransactionTypeValue) => void;
  onOpenEdit: (remoteId: string) => void;
}
