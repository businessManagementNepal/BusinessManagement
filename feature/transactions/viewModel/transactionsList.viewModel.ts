import { TransactionTypeValue } from "@/feature/transactions/types/transaction.entity.types";
import {
    TransactionDateFilterValue,
    TransactionListFilterValue,
    TransactionListItemState,
    TransactionSummaryCardState,
} from "@/feature/transactions/types/transaction.state.types";

export interface TransactionsListViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  searchQuery: string;
  selectedFilter: TransactionListFilterValue;
  selectedDateFilter: TransactionDateFilterValue;
  dateFilterOptions: readonly { label: string; value: TransactionDateFilterValue }[];
  summaryCards: readonly TransactionSummaryCardState[];
  transactionItems: readonly TransactionListItemState[];
  emptyStateMessage: string;
  refresh: () => Promise<void>;
  onChangeSearchQuery: (value: string) => void;
  onChangeFilter: (filter: TransactionListFilterValue) => void;
  onChangeDateFilter: (filter: TransactionDateFilterValue) => void;
  onOpenCreate: (type: TransactionTypeValue) => void;
  onOpenEdit: (remoteId: string) => void;
}
