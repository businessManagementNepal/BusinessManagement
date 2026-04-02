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
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Receipt,
  RotateCcw,
  Search,
} from "lucide-react-native";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { LedgerEntryType } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerListFilter } from "@/feature/ledger/types/ledger.state.types";
import { LedgerListViewModel } from "@/feature/ledger/viewModel/ledgerList.viewModel";
import { LedgerEditorViewModel } from "@/feature/ledger/viewModel/ledgerEditor.viewModel";
import { LedgerDeleteViewModel } from "@/feature/ledger/viewModel/ledgerDelete.viewModel";
import { LedgerPartyDetailViewModel } from "@/feature/ledger/viewModel/ledgerPartyDetail.viewModel";
import { LedgerDeleteModal } from "./components/LedgerDeleteModal";
import { LedgerEntryEditorModal } from "./components/LedgerEntryEditorModal";
import { LedgerPartyDetailModal } from "./components/LedgerPartyDetailModal";

type LedgerScreenProps = {
  listViewModel: LedgerListViewModel;
  editorViewModel: LedgerEditorViewModel;
  deleteViewModel: LedgerDeleteViewModel;
  partyDetailViewModel: LedgerPartyDetailViewModel;
};

const FILTER_OPTIONS = [
  { value: LedgerListFilter.All, label: "All" },
  { value: LedgerListFilter.ToReceive, label: "To Receive" },
  { value: LedgerListFilter.ToPay, label: "To Pay" },
  { value: LedgerListFilter.DueToday, label: "Due Today" },
  { value: LedgerListFilter.Overdue, label: "Overdue" },
] as const;

export function LedgerScreen({
  listViewModel,
  editorViewModel,
  deleteViewModel,
  partyDetailViewModel,
}: LedgerScreenProps) {
  return (
    <>
      <ScreenContainer
        showDivider={false}
        padded={true}
        contentContainerStyle={styles.content}
        baseBottomPadding={188}
        footer={
          <View style={styles.footer}>
            <View style={styles.actionRow}>
              <AppButton
                label="Sale"
                variant="primary"
                size="lg"
                style={styles.actionButton}
                leadingIcon={<Receipt size={18} color={colors.primaryForeground} />}
                onPress={() => listViewModel.onOpenCreate(LedgerEntryType.Sale)}
              />
              <AppButton
                label="Purchase"
                variant="secondary"
                size="lg"
                style={styles.actionButton}
                leadingIcon={<ArrowUpCircle size={18} color={colors.primary} />}
                onPress={() => listViewModel.onOpenCreate(LedgerEntryType.Purchase)}
              />
            </View>
            <View style={styles.actionRow}>
              <AppButton
                label="Collection"
                variant="primary"
                size="lg"
                style={styles.actionButton}
                leadingIcon={
                  <ArrowDownCircle size={18} color={colors.primaryForeground} />
                }
                onPress={() => listViewModel.onOpenCreate(LedgerEntryType.Collection)}
              />
              <AppButton
                label="Payment Out"
                variant="secondary"
                size="lg"
                style={styles.actionButton}
                leadingIcon={<CircleDollarSign size={18} color={colors.primary} />}
                onPress={() => listViewModel.onOpenCreate(LedgerEntryType.PaymentOut)}
              />
            </View>
          </View>
        }
      >
        <View style={styles.summaryGrid}>
          {listViewModel.summaryCards.map((summaryCard) => {
            const isReceive = summaryCard.tone === "receive";
            const isPay = summaryCard.tone === "pay";

            const icon = isReceive ? (
              <ArrowDownCircle size={18} color={colors.success} />
            ) : isPay ? (
              <ArrowUpCircle size={18} color={colors.destructive} />
            ) : summaryCard.id === "overdue" ? (
              <CalendarClock size={18} color={colors.warning} />
            ) : (
              <RotateCcw size={18} color={colors.primary} />
            );

            return (
              <Card key={summaryCard.id} style={styles.summaryCard}>
                <View
                  style={[
                    styles.summaryIconWrap,
                    isReceive
                      ? styles.receiveIconWrap
                      : isPay
                        ? styles.payIconWrap
                        : styles.neutralIconWrap,
                  ]}
                >
                  {icon}
                </View>
                <Text style={styles.summaryLabel}>{summaryCard.label}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    isReceive
                      ? styles.receiveValue
                      : isPay
                        ? styles.payValue
                        : null,
                  ]}
                >
                  {summaryCard.value}
                </Text>
              </Card>
            );
          })}
        </View>

        <View style={styles.searchWrap}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            value={listViewModel.searchQuery}
            onChangeText={listViewModel.onChangeSearchQuery}
            placeholder="Search party name or phone"
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((filterOption) => {
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
          <Text style={styles.sectionTitle}>Party Ledger</Text>
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
        ) : listViewModel.partyItems.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>{listViewModel.emptyStateMessage}</Text>
          </View>
        ) : (
          listViewModel.partyItems.map((partyItem) => (
            <Pressable
              key={partyItem.id}
              onPress={() =>
                void listViewModel.onOpenPartyDetail(
                  partyItem.id,
                  partyItem.partyName,
                )
              }
            >
              <Card style={styles.partyCard}>
                <View style={styles.partyTopRow}>
                  <View style={styles.partyAvatar}>
                    <Text style={styles.partyAvatarText}>
                      {partyItem.partyName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.partyTextWrap}>
                    <Text style={styles.partyName}>{partyItem.partyName}</Text>
                    <Text style={styles.partySubtitle}>{partyItem.subtitle}</Text>
                    {partyItem.badgeLabel ? (
                      <View style={styles.badgeWrap}>
                        <Text style={styles.badgeText}>{partyItem.badgeLabel}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.partyAmountWrap}>
                    <Text
                      style={[
                        styles.partyAmount,
                        partyItem.tone === "receive"
                          ? styles.receiveValue
                          : styles.payValue,
                      ]}
                    >
                      {partyItem.amountLabel}
                    </Text>
                    <Text style={styles.partyToneLabel}>
                      {partyItem.tone === "receive" ? "To Receive" : "To Pay"}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={colors.mutedForeground} />
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScreenContainer>

      <LedgerEntryEditorModal viewModel={editorViewModel} />
      <LedgerPartyDetailModal viewModel={partyDetailViewModel} />
      <LedgerDeleteModal viewModel={deleteViewModel} />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  footer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryCard: {
    width: "48%",
    minHeight: 118,
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  receiveIconWrap: {
    backgroundColor: "rgba(46, 139, 87, 0.12)",
  },
  payIconWrap: {
    backgroundColor: "rgba(228, 71, 71, 0.12)",
  },
  neutralIconWrap: {
    backgroundColor: colors.accent,
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  receiveValue: {
    color: colors.success,
  },
  payValue: {
    color: colors.destructive,
  },
  searchWrap: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.cardForeground,
    fontSize: 14,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
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
    fontFamily: "InterMedium",
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
    fontSize: 16,
    fontFamily: "InterBold",
  },
  refreshLabel: {
    color: colors.primary,
    fontSize: 13,
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
    lineHeight: 20,
  },
  partyCard: {
    paddingVertical: spacing.md,
  },
  partyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  partyAvatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  partyAvatarText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  partyTextWrap: {
    flex: 1,
    gap: 2,
  },
  partyName: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  partySubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  badgeWrap: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: "InterBold",
  },
  partyAmountWrap: {
    alignItems: "flex-end",
    gap: 2,
  },
  partyAmount: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  partyToneLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
  },
});
