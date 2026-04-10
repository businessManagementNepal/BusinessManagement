import {
  LedgerEntryTypeValue,
} from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerAccountOptionState,
  LedgerEditorFormState,
  LedgerEntryTypeOptionState,
  LedgerSettlementLinkOptionState,
} from "@/feature/ledger/types/ledger.state.types";

export interface LedgerEditorViewModel {
  state: LedgerEditorFormState;
  partySuggestions: readonly string[];
  availableEntryTypes: readonly LedgerEntryTypeOptionState[];
  availableSettlementAccounts: readonly LedgerAccountOptionState[];
  settlementLinkOptions: readonly LedgerSettlementLinkOptionState[];
  openCreate: (entryType: LedgerEntryTypeValue) => void;
  openCreateForParty: (
    partyName: string,
    entryType: LedgerEntryTypeValue,
  ) => void;
  openEdit: (remoteId: string) => Promise<void>;
  close: () => void;
  onChangeEntryType: (entryType: LedgerEntryTypeValue) => void;
  onSelectPartySuggestion: (value: string) => void;
  onChangePartyName: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onChangeHappenedAt: (value: string) => void;
  onChangeDueAt: (value: string) => void;
  onChangeSettlementAccountRemoteId: (value: string) => void;
  onChangeSettledAgainstEntryRemoteId: (value: string) => void;
  onChangeReferenceNumber: (value: string) => void;
  onChangeNote: (value: string) => void;
  onChangeReminderAt: (value: string) => void;
  onToggleMoreDetails: () => void;
  pickAttachment: () => Promise<void>;
  clearAttachment: () => void;
  submit: () => Promise<void>;
}
