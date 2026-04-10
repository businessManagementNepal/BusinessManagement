import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Pencil, Share2, Trash2, X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { LedgerPartyDetailViewModel } from "@/feature/ledger/viewModel/ledgerPartyDetail.viewModel";

type LedgerPartyDetailModalProps = {
  viewModel: LedgerPartyDetailViewModel;
};

export function LedgerPartyDetailModal({
  viewModel,
}: LedgerPartyDetailModalProps) {
  return (
    <Modal
      visible={viewModel.visible}
      transparent={true}
      animationType="slide"
      onRequestClose={viewModel.close}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={viewModel.close} />

        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {viewModel.state?.partyName ?? "Party Detail"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {viewModel.state?.partyPhone ?? "Ledger history"}
              </Text>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={viewModel.close}
              accessibilityRole="button"
              accessibilityLabel="Close party detail"
            >
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {viewModel.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : viewModel.errorMessage ? (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
            </View>
          ) : viewModel.state ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View style={styles.summaryRow}>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>
                    {viewModel.state.balanceTone === "receive"
                      ? "To Receive"
                      : "To Pay"}
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      viewModel.state.balanceTone === "receive"
                        ? styles.receiveValue
                        : styles.payValue,
                    ]}
                  >
                    {viewModel.state.balanceLabel}
                  </Text>
                </Card>

                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Due Today</Text>
                  <Text style={styles.summaryValue}>{viewModel.state.dueTodayLabel}</Text>
                </Card>

                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Overdue</Text>
                  <Text style={styles.summaryValue}>{viewModel.state.overdueLabel}</Text>
                </Card>
              </View>

              <View style={styles.quickActionRow}>
                <AppButton
                  label="Receive Money"
                  variant="primary"
                  size="md"
                  style={styles.quickActionButton}
                  onPress={viewModel.onQuickCollect}
                />
                <AppButton
                  label="Pay Money"
                  variant="secondary"
                  size="md"
                  style={styles.quickActionButton}
                  onPress={viewModel.onQuickPaymentOut}
                />
              </View>

              <AppButton
                label="Share Statement"
                variant="secondary"
                size="sm"
                leadingIcon={<Share2 size={14} color={colors.foreground} />}
                onPress={() => void viewModel.onShareStatement()}
              />

              <Text style={styles.sectionTitle}>Entries</Text>

              {viewModel.state.entryItems.map((entryItem) => (
                <Card key={entryItem.id} style={styles.entryCard}>
                  <View style={styles.entryTopRow}>
                    <View style={styles.entryTextWrap}>
                      <Text style={styles.entryTitle}>{entryItem.title}</Text>
                      <Text style={styles.entrySubtitle}>{entryItem.subtitle}</Text>
                    </View>

                    <View style={styles.entryAmountWrap}>
                      <Text
                        style={[
                          styles.entryAmount,
                          entryItem.tone === "receive"
                            ? styles.receiveValue
                            : styles.payValue,
                        ]}
                      >
                        {entryItem.amountLabel}
                      </Text>
                      <Text style={styles.entryTypeLabel}>{entryItem.entryTypeLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.entryActionRow}>
                    <Pressable
                      style={styles.entryActionButton}
                      onPress={() => {
                        viewModel.close();
                        viewModel.onOpenEdit(entryItem.id);
                      }}
                    >
                      <Pencil size={16} color={colors.primary} />
                      <Text style={styles.entryActionLabel}>Edit</Text>
                    </Pressable>

                    <Pressable
                      style={styles.entryActionButton}
                      onPress={() => {
                        viewModel.close();
                        viewModel.onOpenDelete(entryItem.id);
                      }}
                    >
                      <Trash2 size={16} color={colors.destructive} />
                      <Text style={[styles.entryActionLabel, styles.deleteActionLabel]}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>No ledger history for this party yet.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.3)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: "88%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  modalSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: 98,
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  receiveValue: {
    color: colors.success,
  },
  payValue: {
    color: colors.destructive,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  entryCard: {
    gap: spacing.sm,
  },
  entryTopRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  entryTextWrap: {
    flex: 1,
  },
  entryTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  entrySubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  entryAmountWrap: {
    alignItems: "flex-end",
    gap: 2,
  },
  entryAmount: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  entryTypeLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
  },
  entryActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  entryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  entryActionLabel: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  deleteActionLabel: {
    color: colors.destructive,
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
});
