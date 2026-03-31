import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  AlertCircle,
  ArrowLeftRight,
  Package,
  ReceiptText,
  Users,
} from "lucide-react-native";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { DirectionArrowIcon } from "@/shared/components/reusable/Icons/DirectionArrowIcon";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { BusinessDashboardViewModel } from "../viewModel/businessDashboard.viewModel";

type BusinessDashboardScreenProps = {
  viewModel: BusinessDashboardViewModel;
};

export function BusinessDashboardScreen({
  viewModel,
}: BusinessDashboardScreenProps) {
  return (
    <ScreenContainer
      showDivider={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.summaryRow}>
        {viewModel.summaryCards.map((summaryCard) => {
          const isReceive = summaryCard.tone === "receive";
          const toneColor = isReceive ? colors.success : colors.destructive;

          return (
            <Card key={summaryCard.id} style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIconWrap,
                  isReceive
                    ? styles.summaryIconWrapReceive
                    : styles.summaryIconWrapPay,
                ]}
              >
                {isReceive ? (
                  <DirectionArrowIcon
                    variant="trend-receive"
                    size={14}
                    color={colors.success}
                    strokeWidth={2.2}
                  />
                ) : (
                  <DirectionArrowIcon
                    variant="trend-pay"
                    size={14}
                    color={colors.destructive}
                    strokeWidth={2.2}
                  />
                )}
              </View>
              <Text style={styles.summaryLabel}>{summaryCard.title}</Text>
              <Text style={[styles.summaryValue, { color: toneColor }]}>
                {summaryCard.value}
              </Text>
            </Card>
          );
        })}
      </View>

      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <DirectionArrowIcon
            variant="corner-receive"
            size={16}
            color={colors.success}
          />
          <Text style={styles.statValue}>NPR 12,500</Text>
          <Text style={styles.statLabel}>Today In</Text>
        </Card>
        <Card style={styles.statCard}>
          <DirectionArrowIcon
            variant="corner-pay"
            size={16}
            color={colors.destructive}
          />
          <Text style={styles.statValue}>NPR 3,200</Text>
          <Text style={styles.statLabel}>Today Out</Text>
        </Card>
        <Card style={styles.statCard}>
          <AlertCircle size={16} color={colors.warning} />
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionRow}>
        {viewModel.quickActions.map((quickAction) => {
          const icon =
            quickAction.id === "products" ? (
              <Package size={20} color={colors.primary} />
            ) : quickAction.id === "billing" ? (
              <ReceiptText size={20} color={colors.primary} />
            ) : quickAction.id === "contacts" ? (
              <Users size={20} color={colors.primary} />
            ) : (
              <ArrowLeftRight size={20} color={colors.primary} />
            );

          return (
            <Card key={quickAction.id} style={styles.quickActionCard}>
              <View style={styles.quickActionIconWrap}>{icon}</View>
              <Text style={styles.quickActionLabel}>{quickAction.label}</Text>
            </Card>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Due Today</Text>
      <Card style={styles.dueListCard}>
        {viewModel.dueItems.map((dueItem) => (
          <View key={dueItem.id} style={styles.dueRow}>
            <View style={styles.dueAvatar}>
              <Text style={styles.dueAvatarText}>{dueItem.name[0]}</Text>
            </View>

            <View style={styles.dueBody}>
              <Text style={styles.dueName}>{dueItem.name}</Text>
              <Text style={styles.dueSubtitle}>{dueItem.subtitle}</Text>
            </View>

            <View style={styles.dueAmountWrap}>
              <Text
                style={[
                  styles.dueAmount,
                  dueItem.direction === "receive"
                    ? styles.dueAmountReceive
                    : styles.dueAmountPay,
                ]}
              >
                {dueItem.amount}
              </Text>
              <View style={styles.dueDirectionWrap}>
                {dueItem.direction === "receive" ? (
                  <DirectionArrowIcon
                    variant="corner-receive"
                    size={11}
                    color={colors.success}
                  />
                ) : (
                  <DirectionArrowIcon
                    variant="corner-pay"
                    size={11}
                    color={colors.destructive}
                  />
                )}
                <Text
                  style={[
                    styles.dueDirectionLabel,
                    dueItem.direction === "receive"
                      ? styles.dueDirectionReceive
                      : styles.dueDirectionPay,
                  ]}
                >
                  {dueItem.direction === "receive" ? "To Receive" : "To Pay"}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  summaryIconWrapReceive: {
    backgroundColor: colors.accent,
  },
  summaryIconWrapPay: {
    backgroundColor: "#FDEAEA",
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: "InterBold",
  },
  statRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  statValue: {
    marginTop: 4,
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  statLabel: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontSize: 10,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.foreground,
    fontSize: 17,
    fontFamily: "InterBold",
  },
  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickActionCard: {
    width: "48%",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    color: colors.cardForeground,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  dueListCard: {
    padding: 0,
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  dueAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  dueAvatarText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  dueBody: {
    flex: 1,
  },
  dueName: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  dueSubtitle: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontSize: 11,
  },
  dueAmountWrap: {
    alignItems: "flex-end",
  },
  dueDirectionWrap: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dueAmount: {
    fontSize: 13,
    fontFamily: "InterBold",
  },
  dueAmountReceive: {
    color: colors.success,
  },
  dueAmountPay: {
    color: colors.destructive,
  },
  dueDirectionLabel: {
    fontSize: 10,
    fontFamily: "InterMedium",
  },
  dueDirectionReceive: {
    color: colors.success,
  },
  dueDirectionPay: {
    color: colors.destructive,
  },
});

