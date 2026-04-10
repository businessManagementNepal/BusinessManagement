import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Bell, CalendarClock, ChevronRight, TriangleAlert } from "lucide-react-native";
import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { NotificationCenterViewModel } from "@/feature/notifications/viewModel/notificationCenter.viewModel";

type NotificationCenterScreenProps = {
  viewModel: NotificationCenterViewModel;
};

export function NotificationCenterScreen({
  viewModel,
}: NotificationCenterScreenProps) {
  return (
    <DashboardTabScaffold
      footer={null}
      baseBottomPadding={110}
      contentContainerStyle={null}
      showDivider={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <AppButton
          label="Open Ledger"
          variant="secondary"
          size="sm"
          onPress={viewModel.onOpenLedger}
        />
      </View>

      {viewModel.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : viewModel.errorMessage ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
        </View>
      ) : viewModel.items.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>{viewModel.emptyStateMessage}</Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          {viewModel.items.map((item, index) => (
            <Card
              key={item.id}
              style={[
                styles.itemCard,
                item.tone === "destructive"
                  ? styles.itemCardCritical
                  : item.tone === "warning"
                    ? styles.itemCardWarning
                    : null,
                index === viewModel.items.length - 1 ? styles.lastCard : null,
              ]}
            >
              <Pressable
                style={styles.itemRow}
                onPress={viewModel.onOpenLedger}
                accessibilityRole="button"
              >
                <View style={styles.itemIcon}>
                  {item.tone === "destructive" ? (
                    <TriangleAlert size={16} color={colors.destructive} />
                  ) : item.tone === "warning" ? (
                    <CalendarClock size={16} color={colors.warning} />
                  ) : (
                    <Bell size={16} color={colors.primary} />
                  )}
                </View>

                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  <Text
                    style={[
                      styles.itemTime,
                      item.tone === "destructive"
                        ? styles.timeCritical
                        : item.tone === "warning"
                          ? styles.timeWarning
                          : null,
                    ]}
                  >
                    {item.timeLabel}
                  </Text>
                </View>

                <View style={styles.itemRight}>
                  <Text
                    style={[
                      styles.itemAmount,
                      item.tone === "destructive"
                        ? styles.amountCritical
                        : item.tone === "warning"
                          ? styles.amountWarning
                          : null,
                    ]}
                  >
                    {item.amountLabel}
                  </Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </View>
              </Pressable>
            </Card>
          ))}
        </View>
      )}
    </DashboardTabScaffold>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  centerState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    textAlign: "center",
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 13,
    textAlign: "center",
  },
  listWrap: {
    gap: spacing.xs,
  },
  itemCard: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lastCard: {
    marginBottom: spacing.sm,
  },
  itemCardWarning: {
    borderColor: colors.warning,
    backgroundColor: "rgba(245, 158, 11, 0.07)",
  },
  itemCardCritical: {
    borderColor: colors.destructive,
    backgroundColor: "rgba(228, 71, 71, 0.08)",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  itemSubtitle: {
    color: colors.mutedForeground,
    fontSize: 11,
  },
  itemTime: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterMedium",
  },
  timeWarning: {
    color: colors.warning,
  },
  timeCritical: {
    color: colors.destructive,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  itemAmount: {
    color: colors.cardForeground,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  amountWarning: {
    color: colors.warning,
  },
  amountCritical: {
    color: colors.destructive,
  },
});
