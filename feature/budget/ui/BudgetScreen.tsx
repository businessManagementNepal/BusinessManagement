import { BudgetEditorModal } from "@/feature/budget/ui/components/BudgetEditorModal";
import { BudgetDetailModal } from "@/feature/budget/ui/components/BudgetDetailModal";
import {
  BudgetListFilter,
  BudgetViewModel,
} from "@/feature/budget/viewModel/budget.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { SearchInputRow } from "@/shared/components/reusable/Form/SearchInputRow";
import { BottomTabAwareFooter } from "@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter";
import { useToastMessage } from "@/shared/components/reusable/Feedback/useToastMessage";
import { InlineSectionHeader } from "@/shared/components/reusable/ScreenLayouts/InlineSectionHeader";
import { ConfirmDeleteModal } from "@/shared/components/reusable/Modals/ConfirmDeleteModal";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { useFocusEffect } from "@react-navigation/native";
import { CalendarClock, CircleAlert, PiggyBank, Plus } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type BudgetScreenProps = {
  viewModel: BudgetViewModel;
};

const FILTER_OPTIONS = [
  { label: "All", value: BudgetListFilter.All },
  { label: "This Month", value: BudgetListFilter.ThisMonth },
  { label: "Overspent", value: BudgetListFilter.Overspent },
] as const;

export function BudgetScreen({ viewModel }: BudgetScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  useToastMessage({
    message: viewModel.successMessage,
    type: "success",
  });

  const summaryById = React.useMemo(
    () => new Map(viewModel.summaryCards.map((summaryCard) => [summaryCard.id, summaryCard])),
    [viewModel.summaryCards],
  );

  const plannedSummary = summaryById.get("planned");
  const spentSummary = summaryById.get("spent");
  const remainingSummary = summaryById.get("remaining");
  const shouldShowAlertBanner = viewModel.summaryCards.some(
    (summaryCard) => summaryCard.id === "spent" && summaryCard.tone === "alert",
  );
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const didSkipInitialFocusRefreshRef = React.useRef(false);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await viewModel.onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [viewModel.onRefresh]);

  useFocusEffect(
    React.useCallback(() => {
      if (!didSkipInitialFocusRefreshRef.current) {
        didSkipInitialFocusRefreshRef.current = true;
        return undefined;
      }

      void viewModel.onRefresh();
      return undefined;
    }, [viewModel.onRefresh]),
  );

  return (
    <>
      <ScreenContainer
        showDivider={false}
        padded={true}
        contentContainerStyle={styles.content}
        baseBottomPadding={140}
        scrollProps={{
          refreshControl: (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          ),
        }}
        footer={
          <BottomTabAwareFooter>
            <AppButton
              label="Create New Budget"
              variant="secondary"
              size="lg"
              style={styles.createBudgetButton}
              labelStyle={styles.createBudgetLabel}
              leadingIcon={<Plus size={18} color={theme.colors.primary} />}
              onPress={viewModel.onOpenCreate}
              disabled={!viewModel.canCreate}
            />
          </BottomTabAwareFooter>
        }
      >
        {shouldShowAlertBanner ? (
          <View style={styles.alertCard}>
            <CircleAlert size={20} color={theme.colors.destructive} />
            <View style={styles.alertTextWrap}>
              <Text style={styles.alertTitle}>Budget Alert</Text>
              <Text style={styles.alertSubtitle}>
                Spending is above plan for one or more categories this month.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {plannedSummary?.label ?? "This Month Planned"}
            </Text>
            <Text style={styles.summaryValue}>
              {plannedSummary?.value ?? "--"}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {spentSummary?.label ?? "Spent This Month"}
            </Text>
            <Text
              style={[
                styles.summaryValue,
                spentSummary?.tone === "alert" ? styles.alertValue : null,
              ]}
            >
              {spentSummary?.value ?? "--"}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {remainingSummary?.label ?? "Left This Month"}
            </Text>
            <Text
              style={[
                styles.summaryValue,
                remainingSummary?.tone === "alert"
                  ? styles.alertValue
                  : null,
                remainingSummary?.tone === "success"
                  ? styles.leftValue
                  : null,
              ]}
            >
              {remainingSummary?.value ?? "--"}
            </Text>
          </View>
        </View>

        <SearchInputRow
          value={viewModel.searchQuery}
          onChangeText={viewModel.onChangeSearchQuery}
          placeholder="Search budget by category or month"
          inputStyle={styles.searchInput}
        />

        <FilterChipGroup
          options={FILTER_OPTIONS}
          selectedValue={viewModel.selectedFilter}
          onSelect={viewModel.onChangeFilter}
        />

        <InlineSectionHeader
          title={`Budget Categories - ${viewModel.monthLabel}`}
          actionLabel="Reset"
          onActionPress={() => {
            viewModel.onChangeSearchQuery("");
            viewModel.onChangeFilter(BudgetListFilter.All);
          }}
        />

        {viewModel.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : viewModel.errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
          </View>
        ) : viewModel.budgetItems.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>{viewModel.emptyStateMessage}</Text>
            {viewModel.emptyStateActionLabel ? (
              <AppButton
                label={viewModel.emptyStateActionLabel}
                variant="primary"
                size="md"
                style={styles.emptyStateActionButton}
                onPress={viewModel.onPressEmptyStateAction}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.planListWrap}>
            {viewModel.budgetItems.map((budgetItem) => (
              <Pressable
                key={budgetItem.remoteId}
                onPress={() => void viewModel.onOpenDetail(budgetItem.remoteId)}
                style={styles.planCard}
              >
                <View style={styles.planTopRow}>
                  <View style={styles.planIconWrap}>
                    <PiggyBank size={18} color={theme.colors.primary} />
                  </View>

                  <View style={styles.planTextWrap}>
                    <Text style={styles.planTitle}>{budgetItem.title}</Text>
                    <Text style={styles.planSubtitle}>{budgetItem.subtitle}</Text>
                  </View>

                  <View
                    style={[
                      styles.planStatusBadge,
                      budgetItem.isOverspent
                        ? styles.planStatusAlert
                        : styles.planStatusActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.planStatusText,
                        budgetItem.isOverspent
                          ? styles.planStatusTextAlert
                          : styles.planStatusTextActive,
                      ]}
                    >
                      {budgetItem.statusLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressMetaRow}>
                  <Text style={styles.progressMeta}>
                    Spent: {budgetItem.spentAmountLabel}
                  </Text>
                  <Text style={styles.progressMeta}>
                    Budget: {budgetItem.plannedAmountLabel}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      budgetItem.isOverspent ? styles.progressFillAlert : null,
                      { width: `${budgetItem.progressPercent}%` },
                    ]}
                  />
                </View>

                <View style={styles.nextDueRow}>
                  <View style={styles.nextDueTextWrap}>
                    <CalendarClock size={12} color={theme.colors.mutedForeground} />
                    <Text style={styles.nextDueLabel}>{budgetItem.monthLabel}</Text>
                  </View>
                  <Text
                    style={[
                      styles.nextDueAmount,
                      budgetItem.isOverspent ? styles.alertValue : styles.leftValue,
                    ]}
                  >
                    {budgetItem.isOverspent ? "Over: " : "Left: "}
                    {budgetItem.remainingAmountLabel}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScreenContainer>

      <BudgetEditorModal viewModel={viewModel} />
      <BudgetDetailModal viewModel={viewModel} />
      <ConfirmDeleteModal
        visible={viewModel.deleteConfirmationVisible}
        title="Delete Budget"
        message={
          viewModel.detailState
            ? `Delete the ${viewModel.detailState.title} budget for ${viewModel.detailState.subtitle}?`
            : "Delete this budget?"
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDeleting={viewModel.isDeleting}
        errorMessage={viewModel.deleteErrorMessage}
        onCancel={viewModel.onCancelDeleteBudget}
        onConfirm={() => void viewModel.onConfirmDeleteBudget()}
      />
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
    },
    createBudgetButton: {
      width: "100%",
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: theme.isDarkMode
        ? "rgba(128, 201, 159, 0.35)"
        : "rgba(31, 99, 64, 0.35)",
      backgroundColor: theme.colors.background,
    },
    createBudgetLabel: {
      color: theme.colors.primary,
    },
    alertCard: {
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: theme.isDarkMode
        ? "rgba(255, 107, 107, 0.3)"
        : "#F1B8B8",
      backgroundColor: theme.isDarkMode
        ? "rgba(255, 107, 107, 0.12)"
        : "#FFF2F2",
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
      alignItems: "flex-start",
    },
    alertTextWrap: {
      flex: 1,
      gap: theme.scaleSpace(4),
    },
    alertTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      lineHeight: theme.scaleLineHeight(19),
      fontFamily: "InterBold",
    },
    alertSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(18),
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.scaleSpace(spacing.sm),
    },
    summaryCard: {
      flex: 1,
      minWidth: theme.scaleSpace(104),
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(6),
    },
    summaryLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
    },
    summaryValue: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(20),
      lineHeight: theme.scaleLineHeight(24),
      fontFamily: "InterBold",
    },
    alertValue: {
      color: theme.colors.destructive,
    },
    leftValue: {
      color: theme.colors.success,
    },
    searchInput: {
      minHeight: theme.scaleSpace(52),
    },
    centerState: {
      minHeight: theme.scaleSpace(160),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      gap: theme.scaleSpace(spacing.md),
    },
    emptyStateActionButton: {
      minWidth: theme.scaleSpace(220),
    },
    errorText: {
      color: theme.colors.destructive,
      textAlign: "center",
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(19),
      fontFamily: "InterSemiBold",
    },
    emptyText: {
      color: theme.colors.mutedForeground,
      textAlign: "center",
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(19),
      fontFamily: "InterMedium",
    },
    planListWrap: {
      gap: theme.scaleSpace(spacing.sm),
    },
    planCard: {
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: theme.isDarkMode ? theme.colors.border : "#C9E1D3",
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.sm),
    },
    planTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
    },
    planIconWrap: {
      width: theme.scaleSpace(44),
      height: theme.scaleSpace(44),
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.accent,
    },
    planTextWrap: {
      flex: 1,
      gap: theme.scaleSpace(2),
    },
    planTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(16),
      lineHeight: theme.scaleLineHeight(20),
      fontFamily: "InterBold",
    },
    planSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(18),
    },
    planStatusBadge: {
      paddingHorizontal: theme.scaleSpace(10),
      paddingVertical: theme.scaleSpace(4),
      borderRadius: radius.pill,
    },
    planStatusActive: {
      backgroundColor: theme.isDarkMode
        ? "rgba(99, 211, 148, 0.16)"
        : "#E7F5ED",
    },
    planStatusAlert: {
      backgroundColor: theme.isDarkMode
        ? "rgba(255, 107, 107, 0.16)"
        : "#FBE4E4",
    },
    planStatusText: {
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterBold",
    },
    planStatusTextActive: {
      color: theme.colors.success,
    },
    planStatusTextAlert: {
      color: theme.colors.destructive,
    },
    progressMetaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    progressMeta: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    progressTrack: {
      height: theme.scaleSpace(8),
      borderRadius: radius.pill,
      backgroundColor: theme.colors.border,
      overflow: "hidden",
    },
    progressFill: {
      height: theme.scaleSpace(8),
      borderRadius: radius.pill,
      backgroundColor: theme.colors.primary,
    },
    progressFillAlert: {
      backgroundColor: theme.colors.destructive,
    },
    nextDueRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    nextDueTextWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(6),
    },
    nextDueLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    nextDueAmount: {
      fontSize: theme.scaleText(16),
      lineHeight: theme.scaleLineHeight(20),
      fontFamily: "InterBold",
    },
  });

