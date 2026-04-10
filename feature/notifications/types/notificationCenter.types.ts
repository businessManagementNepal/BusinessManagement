export type NotificationCenterTone = "neutral" | "warning" | "destructive";

export type NotificationCenterItemState = {
  id: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  timeLabel: string;
  tone: NotificationCenterTone;
};

