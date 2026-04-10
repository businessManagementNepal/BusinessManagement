import { NotificationCenterItemState } from "@/feature/notifications/types/notificationCenter.types";

export interface NotificationCenterViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  items: readonly NotificationCenterItemState[];
  emptyStateMessage: string;
  onRefresh: () => Promise<void>;
  onOpenLedger: () => void;
}

