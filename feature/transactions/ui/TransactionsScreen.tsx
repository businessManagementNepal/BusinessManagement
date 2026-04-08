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
  Filter,
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
};

const FILTER_OPTIONS = [
  { label: "All", value: TransactionListFilter.All },
  { label: "Income", value: TransactionListFilter.Income },
  { label: "Expense", value: TransactionListFilter.Expense },
  { label: "Transfer", value: TransactionListFilter.Transfer },
] as const;

export function TransactionsScreen({
  listViewModel,
  editorViewModel,
  deleteViewModel,
}: TransactionsScreenProps) {
  return (
    <>
      <ScreenContainer
        showDivider={false}
        padded={true}
        contentContainerStyle={styles.content}
        baseBottomPadding={170}
        footer={
          <View style={styles.footer}>
            <View style={styles.actionRow}>
              <AppButton
                label="Income"
                variant="primary"
                size="lg"
                style={styles.actionButton}
                leadingIcon={<ArrowDownLeft size={18} color={colors.primaryForeground} />}
                onPress={() => listViewModel.onOpenCreate(TransactionType.Income)}
              />
              <AppButton
                label="Expense"
                variant="primary"
                size="lg"
                style={[styles.actionButton, styles.expenseButton]}
                leadingIcon={<ArrowUpRight size={18} color={colors.primaryForeground} />}
                onPress={() => listViewModel.onOpenCreate(TransactionType.Expense)}
              />
              <AppButton
                label="Transfer"
                variant="primary"
                size="lg"
                style={styles.actionButton}
                leadingIcon={<ArrowLeftRight size={18} color={colors.primaryForeground} />}
                onPress={() => listViewModel.onOpenCreate(TransactionType.Transfer)}
              />
            </View>
          </View>
        }
      >
        <View style={styles.summaryRow}>
          {listViewModel.summaryCards.map((summaryCard) => {
            const isIncome = summaryCard.tone === "income";

            return (
              <Card key={summaryCard.id} style={styles.summaryCard}>
                <View
                  style={[
                    styles.summaryIconWrap,
                    isIncome ? styles.incomeIconWrap : styles.expenseIconWrap,
                  ]}
                >
                  {isIncome ? (
                    <ArrowDownLeft size={18} color={colors.success} />
                  ) : (
                    <ArrowUpRight size={18} color={colors.destructive} />
                  )}
                </View>

                <View style={styles.summaryTextWrap}>
                  <Text style={styles.summaryLabel}>{summaryCard.label}</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      isIncome ? styles.incomeValue : styles.expenseValue,
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
              placeholder="Search transactions..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.filterButtonWrap}>
            <Filter size={18} color={colors.mutedForeground} />
          </View>
        </View>

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
                  <ArrowLeftRight size={20} color={colors.primary} />
                ) : transactionItem.tone === "income" ? (
                  <ArrowDownLeft size={20} color={colors.success} />
                ) : (
                  <ArrowUpRight size={20} color={colors.destructive} />
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
                    onPress={() => listViewModel.onOpenEdit(transactionItem.remoteId)}
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
                      <Text style={styles.transactionSubtitle}>{transactionItem.subtitle}</Text>
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

                  <View style={styles.transactionActions}>
                    <Pressable
                      style={styles.rowActionButton}
                      onPress={() => listViewModel.onOpenEdit(transactionItem.remoteId)}
                    >
                      <Pencil size={16} color={colors.mutedForeground} />
                    </Pressable>
                    <Pressable
                      style={styles.rowActionButton}
                      onPress={() => deleteViewModel.openDelete(transactionItem.remoteId)}
                    >
                      <Trash2 size={16} color={colors.destructive} />
                    </Pressable>
                  </View>
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
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  summaryIconWrap: {
    width: 42,
    height: 42,
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
  summaryTextWrap: {
    flex: 1,
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: "InterBold",
  },
  incomeValue: {
    color: colors.success,
  },
  expenseValue: {
    color: colors.destructive,
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
  filterButtonWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 12,
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
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
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
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionBody: {
    flex: 1,
  },
  transactionTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  transactionSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: "InterBold",
  },
  transactionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.xs,
  },
  rowActionButton: {
    width: 34,
    height: 34,
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
