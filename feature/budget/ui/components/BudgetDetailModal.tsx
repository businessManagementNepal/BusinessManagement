import { BudgetViewModel } from "@/feature/budget/viewModel/budget.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { Pill } from "@/shared/components/reusable/List/Pill";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BudgetDetailModalProps = {
  viewModel: BudgetViewModel;
};

export function BudgetDetailModal({
  viewModel,
}: BudgetDetailModalProps) {
  const styles = useThemedStyles(createStyles);
  const detailState = viewModel.detailState;

  return (
    <FormSheetModal
      visible={viewModel.isDetailVisible}
      title={detailState?.title ?? "Budget Detail"}
      subtitle={detailState?.subtitle ?? undefined}
      onClose={viewModel.onCloseDetail}
      closeAccessibilityLabel="Close budget detail"
      contentContainerStyle={styles.content}
      presentation="dialog"
    >
      {detailState ? (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Pill
              label={detailState.statusLabel}
              tone={detailState.statusLabel === "Over budget" ? "danger" : "success"}
            />
          </View>

          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Planned</Text>
              <Text style={styles.summaryValue}>{detailState.plannedAmountLabel}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={styles.summaryValue}>{detailState.spentAmountLabel}</Text>
            </Card>
          </View>

          <Card style={styles.noteCard}>
            <Text style={styles.noteTitle}>
              {detailState.statusLabel === "Over budget" ? "Over by" : "Left"}
            </Text>
            <Text
              style={[
                styles.noteValue,
                detailState.statusLabel === "Over budget"
                  ? styles.overValue
                  : styles.leftValue,
              ]}
            >
              {detailState.remainingAmountLabel}
            </Text>
            {detailState.noteLabel ? (
              <Text style={styles.noteText}>{detailState.noteLabel}</Text>
            ) : null}
          </Card>

          <View style={styles.actionRow}>
            <AppButton
              label="Delete"
              variant="secondary"
              size="lg"
              style={styles.actionButton}
              onPress={viewModel.onRequestDeleteBudget}
            />
            <AppButton
              label="Edit"
              variant="primary"
              size="lg"
              style={styles.actionButton}
              onPress={() => void viewModel.onEditFromDetail()}
            />
          </View>
        </>
      ) : null}
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
      paddingBottom: theme.scaleSpace(spacing.xl),
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterBold",
    },
    summaryGrid: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    summaryCard: {
      flex: 1,
      paddingVertical: theme.scaleSpace(spacing.md),
    },
    summaryLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      marginBottom: theme.scaleSpace(4),
    },
    summaryValue: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(18),
      lineHeight: theme.scaleLineHeight(22),
      fontFamily: "InterBold",
    },
    noteCard: {
      gap: theme.scaleSpace(4),
    },
    noteTitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterBold",
    },
    noteValue: {
      fontSize: theme.scaleText(20),
      lineHeight: theme.scaleLineHeight(24),
      fontFamily: "InterBold",
    },
    overValue: {
      color: theme.colors.destructive,
    },
    leftValue: {
      color: theme.colors.success,
    },
    noteText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(18),
      marginTop: theme.scaleSpace(4),
    },
    actionRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
      marginTop: theme.scaleSpace(spacing.xs),
    },
    actionButton: {
      flex: 1,
    },
  });
