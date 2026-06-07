import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Bell, CalendarClock, ChevronRight, TriangleAlert } from "lucide-react-native";
import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { NotificationCenterViewModel } from "@/feature/notifications/viewModel/notificationCenter.viewModel";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

type NotificationCenterScreenProps = {
  viewModel: NotificationCenterViewModel;
};

export function NotificationCenterScreen({
  viewModel,
}: NotificationCenterScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

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
          <ActivityIndicator color={theme.colors.primary} />
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
                    <TriangleAlert size={16} color={theme.colors.destructive} />
                  ) : item.tone === "warning" ? (
                    <CalendarClock size={16} color={theme.colors.warning} />
                  ) : (
                    <Bell size={16} color={theme.colors.primary} />
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
                  <ChevronRight size={16} color={theme.colors.mutedForeground} />
                </View>
              </Pressable>
            </Card>
          ))}
        </View>
      )}
    </DashboardTabScaffold>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
      marginBottom: theme.scaleSpace(spacing.xs),
    },
    sectionTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(16),
      fontFamily: "InterBold",
    },
    centerState: {
      minHeight: 180,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.scaleSpace(spacing.lg),
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(13),
      textAlign: "center",
    },
    emptyText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      textAlign: "center",
    },
    listWrap: {
      gap: theme.scaleSpace(spacing.xs),
    },
    itemCard: {
      paddingHorizontal: theme.scaleSpace(spacing.sm),
      paddingVertical: theme.scaleSpace(spacing.xs),
    },
    lastCard: {
      marginBottom: theme.scaleSpace(spacing.sm),
    },
    itemCardWarning: {
      borderColor: theme.colors.warning,
      backgroundColor: theme.isDarkMode ? "rgba(244, 193, 93, 0.12)" : "rgba(245, 158, 11, 0.07)",
    },
    itemCardCritical: {
      borderColor: theme.colors.destructive,
      backgroundColor: theme.isDarkMode ? "rgba(255, 107, 107, 0.12)" : "rgba(228, 71, 71, 0.08)",
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
    },
    itemIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    itemBody: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterBold",
    },
    itemSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
    },
    itemTime: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      fontFamily: "InterMedium",
    },
    timeWarning: {
      color: theme.colors.warning,
    },
    timeCritical: {
      color: theme.colors.destructive,
    },
    itemRight: {
      alignItems: "flex-end",
      gap: 4,
    },
    itemAmount: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterBold",
    },
    amountWarning: {
      color: theme.colors.warning,
    },
    amountCritical: {
      color: theme.colors.destructive,
    },
  });
