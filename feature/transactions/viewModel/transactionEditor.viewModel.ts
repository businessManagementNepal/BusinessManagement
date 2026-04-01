import {
  TransactionDirectionValue,
  TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionAccountOption,
  TransactionEditorState,
} from "@/feature/transactions/types/transaction.state.types";

export interface TransactionEditorViewModel {
  state: TransactionEditorState;
  accountOptions: readonly TransactionAccountOption[];
  availableTypes: readonly { value: TransactionTypeValue; label: string }[];
  availableDirections: readonly { value: TransactionDirectionValue; label: string }[];
  openCreate: (type: TransactionTypeValue) => void;
  openEdit: (remoteId: string) => Promise<void>;
  close: () => void;
  onChangeType: (type: TransactionTypeValue) => void;
  onChangeDirection: (direction: TransactionDirectionValue) => void;
  onChangeTitle: (title: string) => void;
  onChangeAmount: (amount: string) => void;
  onChangeAccountRemoteId: (accountRemoteId: string) => void;
  onChangeCategoryLabel: (categoryLabel: string) => void;
  onChangeNote: (note: string) => void;
  onChangeHappenedAt: (happenedAt: string) => void;
  submit: () => Promise<void>;
}
