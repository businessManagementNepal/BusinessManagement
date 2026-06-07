import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Pencil, Share2, Trash2, X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { LedgerPartyDetailViewModel } from "@/feature/ledger/viewModel/ledgerPartyDetail.viewModel";

type LedgerPartyDetailModalProps = {
  viewModel: LedgerPartyDetailViewModel;
};

export function LedgerPartyDetailModal({
  viewModel,
}: LedgerPartyDetailModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      visible={viewModel.visible}
      transparent={true}
      animationType="slide"
      onRequestClose={viewModel.close}
      statusBarTranslucent={Platform.OS === "android"}
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
              <X size={18} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>

          {viewModel.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={theme.colors.primary} />
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

              <View style={styles.statementActionRow}>
                <AppButton
                  label="Share Statement"
                  variant="secondary"
                  size="sm"
                  style={styles.statementActionButton}
                  leadingIcon={<Share2 size={14} color={theme.colors.foreground} />}
                  onPress={() => void viewModel.onShareStatement()}
                />
              </View>

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
                      <Pencil size={16} color={theme.colors.primary} />
                      <Text style={styles.entryActionLabel}>Edit</Text>
                    </Pressable>

                    <Pressable
                      style={styles.entryActionButton}
                      onPress={() => {
                        viewModel.close();
                        viewModel.onOpenDelete(entryItem.id);
                      }}
                    >
                      <Trash2 size={16} color={theme.colors.destructive} />
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

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: "flex-end",
    },
    modalDismissArea: {
      flex: 1,
    },
    modalSheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.sm),
      paddingBottom: theme.scaleSpace(spacing.xl),
      maxHeight: "88%",
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.border,
      alignSelf: "center",
      marginBottom: theme.scaleSpace(spacing.md),
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.md),
      marginBottom: theme.scaleSpace(spacing.md),
    },
    modalTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(18),
      fontFamily: "InterBold",
    },
    modalSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      marginTop: 4,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    centerState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.scaleSpace(spacing.xl),
    },
    content: {
      gap: theme.scaleSpace(spacing.md),
      paddingBottom: theme.scaleSpace(spacing.xl),
    },
    summaryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.scaleSpace(spacing.sm),
    },
    summaryCard: {
      flex: 1,
      minWidth: 98,
    },
    summaryLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      marginBottom: 4,
    },
    summaryValue: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(16),
      fontFamily: "InterBold",
    },
    receiveValue: {
      color: theme.colors.success,
    },
    payValue: {
      color: theme.colors.destructive,
    },
    quickActionRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    quickActionButton: {
      flex: 1,
    },
    statementActionRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    statementActionButton: {
      flex: 1,
    },
    sectionTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    entryCard: {
      gap: theme.scaleSpace(spacing.sm),
    },
    entryTopRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    entryTextWrap: {
      flex: 1,
    },
    entryTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    entrySubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      marginTop: 2,
      lineHeight: theme.scaleLineHeight(18),
    },
    entryAmountWrap: {
      alignItems: "flex-end",
      gap: 2,
    },
    entryAmount: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterBold",
    },
    entryTypeLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
    },
    entryActionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: theme.scaleSpace(spacing.md),
    },
    entryActionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    entryActionLabel: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(12),
      fontFamily: "InterBold",
    },
    deleteActionLabel: {
      color: theme.colors.destructive,
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
  });
