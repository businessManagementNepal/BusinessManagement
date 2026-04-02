import {
  LedgerBalanceDirectionValue,
  LedgerEntryTypeValue,
} from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerAccountOptionState,
  LedgerDirectionOptionState,
  LedgerEditorFormState,
  LedgerEntryTypeOptionState,
} from "@/feature/ledger/types/ledger.state.types";

export interface LedgerEditorViewModel {
  state: LedgerEditorFormState;
  accountOptions: readonly LedgerAccountOptionState[];
  availableEntryTypes: readonly LedgerEntryTypeOptionState[];
  availableDirections: readonly LedgerDirectionOptionState[];
  openCreate: (entryType?: LedgerEntryTypeValue) => void;
  openCreateForParty: (
    partyName: string,
    partyPhone: string | null,
    entryType: LedgerEntryTypeValue,
  ) => void;
  openEdit: (remoteId: string) => Promise<void>;
  close: () => void;
  onChangeEntryType: (entryType: LedgerEntryTypeValue) => void;
  onChangeBalanceDirection: (direction: LedgerBalanceDirectionValue) => void;
  onChangePartyName: (value: string) => void;
  onChangePartyPhone: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onChangeNote: (value: string) => void;
  onChangeHappenedAt: (value: string) => void;
  onChangeDueAt: (value: string) => void;
  onChangeSettlementAccountRemoteId: (value: string) => void;
  submit: () => Promise<void>;
}
