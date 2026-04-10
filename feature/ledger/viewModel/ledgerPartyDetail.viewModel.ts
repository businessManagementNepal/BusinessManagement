import { LedgerPartyDetailState } from "@/feature/ledger/types/ledger.state.types";

export interface LedgerPartyDetailViewModel {
  visible: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  state: LedgerPartyDetailState | null;
  openPartyDetail: (partyId: string, partyName: string) => Promise<void>;
  close: () => void;
  onOpenEdit: (remoteId: string) => void;
  onOpenDelete: (remoteId: string) => void;
  onQuickCollect: () => void;
  onQuickPaymentOut: () => void;
  onShareStatement: () => Promise<void>;
}
