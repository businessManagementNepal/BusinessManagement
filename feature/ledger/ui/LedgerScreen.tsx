import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  Clock3,
  Plus,
  RotateCcw,
  User,
} from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { StatCard } from "@/shared/components/reusable/Cards/StatCard";
import { SummaryCard } from "@/shared/components/reusable/Cards/SummaryCard";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { SearchInputRow } from "@/shared/components/reusable/Form/SearchInputRow";
import { BottomTabAwareFooter } from "@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter";
import { InlineSectionHeader } from "@/shared/components/reusable/ScreenLayouts/InlineSectionHeader";
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
  const primarySummaryCards = listViewModel.summaryCards.slice(0, 2);
  const secondarySummaryCards = listViewModel.summaryCards.slice(2, 4);

  const miniStats = [
    ...secondarySummaryCards,
    {
      id: "parties",
      label: "Parties",
      value: `${listViewModel.partyItems.length}`,
      tone: "neutral" as const,
    },
  ];

  return (
    <>
      <ScreenContainer
        showDivider={false}
        padded={true}
        contentContainerStyle={styles.content}
        baseBottomPadding={140}
        footer={
          <BottomTabAwareFooter>
            <AppButton
              label="Quick Ledger Entry"
              variant="primary"
              size="lg"
              style={styles.primaryActionButton}
              leadingIcon={<Plus size={18} color={colors.primaryForeground} />}
              onPress={() => listViewModel.onOpenCreate(LedgerEntryType.Sale)}
            />
          </BottomTabAwareFooter>
        }
      >
        <View style={styles.summaryGrid}>
          {primarySummaryCards.map((summaryCard) => {
            const isReceive = summaryCard.tone === "receive";

            return (
              <SummaryCard
                key={summaryCard.id}
                size="dashboard"
                icon={
                  isReceive ? (
                    <ArrowDownCircle size={16} color={colors.success} />
                  ) : (
                    <ArrowUpCircle size={16} color={colors.destructive} />
                  )
                }
                title={summaryCard.label}
                value={summaryCard.value}
                valueColor={isReceive ? colors.success : colors.destructive}
                iconBg={
                  isReceive
                    ? "rgba(46, 139, 87, 0.14)"
                    : "rgba(228, 71, 71, 0.14)"
                }
              />
            );
          })}
        </View>

        <View style={styles.miniStatGrid}>
          {miniStats.map((miniStat) => {
            const isOverdue = miniStat.id === "overdue";
            const isDueToday = miniStat.id === "due-today";

            const icon = isOverdue ? (
              <ArrowUpCircle size={16} color={colors.destructive} />
            ) : isDueToday ? (
              <CalendarClock size={16} color={colors.warning} />
            ) : (
              <RotateCcw size={16} color={colors.success} />
            );

            return (
              <StatCard
                key={miniStat.id}
                size="dashboard"
                icon={icon}
                value={miniStat.value}
                label={miniStat.label}
              />
            );
          })}
        </View>

        {listViewModel.hasOverdueAging ? (
          <>
            <InlineSectionHeader title="Receivable Aging" />
            <View style={styles.agingGrid}>
              {listViewModel.agingBuckets.map((bucket) => (
                <View
                  key={bucket.id}
                  style={[
                    styles.agingCard,
                    bucket.tone === "destructive"
                      ? styles.agingCardCritical
                      : bucket.tone === "warning"
                        ? styles.agingCardWarning
                        : null,
                  ]}
                >
                  <Text style={styles.agingLabel}>{bucket.label}</Text>
                  <Text style={styles.agingAmount}>{bucket.amountLabel}</Text>
                  <Text style={styles.agingCount}>{bucket.countLabel}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <InlineSectionHeader title="Collection Queue" />
        {listViewModel.collectionQueue.length === 0 ? (
          <View style={styles.queueEmptyState}>
            <Clock3 size={16} color={colors.mutedForeground} />
            <Text style={styles.queueEmptyText}>No overdue collection action right now.</Text>
          </View>
        ) : (
          <View style={styles.collectionQueueContainer}>
            {listViewModel.collectionQueue.map((queueItem, index) => (
              <View
                key={queueItem.id}
                style={[
                  styles.collectionQueueRow,
                  index < listViewModel.collectionQueue.length - 1
                    ? styles.partyRowDivider
                    : null,
                ]}
              >
                <Pressable
                  style={styles.collectionQueueInfo}
                  onPress={() =>
                    void listViewModel.onOpenPartyDetail(
                      queueItem.partyId,
                      queueItem.partyName,
                    )
                  }
                >
                  <View style={styles.queueTitleRow}>
                    <Text style={styles.collectionQueuePartyName}>
                      {queueItem.partyName}
                    </Text>
                    {queueItem.priority === "critical" ? (
                      <AlertTriangle size={14} color={colors.destructive} />
                    ) : null}
                  </View>
                  <Text style={styles.collectionQueueMeta}>{queueItem.metaLabel}</Text>
                  <Text style={styles.collectionQueueAmount}>{queueItem.amountLabel}</Text>
                </Pressable>

                <AppButton
                  label="Collect"
                  variant="secondary"
                  size="sm"
                  onPress={() => listViewModel.onQuickCollectFromQueue(queueItem.partyName)}
                />
              </View>
            ))}
          </View>
        )}

        <SearchInputRow
          value={listViewModel.searchQuery}
          onChangeText={listViewModel.onChangeSearchQuery}
          placeholder="Search party name"
          inputStyle={styles.searchInput}
        />

        <FilterChipGroup
          options={FILTER_OPTIONS}
          selectedValue={listViewModel.selectedFilter}
          onSelect={listViewModel.onChangeFilter}
        />

        <InlineSectionHeader
          title="Parties"
          actionLabel="View More"
          onActionPress={() => {
            listViewModel.onChangeSearchQuery("");
            listViewModel.onChangeFilter(LedgerListFilter.All);
          }}
        />

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
          <View style={styles.partyListContainer}>
            {listViewModel.partyItems.map((partyItem, index) => (
              <Pressable
                key={partyItem.id}
                style={[
                  styles.partyRow,
                  index < listViewModel.partyItems.length - 1
                    ? styles.partyRowDivider
                    : null,
                ]}
                onPress={() =>
                  void listViewModel.onOpenPartyDetail(
                    partyItem.id,
                    partyItem.partyName,
                  )
                }
              >
                <View style={styles.partyAvatar}>
                  <User size={18} color={colors.primary} />
                </View>

                <View style={styles.partyTextWrap}>
                  <Text style={styles.partyName}>{partyItem.partyName}</Text>
                  <Text style={styles.partySubtitle}>{partyItem.subtitle}</Text>
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
                  {partyItem.badgeLabel ? (
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeText}>{partyItem.badgeLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
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
    gap: spacing.sm,
  },
  primaryActionButton: {
    width: "100%",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  miniStatGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  agingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  agingCard: {
    width: "31%",
    minHeight: 82,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  agingCardWarning: {
    borderColor: colors.warning,
    backgroundColor: "rgba(245, 158, 11, 0.07)",
  },
  agingCardCritical: {
    borderColor: colors.destructive,
    backgroundColor: "rgba(228, 71, 71, 0.08)",
  },
  agingLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterSemiBold",
  },
  agingAmount: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  agingCount: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterMedium",
  },
  collectionQueueContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  collectionQueueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  collectionQueueInfo: {
    flex: 1,
    gap: 2,
  },
  queueTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  collectionQueuePartyName: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  collectionQueueMeta: {
    color: colors.mutedForeground,
    fontSize: 11,
  },
  collectionQueueAmount: {
    color: colors.destructive,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  queueEmptyState: {
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  queueEmptyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  searchInput: {
    color: colors.cardForeground,
  },
  partyListContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  partyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  partyRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  partyAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
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
  },
  partyAmountWrap: {
    alignItems: "flex-end",
    gap: 2,
    maxWidth: 138,
  },
  partyAmount: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  receiveValue: {
    color: colors.success,
  },
  payValue: {
    color: colors.destructive,
  },
  partyToneLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
  },
  badgeWrap: {
    marginTop: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: "InterMedium",
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
});
