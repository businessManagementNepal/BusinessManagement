import {
  TransactionListFilterValue,
  TransactionListItemState,
  TransactionSummaryCardState,
} from "@/feature/transactions/types/transaction.state.types";
import { TransactionTypeValue } from "@/feature/transactions/types/transaction.entity.types";

export interface TransactionsListViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  searchQuery: string;
  selectedFilter: TransactionListFilterValue;
  summaryCards: readonly TransactionSummaryCardState[];
  transactionItems: readonly TransactionListItemState[];
  emptyStateMessage: string;
  refresh: () => Promise<void>;
  onChangeSearchQuery: (value: string) => void;
  onChangeFilter: (filter: TransactionListFilterValue) => void;
  onOpenCreate: (type: TransactionTypeValue) => void;
  onOpenEdit: (remoteId: string) => void;
}
