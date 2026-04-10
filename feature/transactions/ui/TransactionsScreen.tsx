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
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { TransactionType } from "@/feature/transactions/types/transaction.entity.types";
import { TransactionListFilter } from "@/feature/transactions/types/transaction.state.types";
import { TransactionsListViewModel } from "@/feature/transactions/viewModel/transactionsList.viewModel";
import { TransactionEditorViewModel } from "@/feature/transactions/viewModel/transactionEditor.viewModel";
import { TransactionDeleteViewModel } from "@/feature/transactions/viewModel/transactionDelete.viewModel";
import { TransactionDeleteModal } from "./components/TransactionDeleteModal";
import { TransactionEditorModal } from "./components/TransactionEditorModal";

type TransactionsScreenProps = {
  listViewModel: TransactionsListViewModel;
  editorViewModel: TransactionEditorViewModel;
  deleteViewModel: TransactionDeleteViewModel;
  canManage: boolean;
};

const FILTER_OPTIONS = [
  { label: "All Types", value: TransactionListFilter.All },
  { label: "Income", value: TransactionListFilter.Income },
  { label: "Expense", value: TransactionListFilter.Expense },
  { label: "Transfer", value: TransactionListFilter.Transfer },
] as const;

export function TransactionsScreen({
  listViewModel,
  editorViewModel,
  deleteViewModel,
  canManage,
}: TransactionsScreenProps) {
  return (
    <>
      <ScreenContainer
        showDivider={false}
        padded={true}
        contentContainerStyle={styles.content}
        baseBottomPadding={170}
        footer={
          canManage ? (
            <View style={styles.footer}>
              <View style={styles.actionRow}>
                <AppButton
                  label="Income"
                  variant="primary"
                  size="lg"
                  style={styles.actionButton}
                  leadingIcon={
                    <ArrowDownLeft size={18} color={colors.primaryForeground} />
                  }
                  onPress={() => listViewModel.onOpenCreate(TransactionType.Income)}
                />
                <AppButton
                  label="Expense"
                  variant="primary"
                  size="lg"
                  style={[styles.actionButton, styles.expenseButton]}
                  leadingIcon={
                    <ArrowUpRight size={18} color={colors.primaryForeground} />
                  }
                  onPress={() => listViewModel.onOpenCreate(TransactionType.Expense)}
                />
                <AppButton
                  label="Transfer"
                  variant="primary"
                  size="lg"
                  style={styles.actionButton}
                  leadingIcon={
                    <ArrowLeftRight size={18} color={colors.primaryForeground} />
                  }
                  onPress={() => listViewModel.onOpenCreate(TransactionType.Transfer)}
                />
              </View>
            </View>
          ) : null
        }
      >
        <View style={styles.summaryRow}>
          {listViewModel.summaryCards.map((summaryCard) => {
            const isIncome = summaryCard.tone === "income";
            const isExpense = summaryCard.tone === "expense";
            const isNet = summaryCard.tone === "neutral";

            return (
              <Card
                key={summaryCard.id}
                style={[styles.summaryCard, isNet ? styles.summaryCardWide : null]}
              >
                <View
                  style={[
                    styles.summaryIconWrap,
                    isIncome
                      ? styles.incomeIconWrap
                      : isExpense
                        ? styles.expenseIconWrap
                        : styles.neutralIconWrap,
                  ]}
                >
                  {isIncome ? (
                    <ArrowDownLeft size={16} color={colors.success} />
                  ) : isExpense ? (
                    <ArrowUpRight size={16} color={colors.destructive} />
                  ) : (
                    <ArrowLeftRight size={16} color={colors.primary} />
                  )}
                </View>

                <View style={styles.summaryTextWrap}>
                  <Text style={styles.summaryLabel}>{summaryCard.label}</Text>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                    style={[
                      styles.summaryValue,
                      isIncome
                        ? styles.incomeValue
                        : isExpense
                          ? styles.expenseValue
                          : styles.neutralValue,
                    ]}
                  >
                    {summaryCard.value}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <TextInput
              value={listViewModel.searchQuery}
              onChangeText={listViewModel.onChangeSearchQuery}
              placeholder="Search party, note, source..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>
        </View>

        <Text style={styles.filterLabel}>Type</Text>
        <FilterChipGroup
          options={FILTER_OPTIONS}
          selectedValue={listViewModel.selectedFilter}
          onSelect={listViewModel.onChangeFilter}
          scrollStyle={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
          chipStyle={styles.filterChip}
          selectedChipStyle={styles.filterChipSelected}
          chipTextStyle={styles.filterChipText}
          selectedChipTextStyle={styles.filterChipTextSelected}
        />

        {listViewModel.errorMessage ? (
          <Card style={styles.messageCard}>
            <Text style={styles.errorText}>{listViewModel.errorMessage}</Text>
          </Card>
        ) : null}

        {listViewModel.isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : listViewModel.transactionItems.length === 0 ? (
          <Card style={styles.messageCard}>
            <Text style={styles.emptyText}>{listViewModel.emptyStateMessage}</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {listViewModel.transactionItems.map((transactionItem, index) => {
              const icon =
                transactionItem.transactionType === TransactionType.Transfer ? (
                  <ArrowLeftRight size={16} color={colors.primary} />
                ) : transactionItem.tone === "income" ? (
                  <ArrowDownLeft size={16} color={colors.success} />
                ) : (
                  <ArrowUpRight size={16} color={colors.destructive} />
                );

              return (
                <View
                  key={transactionItem.remoteId}
                  style={[
                    styles.transactionRow,
                    index === listViewModel.transactionItems.length - 1
                      ? styles.transactionRowLast
                      : null,
                  ]}
                >
                  <Pressable
                    style={styles.transactionMainPressable}
                    onPress={
                      canManage
                        ? () => listViewModel.onOpenEdit(transactionItem.remoteId)
                        : undefined
                    }
                    disabled={!canManage}
                  >
                    <View
                      style={[
                        styles.transactionIconWrap,
                        transactionItem.tone === "income"
                          ? styles.incomeIconWrap
                          : styles.expenseIconWrap,
                      ]}
                    >
                      {icon}
                    </View>

                    <View style={styles.transactionBody}>
                      <Text style={styles.transactionTitle}>{transactionItem.title}</Text>
                      {transactionItem.partyLabel ? (
                        <Text style={styles.partyLabel}>
                          Party: {transactionItem.partyLabel}
                        </Text>
                      ) : null}
                      <Text style={styles.transactionSubtitle}>
                        {transactionItem.subtitle}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.transactionAmount,
                        transactionItem.tone === "income"
                          ? styles.incomeValue
                          : styles.expenseValue,
                      ]}
                    >
                      {transactionItem.amountLabel}
                    </Text>
                  </Pressable>

                  <View style={styles.metaRow}>
                    {transactionItem.metaChips.map((chip) => (
                      <View
                        key={`${transactionItem.remoteId}-${chip.label}`}
                        style={[
                          styles.metaChip,
                          chip.tone === "success"
                            ? styles.metaChipSuccess
                            : chip.tone === "danger"
                              ? styles.metaChipDanger
                              : chip.tone === "warning"
                                ? styles.metaChipWarning
                                : styles.metaChipNeutral,
                        ]}
                      >
                        <Text
                          style={[
                            styles.metaChipText,
                            chip.tone === "success"
                              ? styles.metaChipTextSuccess
                              : chip.tone === "danger"
                                ? styles.metaChipTextDanger
                                : chip.tone === "warning"
                                  ? styles.metaChipTextWarning
                                  : styles.metaChipTextNeutral,
                          ]}
                        >
                          {chip.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {canManage ? (
                    <View style={styles.transactionActions}>
                      <Pressable
                        style={styles.rowActionButton}
                        onPress={() => listViewModel.onOpenEdit(transactionItem.remoteId)}
                      >
                        <Pencil size={16} color={colors.mutedForeground} />
                      </Pressable>
                      <Pressable
                        style={styles.rowActionButton}
                        onPress={() =>
                          deleteViewModel.openDelete(transactionItem.remoteId)
                        }
                      >
                        <Trash2 size={16} color={colors.destructive} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        )}
      </ScreenContainer>

      <TransactionEditorModal viewModel={editorViewModel} />
      <TransactionDeleteModal viewModel={deleteViewModel} />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryCard: {
    width: "48.2%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 74,
  },
  summaryCardWide: {
    width: "100%",
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  incomeIconWrap: {
    backgroundColor: "#E4F4EA",
  },
  expenseIconWrap: {
    backgroundColor: "#FBE4E4",
  },
  neutralIconWrap: {
    backgroundColor: colors.accent,
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "InterBold",
  },
  incomeValue: {
    color: colors.success,
  },
  expenseValue: {
    color: colors.destructive,
  },
  neutralValue: {
    color: colors.primary,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  searchInputWrap: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  searchInput: {
    color: colors.cardForeground,
    fontSize: 14,
  },
  filterLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRow: {
    paddingRight: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.cardForeground,
    fontSize: 11,
    fontFamily: "InterBold",
  },
  filterChipTextSelected: {
    color: colors.primaryForeground,
  },
  loaderWrap: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  messageCard: {
    paddingVertical: spacing.lg,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 20,
  },
  listCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
  },
  transactionRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  transactionRowLast: {
    borderBottomWidth: 0,
  },
  transactionMainPressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  transactionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionBody: {
    flex: 1,
    gap: 2,
  },
  transactionTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  partyLabel: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: "InterSemiBold",
  },
  transactionSubtitle: {
    color: colors.mutedForeground,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginLeft: 46,
    marginTop: 2,
  },
  metaChip: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaChipNeutral: {
    backgroundColor: colors.muted,
  },
  metaChipSuccess: {
    backgroundColor: "#E4F4EA",
  },
  metaChipWarning: {
    backgroundColor: "#FFF2D7",
  },
  metaChipDanger: {
    backgroundColor: "#FBE4E4",
  },
  metaChipText: {
    fontSize: 10,
    fontFamily: "InterSemiBold",
  },
  metaChipTextNeutral: {
    color: colors.cardForeground,
  },
  metaChipTextSuccess: {
    color: colors.success,
  },
  metaChipTextWarning: {
    color: colors.warning,
  },
  metaChipTextDanger: {
    color: colors.destructive,
  },
  transactionAmount: {
    fontSize: 14,
    fontFamily: "InterBold",
    minWidth: 90,
    textAlign: "right",
  },
  transactionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.xs,
  },
  rowActionButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 95,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  expenseButton: {
    backgroundColor: colors.destructive,
  },
});
