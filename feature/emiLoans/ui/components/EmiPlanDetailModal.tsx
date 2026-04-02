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
import { BellRing, ChevronRight, Phone, X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { EmiPaymentDirection } from "@/feature/emiLoans/types/emi.entity.types";
import { EmiPlanDetailViewModel } from "@/feature/emiLoans/viewModel/emiPlanDetail.viewModel";

type EmiPlanDetailModalProps = {
  viewModel: EmiPlanDetailViewModel;
};

export function EmiPlanDetailModal({
  viewModel,
}: EmiPlanDetailModalProps) {
  return (
    <Modal
      visible={viewModel.visible}
      transparent={true}
      animationType="slide"
      onRequestClose={viewModel.close}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.dismissArea} onPress={viewModel.close} />

        <View style={styles.modalSheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{viewModel.state?.title ?? "Plan Detail"}</Text>
              <Text style={styles.subtitle}>
                {viewModel.state?.subtitle ?? "Installment schedule"}
              </Text>
            </View>

            <Pressable style={styles.closeButton} onPress={viewModel.close}>
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <View style={styles.summaryGrid}>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>{viewModel.state.totalAmountLabel}</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Remaining</Text>
                  <Text style={styles.summaryValue}>{viewModel.state.remainingAmountLabel}</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Due</Text>
                  <Text style={styles.summaryValue}>{viewModel.state.dueTodayLabel}</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Overdue</Text>
                  <Text style={styles.summaryValue}>{viewModel.state.overdueLabel}</Text>
                </Card>
              </View>

              <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Progress</Text>
                  <Text style={styles.infoValue}>{viewModel.state.progressLabel}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Next Due</Text>
                  <Text style={styles.infoValue}>{viewModel.state.nextDueLabel}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>{viewModel.state.statusLabel}</Text>
                </View>
                {viewModel.state.counterpartyName ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Linked With</Text>
                    <Text style={styles.infoValue}>{viewModel.state.counterpartyName}</Text>
                  </View>
                ) : null}
                {viewModel.state.counterpartyPhone ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <View style={styles.phoneWrap}>
                      <Phone size={14} color={colors.mutedForeground} />
                      <Text style={styles.infoValue}>{viewModel.state.counterpartyPhone}</Text>
                    </View>
                  </View>
                ) : null}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reminder</Text>
                  <View style={styles.phoneWrap}>
                    <BellRing size={14} color={colors.mutedForeground} />
                    <Text style={styles.infoValue}>{viewModel.state.reminderLabel}</Text>
                  </View>
                </View>
              </Card>

              <Text style={styles.sectionTitle}>Schedule</Text>

              {viewModel.state.installmentItems.map((installment) => (
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
                          viewModel.state.paymentDirection === EmiPaymentDirection.Collect
                            ? "Collect"
                            : "Pay Now"
                        }
                        variant={
                          viewModel.state.paymentDirection === EmiPaymentDirection.Collect
                            ? "primary"
                            : "secondary"
                        }
                        size="md"
                        style={styles.installmentActionButton}
                        onPress={() => void viewModel.payInstallment(installment.remoteId)}
                        disabled={viewModel.isSubmittingPayment}
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

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.28)",
    justifyContent: "flex-end",
  },
  dismissArea: {
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
    maxHeight: "90%",
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  subtitle: {
    marginTop: 4,
    color: colors.mutedForeground,
    fontSize: 13,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerState: {
    paddingVertical: spacing.xl,
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
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.md,
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
  infoCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  infoLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  infoValue: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  phoneWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  installmentCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  installmentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  installmentTextWrap: {
    flex: 1,
    gap: 4,
  },
  installmentTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  installmentSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  installmentAmountWrap: {
    alignItems: "flex-end",
    gap: 4,
  },
  installmentAmount: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  installmentStatus: {
    fontSize: 12,
    fontFamily: "InterBold",
  },
  closedStatus: {
    color: colors.success,
  },
  overdueStatus: {
    color: colors.destructive,
  },
  dueStatus: {
    color: colors.primary,
  },
  installmentActionRow: {
    alignItems: "flex-end",
  },
  installmentActionButton: {
    minWidth: 118,
  },
});
