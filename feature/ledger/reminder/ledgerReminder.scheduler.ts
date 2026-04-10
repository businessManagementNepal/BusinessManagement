import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { LedgerEntry } from "@/feature/ledger/types/ledger.entity.types";
import {
  buildLedgerOutstandingDueItems,
  formatDateLabel,
  getLedgerEntryTypeLabel,
} from "@/feature/ledger/viewModel/ledger.shared";

const LEDGER_REMINDER_CHANNEL_ID = "ledger-reminders";
const LEDGER_REMINDER_MODULE_KEY = "ledger_reminder";
const MAX_SCHEDULED_LEDGER_REMINDERS = 60;

let notificationsConfigured = false;

const configureNotificationHandlerIfNeeded = async (): Promise<void> => {
  if (notificationsConfigured || Platform.OS === "web") {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(LEDGER_REMINDER_CHANNEL_ID, {
      name: "Ledger Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16A34A",
      sound: "default",
    });
  }

  notificationsConfigured = true;
};

const requestDeviceNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === "web") {
    return false;
  }

  await configureNotificationHandlerIfNeeded();

  const existingPermission = await Notifications.getPermissionsAsync();
  if (
    existingPermission.granted ||
    existingPermission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();
  return (
    requestedPermission.granted ||
    requestedPermission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

const buildReminderBody = (entry: LedgerEntry): string => {
  const actionLabel = getLedgerEntryTypeLabel(entry.entryType);
  const dueLabel =
    entry.dueAt !== null ? ` | Due ${formatDateLabel(entry.dueAt)}` : "";
  return `${actionLabel} reminder for ${entry.partyName}${dueLabel}`;
};

const cancelScheduledLedgerReminderNotifications = async (): Promise<void> => {
  if (Platform.OS === "web") {
    return;
  }

  const scheduledRequests = await Notifications.getAllScheduledNotificationsAsync();
  const reminderRequests = scheduledRequests.filter((request) => {
    const data = request.content.data as { module?: string } | undefined;
    return data?.module === LEDGER_REMINDER_MODULE_KEY;
  });

  await Promise.all(
    reminderRequests.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier),
    ),
  );
};

export const clearLedgerReminderNotifications = async (): Promise<void> => {
  try {
    await cancelScheduledLedgerReminderNotifications();
  } catch {
    // Keep reminder cleanup best effort.
  }
};

export const syncLedgerReminderNotifications = async (
  entries: readonly LedgerEntry[],
): Promise<void> => {
  await clearLedgerReminderNotifications();

  const isPermissionGranted = await requestDeviceNotificationPermission();
  if (!isPermissionGranted) {
    return;
  }

  const now = Date.now();
  const outstandingDueByRemoteId = new Map(
    buildLedgerOutstandingDueItems(entries).map((item) => [
      item.dueEntryRemoteId,
      item.outstandingAmount,
    ]),
  );

  const reminderCandidates = [...entries]
    .filter((entry) => entry.reminderAt !== null && entry.reminderAt >= now)
    .filter((entry) => {
      const outstandingDueAmount = outstandingDueByRemoteId.get(entry.remoteId);
      if (outstandingDueAmount === undefined) {
        return true;
      }
      return outstandingDueAmount > 0;
    })
    .sort((left, right) => (left.reminderAt as number) - (right.reminderAt as number))
    .slice(0, MAX_SCHEDULED_LEDGER_REMINDERS);

  for (const entry of reminderCandidates) {
    const reminderAt = entry.reminderAt as number;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Ledger Reminder",
        body: buildReminderBody(entry),
        sound: "default",
        data: {
          module: LEDGER_REMINDER_MODULE_KEY,
          ledgerEntryRemoteId: entry.remoteId,
          partyName: entry.partyName,
          reminderAt,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminderAt),
        ...(Platform.OS === "android"
          ? { channelId: LEDGER_REMINDER_CHANNEL_ID }
          : {}),
      },
    });
  }
};
