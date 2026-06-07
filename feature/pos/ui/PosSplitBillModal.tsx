import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { BottomSheetFormModal } from "@/shared/components/reusable/Modals/BottomSheetFormModal";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { ChevronDown, Plus, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { PosSplitDraftPart } from "../types/pos.entity.types";
import type { PosMoneyAccountOption } from "../types/pos.ui.types";
import { formatCurrency } from "./posScreen.shared";

type PosSplitBillModalProps = {
  visible: boolean;
  grandTotal: number;
  allocatedAmount: number;
  remainingAmount: number;
  parts: readonly PosSplitDraftPart[];
  moneyAccountOptions: readonly PosMoneyAccountOption[];
  currencyCode: string | null;
  countryCode: string | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onApplyEqualSplit: (count: number) => void;
  onAddPart: () => void;
  onRemovePart: (paymentPartId: string) => void;
  onChangePartPayerLabel: (paymentPartId: string, value: string) => void;
  onChangePartAmount: (paymentPartId: string, value: string) => void;
  onChangePartSettlementAccount: (
    paymentPartId: string,
    settlementAccountRemoteId: string,
  ) => void;
  onSubmit: () => void;
};

const parseAmount = (value: string): number => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

export function PosSplitBillModal({
  visible,
  grandTotal,
  allocatedAmount,
  remainingAmount,
  parts,
  moneyAccountOptions,
  currencyCode,
  countryCode,
  errorMessage,
  isSubmitting,
  onClose,
  onApplyEqualSplit,
  onAddPart,
  onRemovePart,
  onChangePartPayerLabel,
  onChangePartAmount,
  onChangePartSettlementAccount,
  onSubmit,
}: PosSplitBillModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [expandedPartIds, setExpandedPartIds] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setExpandedPartIds([]);
    }
  }, [visible]);

  const isSubmitDisabled = isSubmitting || parts.length < 2;

  const paymentProgressText = useMemo(() => {
    const paidLabel = formatCurrency(
      allocatedAmount,
      currencyCode,
      countryCode,
    );
    const remainingLabel = formatCurrency(
      remainingAmount,
      currencyCode,
      countryCode,
    );

    if (remainingAmount > 0) {
      return `${paidLabel} collected | ${remainingLabel} remaining`;
    }

    return `${paidLabel} fully allocated`;
  }, [allocatedAmount, countryCode, currencyCode, remainingAmount]);

  const toggleAdvanced = (paymentPartId: string) => {
    setExpandedPartIds((current) =>
      current.includes(paymentPartId)
        ? current.filter((id) => id !== paymentPartId)
        : [...current, paymentPartId],
    );
  };

  const applyRemainingToPart = (paymentPartId: string) => {
    const allocatedWithoutCurrent = parts.reduce((sum, part) => {
      if (part.paymentPartId === paymentPartId) {
        return sum;
      }

      return sum + parseAmount(part.amountInput);
    }, 0);

    const nextAmount = Math.max(grandTotal - allocatedWithoutCurrent, 0);
    onChangePartAmount(paymentPartId, nextAmount.toFixed(2));
  };

  const applyHalfToPart = (paymentPartId: string) => {
    onChangePartAmount(paymentPartId, (grandTotal / 2).toFixed(2));
  };

  return (
    <BottomSheetFormModal
      visible={visible}
      onClose={onClose}
      closeOnBackdropPress={!isSubmitting}
      header={
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Split Bill</Text>
            <Text style={styles.subtitle}>{paymentProgressText}</Text>
          </View>

          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <X size={20} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      }
      contentContainerStyle={styles.content}
      footer={
        <>
          {remainingAmount > 0 ? (
            <Text style={styles.footerHint}>
              Remaining amount can stay due only when a customer is selected.
            </Text>
          ) : null}

          <AppButton
            label={isSubmitting ? "Completing Split Bill..." : "Complete Split Bill"}
            size="lg"
            onPress={onSubmit}
            disabled={isSubmitDisabled}
            isLoading={isSubmitting}
            style={styles.submitButton}
          />
        </>
      }
      footerContainerStyle={styles.footer}
      minHeight={460}
    >
      <View style={styles.summaryStrip}>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryPillLabel}>Total</Text>
          <Text style={styles.summaryPillValue}>
            {formatCurrency(grandTotal, currencyCode, countryCode)}
          </Text>
        </View>

        <View style={styles.summaryPill}>
          <Text style={styles.summaryPillLabel}>Paid</Text>
          <Text style={styles.summaryPillValue}>
            {formatCurrency(allocatedAmount, currencyCode, countryCode)}
          </Text>
        </View>

        <View style={styles.summaryPill}>
          <Text style={styles.summaryPillLabel}>Remaining</Text>
          <Text
            style={[
              styles.summaryPillValue,
              remainingAmount > 0 ? styles.remainingValue : null,
            ]}
          >
            {formatCurrency(remainingAmount, currencyCode, countryCode)}
          </Text>
        </View>
      </View>

      <View style={styles.quickSplitSection}>
        <Text style={styles.sectionTitle}>Quick Split</Text>
        <View style={styles.quickSplitRow}>
          <Pressable
            style={[
              styles.quickChip,
              isSubmitting ? styles.controlDisabled : null,
            ]}
            onPress={() => onApplyEqualSplit(2)}
            disabled={isSubmitting}
          >
            <Text style={styles.quickChipText}>2</Text>
          </Pressable>

          <Pressable
            style={[
              styles.quickChip,
              isSubmitting ? styles.controlDisabled : null,
            ]}
            onPress={() => onApplyEqualSplit(3)}
            disabled={isSubmitting}
          >
            <Text style={styles.quickChipText}>3</Text>
          </Pressable>

          <Pressable
            style={[
              styles.quickChip,
              isSubmitting ? styles.controlDisabled : null,
            ]}
            onPress={() => onApplyEqualSplit(4)}
            disabled={isSubmitting}
          >
            <Text style={styles.quickChipText}>4</Text>
          </Pressable>

          <Pressable
            style={[
              styles.addChip,
              isSubmitting ? styles.controlDisabled : null,
            ]}
            onPress={onAddPart}
            disabled={isSubmitting}
          >
            <Plus size={16} color={theme.colors.cardForeground} />
            <Text style={styles.addChipText}>Add</Text>
          </Pressable>
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.partsSection}>
        {parts.map((part, index) => {
          const isExpanded = expandedPartIds.includes(part.paymentPartId);

          return (
            <View key={part.paymentPartId} style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowTitle}>{`Part ${index + 1}`}</Text>

                <View style={styles.rowHeaderActions}>
                  <Pressable
                    style={styles.moreButton}
                    onPress={() => toggleAdvanced(part.paymentPartId)}
                  >
                    <Text style={styles.moreButtonText}>
                      {isExpanded ? "Hide name" : "Add name"}
                    </Text>
                    <ChevronDown size={14} color={theme.colors.mutedForeground} />
                  </Pressable>

                  {parts.length > 2 ? (
                    <Pressable
                      style={[
                        styles.removeButton,
                        isSubmitting ? styles.controlDisabled : null,
                      ]}
                      onPress={() => onRemovePart(part.paymentPartId)}
                      disabled={isSubmitting}
                    >
                      <X size={16} color={theme.colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={styles.inlineFieldsRow}>
                <View style={styles.amountFieldWrap}>
                  <Text style={styles.inlineLabel}>Amount</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    value={part.amountInput}
                    onChangeText={(value) =>
                      onChangePartAmount(part.paymentPartId, value)
                    }
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.mutedForeground}
                    editable={!isSubmitting}
                  />
                </View>

                <View style={styles.methodFieldWrap}>
                  <Text style={styles.inlineLabel}>Method</Text>
                  <Dropdown
                    triggerStyle={styles.dropdownTrigger}
                    options={moneyAccountOptions}
                    value={part.settlementAccountRemoteId}
                    onChange={(value: string) =>
                      onChangePartSettlementAccount(part.paymentPartId, value)
                    }
                    placeholder="Select"
                    disabled={isSubmitting}
                  />
                </View>
              </View>

              <View style={styles.rowQuickActions}>
                <Pressable
                  style={styles.smallActionChip}
                  onPress={() => applyRemainingToPart(part.paymentPartId)}
                >
                  <Text style={styles.smallActionChipText}>Remaining</Text>
                </Pressable>

                <Pressable
                  style={styles.smallActionChip}
                  onPress={() => applyHalfToPart(part.paymentPartId)}
                >
                  <Text style={styles.smallActionChipText}>Half</Text>
                </Pressable>

                <Pressable
                  style={styles.smallActionChip}
                  onPress={() => onChangePartAmount(part.paymentPartId, "")}
                >
                  <Text style={styles.smallActionChipText}>Clear</Text>
                </Pressable>
              </View>

              {isExpanded ? (
                <View style={styles.advancedSection}>
                  <Text style={styles.inlineLabel}>Payer Name</Text>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Optional"
                    value={part.payerLabel}
                    onChangeText={(value) =>
                      onChangePartPayerLabel(part.paymentPartId, value)
                    }
                    placeholderTextColor={theme.colors.mutedForeground}
                    editable={!isSubmitting}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </BottomSheetFormModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    header: {
      minHeight: 72,
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.lg),
      paddingBottom: theme.scaleSpace(spacing.md),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    content: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.md),
      paddingBottom: theme.scaleSpace(spacing.lg),
      gap: theme.scaleSpace(spacing.md),
    },
    headerTextWrap: {
      flex: 1,
      paddingRight: theme.scaleSpace(spacing.md),
    },
    title: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(22),
      fontFamily: "InterBold",
    },
    subtitle: {
      marginTop: 4,
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterMedium",
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryStrip: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    summaryPill: {
      flex: 1,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      paddingVertical: theme.scaleSpace(spacing.sm),
      paddingHorizontal: theme.scaleSpace(spacing.sm),
    },
    summaryPillLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      fontFamily: "InterMedium",
    },
    summaryPillValue: {
      marginTop: 4,
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    remainingValue: {
      color: theme.colors.primary,
    },
    quickSplitSection: {
      gap: theme.scaleSpace(spacing.sm),
    },
    sectionTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    quickSplitRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    quickChip: {
      minWidth: 52,
      minHeight: 40,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    quickChipText: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    addChip: {
      marginLeft: "auto",
      minHeight: 40,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.scaleSpace(spacing.xs),
    },
    addChipText: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    errorBanner: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.isDarkMode ? "rgba(255, 107, 107, 0.28)" : "#F2C7C7",
      backgroundColor: theme.isDarkMode ? "rgba(255, 107, 107, 0.12)" : "#FDF1F1",
      padding: theme.scaleSpace(spacing.sm),
    },
    errorBannerText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
      textAlign: "center",
    },
    partsSection: {
      gap: theme.scaleSpace(spacing.sm),
    },
    rowCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.sm),
    },
    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    rowTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
    rowHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.xs),
    },
    moreButton: {
      minHeight: 28,
      paddingHorizontal: theme.scaleSpace(spacing.sm),
      borderRadius: radius.md,
      backgroundColor: theme.colors.secondary,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    moreButtonText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    removeButton: {
      width: 28,
      height: 28,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.secondary,
    },
    inlineFieldsRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    amountFieldWrap: {
      flex: 0.95,
      gap: 6,
    },
    methodFieldWrap: {
      flex: 1.25,
      gap: 6,
    },
    inlineLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      fontFamily: "InterMedium",
    },
    amountInput: {
      minHeight: 46,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterMedium",
    },
    dropdownTrigger: {
      minHeight: 46,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.scaleSpace(spacing.md),
    },
    rowQuickActions: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.xs),
      flexWrap: "wrap",
    },
    smallActionChip: {
      minHeight: 28,
      paddingHorizontal: theme.scaleSpace(spacing.sm),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    smallActionChipText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    advancedSection: {
      gap: 6,
    },
    nameInput: {
      minHeight: 42,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterMedium",
    },
    footer: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.md),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      gap: theme.scaleSpace(spacing.sm),
    },
    footerHint: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
    submitButton: {},
    controlDisabled: {
      opacity: 0.6,
    },
  });
