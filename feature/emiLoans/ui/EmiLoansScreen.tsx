import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BellRing,
  ChevronRight,
  CircleAlert,
  HandCoins,
  Landmark,
  Search,
  Wallet,
} from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { EmiListFilter } from "@/feature/emiLoans/types/emi.state.types";
import { EmiListViewModel } from "@/feature/emiLoans/viewModel/emiList.viewModel";
import { EmiPlanEditorViewModel } from "@/feature/emiLoans/viewModel/emiPlanEditor.viewModel";
import { EmiPlanDetailViewModel } from "@/feature/emiLoans/viewModel/emiPlanDetail.viewModel";
import { EmiPlanEditorModal } from "./components/EmiPlanEditorModal";
import { EmiPlanDetailModal } from "./components/EmiPlanDetailModal";

type EmiLoansScreenProps = {
  listViewModel: EmiListViewModel;
  editorViewModel: EmiPlanEditorViewModel;
  detailViewModel: EmiPlanDetailViewModel;
};

export function EmiLoansScreen({
  listViewModel,
  editorViewModel,
  detailViewModel,
}: EmiLoansScreenProps) {
  const filterOptions =
    listViewModel.planMode === "business"
      ? [
          { label: "All", value: EmiListFilter.All },
          { label: "Collect", value: EmiListFilter.Collect },
          { label: "Pay", value: EmiListFilter.Pay },
          { label: "Overdue", value: EmiListFilter.Overdue },
          { label: "Closed", value: EmiListFilter.Closed },
        ]
      : [
          { label: "All", value: EmiListFilter.All },
          { label: "Active", value: EmiListFilter.Active },
          { label: "Due", value: EmiListFilter.Due },
          { label: "Overdue", value: EmiListFilter.Overdue },
          { label: "Closed", value: EmiListFilter.Closed },
        ];

  return (
    <>
      <ScreenContainer
        showDivider={false}
        padded={true}
        contentContainerStyle={styles.content}
        baseBottomPadding={134}
        footer={
          <View style={styles.footer}>
            <AppButton
              label={listViewModel.primaryActionLabel}
              variant="primary"
              size="lg"
              style={styles.primaryActionButton}
              onPress={listViewModel.onOpenCreate}
            />
          </View>
        }
      >
        <View style={styles.heroCardWrap}>
          <Card style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              {listViewModel.planMode === "business" ? (
                <Landmark size={18} color={colors.primary} />
              ) : (
                <Wallet size={18} color={colors.primary} />
              )}
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>{listViewModel.title}</Text>
              <Text style={styles.heroSubtitle}>{listViewModel.subtitle}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.summaryGrid}>
          {listViewModel.summaryCards.map((summaryCard) => {
            const icon =
              summaryCard.id === "overdue" ? (
                <CircleAlert size={18} color={colors.warning} />
              ) : summaryCard.tone === "collect" ? (
                <HandCoins size={18} color={colors.success} />
              ) : summaryCard.tone === "pay" ? (
                <Wallet size={18} color={colors.destructive} />
              ) : (
                <BellRing size={18} color={colors.primary} />
              );

            return (
              <Card key={summaryCard.id} style={styles.summaryCard}>
                <View style={styles.summaryIconWrap}>{icon}</View>
                <Text style={styles.summaryLabel}>{summaryCard.label}</Text>
                <Text style={styles.summaryValue}>{summaryCard.value}</Text>
              </Card>
            );
          })}
        </View>

        <View style={styles.searchWrap}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            value={listViewModel.searchQuery}
            onChangeText={listViewModel.onChangeSearchQuery}
            placeholder={
              listViewModel.planMode === "business"
                ? "Search plans or party name"
                : "Search plans"
            }
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterRow}>
          {filterOptions.map((filterOption) => {
            const isSelected = filterOption.value === listViewModel.selectedFilter;

            return (
              <Pressable
                key={filterOption.value}
                style={[
                  styles.filterChip,
                  isSelected ? styles.filterChipSelected : null,
                ]}
                onPress={() => listViewModel.onChangeFilter(filterOption.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected ? styles.filterChipTextSelected : null,
                  ]}
                >
                  {filterOption.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {listViewModel.planMode === "business"
              ? "Installment Plans"
              : "My EMI and Loan Plans"}
          </Text>
          <Pressable onPress={() => void listViewModel.refresh()}>
            <Text style={styles.refreshLabel}>Refresh</Text>
          </Pressable>
        </View>

        {listViewModel.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : listViewModel.errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{listViewModel.errorMessage}</Text>
          </View>
        ) : listViewModel.planItems.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>{listViewModel.emptyStateMessage}</Text>
          </View>
        ) : (
          listViewModel.planItems.map((planItem) => (
            <Pressable
              key={planItem.remoteId}
              onPress={() => void listViewModel.onOpenDetail(planItem.remoteId)}
            >
              <Card style={styles.planCard}>
                <View style={styles.planTopRow}>
                  <View
                    style={[
                      styles.planIconWrap,
                      planItem.tone === "collect"
                        ? styles.collectIconWrap
                        : styles.payIconWrap,
                    ]}
                  >
                    {planItem.tone === "collect" ? (
                      <HandCoins size={18} color={colors.success} />
                    ) : (
                      <Wallet size={18} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.planTextWrap}>
                    <Text style={styles.planTitle}>{planItem.title}</Text>
                    <Text style={styles.planSubtitle}>{planItem.subtitle}</Text>
                    <View style={styles.badgeWrap}>
                      <Text
                        style={[
                          styles.badgeText,
                          planItem.isOverdue ? styles.overdueBadgeText : null,
                        ]}
                      >
                        {planItem.badgeLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planAmountWrap}>
                    <Text style={styles.planAmount}>{planItem.amountLabel}</Text>
                    <Text style={styles.planProgress}>{planItem.progressLabel}</Text>
                  </View>

                  <ChevronRight size={18} color={colors.mutedForeground} />
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScreenContainer>

      <EmiPlanEditorModal viewModel={editorViewModel} />
      <EmiPlanDetailModal viewModel={detailViewModel} />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  primaryActionButton: {
    width: "100%",
  },
  heroCardWrap: {
    marginTop: spacing.xs,
  },
  heroCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  heroSubtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryCard: {
    width: "48%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 6,
  },
  summaryValue: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  filterChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.foreground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  filterChipTextSelected: {
    color: colors.primaryForeground,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  refreshLabel: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  centerState: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: "center",
  },
  planCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  planIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  collectIconWrap: {
    backgroundColor: colors.accent,
  },
  payIconWrap: {
    backgroundColor: colors.secondary,
  },
  planTextWrap: {
    flex: 1,
    gap: 4,
  },
  planTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  planSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  badgeWrap: {
    alignSelf: "flex-start",
    marginTop: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: "InterBold",
  },
  overdueBadgeText: {
    color: colors.destructive,
  },
  planAmountWrap: {
    alignItems: "flex-end",
    gap: 4,
  },
  planAmount: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  planProgress: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
});
