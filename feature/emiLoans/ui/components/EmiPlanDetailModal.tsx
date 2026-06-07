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
import { BellRing, Phone, X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { EmiPaymentDirection } from "@/feature/emiLoans/types/emi.entity.types";
import { EmiPlanDetailViewModel } from "@/feature/emiLoans/viewModel/emiPlanDetail.viewModel";

type EmiPlanDetailModalProps = {
  viewModel: EmiPlanDetailViewModel;
};

export function EmiPlanDetailModal({
  viewModel,
}: EmiPlanDetailModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const detailState = viewModel.state;

  return (
    <Modal
      visible={viewModel.visible}
      transparent={true}
      animationType="slide"
      onRequestClose={viewModel.close}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.dismissArea} onPress={viewModel.close} />

        <View style={styles.modalSheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{detailState?.title ?? "Plan Detail"}</Text>
              <Text style={styles.subtitle}>
                {detailState?.subtitle ?? "Installment schedule"}
              </Text>
            </View>

            <Pressable style={styles.closeButton} onPress={viewModel.close}>
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
          ) : detailState ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <View style={styles.summaryGrid}>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>{detailState.totalAmountLabel}</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Remaining</Text>
                  <Text style={styles.summaryValue}>{detailState.remainingAmountLabel}</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Due</Text>
                  <Text style={styles.summaryValue}>{detailState.dueTodayLabel}</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Overdue</Text>
                  <Text style={styles.summaryValue}>{detailState.overdueLabel}</Text>
                </Card>
              </View>

              <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Progress</Text>
                  <Text style={styles.infoValue}>{detailState.progressLabel}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Next Due</Text>
                  <Text style={styles.infoValue}>{detailState.nextDueLabel}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>{detailState.statusLabel}</Text>
                </View>
                {detailState.counterpartyName ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Linked With</Text>
                    <Text style={styles.infoValue}>{detailState.counterpartyName}</Text>
                  </View>
                ) : null}
                {detailState.counterpartyPhone ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <View style={styles.phoneWrap}>
                      <Phone size={14} color={theme.colors.mutedForeground} />
                      <Text style={styles.infoValue}>{detailState.counterpartyPhone}</Text>
                    </View>
                  </View>
                ) : null}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reminder</Text>
                  <View style={styles.phoneWrap}>
                    <BellRing size={14} color={theme.colors.mutedForeground} />
                    <Text style={styles.infoValue}>{detailState.reminderLabel}</Text>
                  </View>
                </View>
              </Card>

              <Card style={styles.infoCard}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Money Account</Text>
                  <Dropdown
                    value={viewModel.selectedSettlementAccountRemoteId}
                    options={[...viewModel.settlementAccountOptions]}
                    onChange={viewModel.onChangeSettlementAccountRemoteId}
                    placeholder="Select money account"
                    modalTitle="Select money account"
                    showLeadingIcon={false}
                  />
                  {viewModel.settlementAccountOptions.length === 0 ? (
                    <Text style={styles.helperText}>
                      No active money accounts available for this plan.
                    </Text>
                  ) : null}
                </View>
              </Card>

              <Text style={styles.sectionTitle}>Schedule</Text>

              {detailState.installmentItems.map((installment) => (
                <Card key={installment.remoteId} style={styles.installmentCard}>
                  <View style={styles.installmentTopRow}>
                    <View style={styles.installmentTextWrap}>
                      <Text style={styles.installmentTitle}>{installment.title}</Text>
                      <Text style={styles.installmentSubtitle}>{installment.subtitle}</Text>
                    </View>
                    <View style={styles.installmentAmountWrap}>
                      <Text style={styles.installmentAmount}>{installment.amountLabel}</Text>
                      <Text
                        style={[
                          styles.installmentStatus,
                          installment.isPaid
                            ? styles.closedStatus
                            : installment.isOverdue
                              ? styles.overdueStatus
                              : styles.dueStatus,
                        ]}
                      >
                        {installment.statusLabel}
                      </Text>
                    </View>
                  </View>

                  {!installment.isPaid ? (
                    <View style={styles.installmentActionRow}>
                      <AppButton
                        label={
                          detailState.paymentDirection === EmiPaymentDirection.Collect
                            ? "Collect"
                            : "Pay Now"
                        }
                        variant={
                          detailState.paymentDirection === EmiPaymentDirection.Collect
                            ? "primary"
                            : "secondary"
                        }
                        size="md"
                        style={styles.installmentActionButton}
                        onPress={() => void viewModel.payInstallment(installment.remoteId)}
                        disabled={
                          viewModel.isSubmittingPayment ||
                          viewModel.selectedSettlementAccountRemoteId.trim()
                            .length === 0
                        }
                      />
                    </View>
                  ) : null}
                </Card>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>This plan is not available.</Text>
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
    dismissArea: {
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
      maxHeight: "90%",
    },
    handle: {
      width: 44,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.border,
      alignSelf: "center",
      marginBottom: theme.scaleSpace(spacing.md),
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: theme.scaleSpace(spacing.md),
      marginBottom: theme.scaleSpace(spacing.md),
    },
    headerTextWrap: {
      flex: 1,
    },
    title: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(18),
      fontFamily: "InterBold",
    },
    subtitle: {
      marginTop: 4,
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    centerState: {
      paddingVertical: theme.scaleSpace(spacing.xl),
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(13),
      fontFamily: "InterBold",
    },
    emptyText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(14),
    },
    content: {
      gap: theme.scaleSpace(spacing.md),
      paddingBottom: theme.scaleSpace(spacing.md),
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.scaleSpace(spacing.sm),
    },
    summaryCard: {
      width: "48%",
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
    },
    summaryLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      marginBottom: 6,
    },
    summaryValue: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(16),
      fontFamily: "InterBold",
    },
    infoCard: {
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.sm),
    },
    infoBlock: {
      gap: theme.scaleSpace(spacing.xs),
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.md),
    },
    infoLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
    },
    infoValue: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterBold",
    },
    phoneWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.xs),
    },
    sectionTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    helperText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
    },
    installmentCard: {
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.sm),
    },
    installmentTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    installmentTextWrap: {
      flex: 1,
      gap: 4,
    },
    installmentTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    installmentSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
    },
    installmentAmountWrap: {
      alignItems: "flex-end",
      gap: 4,
    },
    installmentAmount: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    installmentStatus: {
      fontSize: theme.scaleText(12),
      fontFamily: "InterBold",
    },
    closedStatus: {
      color: theme.colors.success,
    },
    overdueStatus: {
      color: theme.colors.destructive,
    },
    dueStatus: {
      color: theme.colors.primary,
    },
    installmentActionRow: {
      alignItems: "flex-end",
    },
    installmentActionButton: {
      minWidth: 118,
    },
  });
