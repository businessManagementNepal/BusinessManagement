import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { Printer, X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PosCustomer, PosTotals } from "../types/pos.entity.types";
import type { PosMoneyAccountOption } from "../types/pos.ui.types";
import { formatCurrency } from "./posScreen.shared";
import { CenteredDialogFormModal } from "@/shared/components/reusable/Modals/CenteredDialogFormModal";

type PosPaymentModalProps = {
  visible: boolean;
  totals: PosTotals;
  currencyCode: string;
  countryCode: string | null;
  paidAmount: string;
  selectedCustomer: PosCustomer | null;
  selectedSettlementAccountRemoteId: string;
  moneyAccountOptions: readonly PosMoneyAccountOption[];
  isSubmitting: boolean;
  onPaidAmountChange: (value: string) => void;
  onSettlementAccountChange: (settlementAccountRemoteId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

const getDueCardTone = (
  theme: ReturnType<typeof useAppTheme>,
  dueAmount: number,
): { backgroundColor: string; valueColor: string; label: string } => {
  if (dueAmount > 0) {
    return {
      backgroundColor: theme.isDarkMode
        ? "rgba(244, 193, 93, 0.18)"
        : "#FEF3CD",
      valueColor: theme.colors.warning,
      label: "Due Amount",
    };
  }

  if (dueAmount === 0) {
    return {
      backgroundColor: theme.isDarkMode
        ? "rgba(99, 211, 148, 0.16)"
        : "#D1E7DD",
      valueColor: theme.colors.success,
      label: "Paid in Full",
    };
  }

  return {
    backgroundColor: theme.isDarkMode
      ? "rgba(79, 167, 255, 0.16)"
      : "#E3F2FD",
    valueColor: theme.colors.primary,
    label: "Change to Return",
  };
};

export function PosPaymentModal({
  visible,
  totals,
  currencyCode,
  countryCode,
  paidAmount,
  selectedCustomer,
  selectedSettlementAccountRemoteId,
  moneyAccountOptions,
  isSubmitting,
  onPaidAmountChange,
  onSettlementAccountChange,
  onConfirm,
  onClose,
}: PosPaymentModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const paidAmountNum = Number(paidAmount || "0");
  const grandTotal = totals.grandTotal;
  const dueAmount = grandTotal - paidAmountNum;
  const dueCardTone = getDueCardTone(theme, dueAmount);
  const requiresCustomer = dueAmount > 0;
  const customerValid = !requiresCustomer || selectedCustomer !== null;
  const requiresSettlementAccount = paidAmountNum > 0;
  const settlementAccountValid =
    !requiresSettlementAccount ||
    selectedSettlementAccountRemoteId.trim().length > 0;

  return (
    <CenteredDialogFormModal
      visible={visible}
      onClose={onClose}
      closeOnBackdropPress={!isSubmitting}
      header={
        <View style={styles.headerRow}>
          <Text style={styles.title}>Take Payment</Text>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <X size={22} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      }
      headerContainerStyle={styles.headerContainer}
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footerContent}>
          {requiresCustomer && !customerValid ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                Select a customer to continue with unpaid or partial payment.
              </Text>
            </View>
          ) : null}
          {requiresSettlementAccount && !settlementAccountValid ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                Select a settlement account to continue with paid sales.
              </Text>
            </View>
          ) : null}
          <AppButton
            label={isSubmitting ? "Completing Sale..." : "Complete Sale"}
            size="lg"
            leadingIcon={
              <Printer size={18} color={theme.colors.primaryForeground} />
            }
            onPress={onConfirm}
            disabled={isSubmitting || !customerValid || !settlementAccountValid}
            isLoading={isSubmitting}
          />
        </View>
      }
      footerContainerStyle={styles.footer}
      minHeight={360}
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Grand Total</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(totals.grandTotal, currencyCode, countryCode)}
        </Text>
      </View>

      {selectedCustomer ? (
        <View style={styles.customerSummaryCard}>
          <Text style={styles.customerSummaryLabel}>Customer</Text>
          <Text style={styles.customerSummaryName}>
            {selectedCustomer.fullName}
          </Text>
          {selectedCustomer.phone ? (
            <Text style={styles.customerSummaryPhone}>
              {selectedCustomer.phone}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Settlement Account</Text>
        <Dropdown
          value={selectedSettlementAccountRemoteId}
          options={moneyAccountOptions}
          onChange={onSettlementAccountChange}
          placeholder="Select settlement account"
          modalTitle="Select settlement account"
          showLeadingIcon={false}
          disabled={isSubmitting}
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Paid Amount</Text>
        <TextInput
          value={paidAmount}
          onChangeText={onPaidAmountChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.mutedForeground}
          style={styles.input}
          editable={!isSubmitting}
        />
      </View>

      <View
        style={[
          styles.dueAmountCard,
          { backgroundColor: dueCardTone.backgroundColor },
        ]}
      >
        <Text style={styles.dueAmountLabel}>{dueCardTone.label}</Text>
        <Text
          style={[styles.dueAmountValue, { color: dueCardTone.valueColor }]}
        >
          {formatCurrency(
            dueAmount > 0 ? dueAmount : dueAmount === 0 ? grandTotal : Math.abs(dueAmount),
            currencyCode,
            countryCode,
          )}
        </Text>
      </View>
    </CenteredDialogFormModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    headerContainer: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.lg),
      paddingBottom: theme.scaleSpace(spacing.sm),
    },
    content: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingBottom: theme.scaleSpace(spacing.sm),
      gap: theme.scaleSpace(spacing.md),
    },
    footer: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.sm),
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    footerContent: {
      gap: theme.scaleSpace(spacing.sm),
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    closeButton: {
      width: theme.scaleSpace(36),
      height: theme.scaleSpace(36),
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(18),
      fontFamily: "InterBold",
    },
    summaryCard: {
      borderRadius: radius.lg,
      backgroundColor: theme.colors.accent,
      padding: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(4),
    },
    summaryLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    summaryValue: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(24),
      fontFamily: "InterBold",
    },
    fieldWrap: {
      gap: theme.scaleSpace(6),
    },
    fieldLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    input: {
      minHeight: theme.scaleSpace(50),
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterMedium",
    },
    errorCard: {
      backgroundColor: theme.isDarkMode
        ? "rgba(255, 107, 107, 0.12)"
        : "#FDF1F1",
      borderRadius: radius.lg,
      padding: theme.scaleSpace(spacing.sm),
      borderWidth: 1,
      borderColor: theme.isDarkMode
        ? "rgba(255, 107, 107, 0.28)"
        : "#F2C7C7",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
      textAlign: "center",
    },
    customerSummaryCard: {
      borderRadius: radius.lg,
      backgroundColor: theme.colors.secondary,
      padding: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(4),
    },
    customerSummaryLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    customerSummaryName: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterMedium",
    },
    customerSummaryPhone: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    dueAmountCard: {
      borderRadius: radius.lg,
      padding: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(4),
    },
    dueAmountLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    dueAmountValue: {
      fontSize: theme.scaleText(16),
      fontFamily: "InterBold",
    },
  });
