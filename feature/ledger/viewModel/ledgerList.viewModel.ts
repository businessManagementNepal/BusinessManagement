import { LedgerEntryTypeValue } from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerAgingBucketState,
  LedgerCollectionQueueItemState,
  LedgerListFilterValue,
  LedgerPartyListItemState,
  LedgerSummaryCardState,
} from "@/feature/ledger/types/ledger.state.types";

export interface LedgerListViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  searchQuery: string;
  selectedFilter: LedgerListFilterValue;
  summaryCards: readonly LedgerSummaryCardState[];
  hasOverdueAging: boolean;
  agingBuckets: readonly LedgerAgingBucketState[];
  collectionQueue: readonly LedgerCollectionQueueItemState[];
  partyItems: readonly LedgerPartyListItemState[];
  emptyStateMessage: string;
  refresh: () => Promise<void>;
  onChangeSearchQuery: (value: string) => void;
  onChangeFilter: (filter: LedgerListFilterValue) => void;
  onOpenCreate: (entryType: LedgerEntryTypeValue) => void;
  onQuickCollectFromQueue: (partyName: string) => void;
  onOpenPartyDetail: (partyId: string, partyName: string) => Promise<void> | void;
}
