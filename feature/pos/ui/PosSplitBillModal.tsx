import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { ChevronDown, Plus, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { PosSplitDraftPart } from "../types/pos.entity.types";
import { formatCurrency } from "./posScreen.shared";

type PosSplitBillModalProps = {
  visible: boolean;
  grandTotal: number;
  allocatedAmount: number;
  remainingAmount: number;
  parts: readonly PosSplitDraftPart[];
  moneyAccountOptions: readonly DropdownOption[];
  currencyCode: string | null;
  countryCode: string | null;
  errorMessage: string | null;
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
  onClose,
  onApplyEqualSplit,
  onAddPart,
  onRemovePart,
  onChangePartPayerLabel,
  onChangePartAmount,
  onChangePartSettlementAccount,
  onSubmit,
}: PosSplitBillModalProps) {
  const [expandedPartIds, setExpandedPartIds] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setExpandedPartIds([]);
    }
  }, [visible]);

  const isSubmitDisabled = parts.length < 2;

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
      return `${paidLabel} collected • ${remainingLabel} remaining`;
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>Split Bill</Text>
                <Text style={styles.subtitle}>{paymentProgressText}</Text>
              </View>

              <Pressable style={styles.closeButton} onPress={onClose}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

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
                    remainingAmount > 0 && styles.remainingValue,
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
                  style={styles.quickChip}
                  onPress={() => onApplyEqualSplit(2)}
                >
                  <Text style={styles.quickChipText}>2</Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() => onApplyEqualSplit(3)}
                >
                  <Text style={styles.quickChipText}>3</Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() => onApplyEqualSplit(4)}
                >
                  <Text style={styles.quickChipText}>4</Text>
                </Pressable>

                <Pressable style={styles.addChip} onPress={onAddPart}>
                  <Plus size={16} color={colors.cardForeground} />
                  <Text style={styles.addChipText}>Add</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.body}>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {!!errorMessage && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                  </View>
                )}

                <View style={styles.partsSection}>
                  {parts.map((part, index) => {
                    const isExpanded = expandedPartIds.includes(
                      part.paymentPartId,
                    );

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
                              <ChevronDown
                                size={14}
                                color={colors.mutedForeground}
                              />
                            </Pressable>

                            {parts.length > 2 && (
                              <Pressable
                                style={styles.removeButton}
                                onPress={() => onRemovePart(part.paymentPartId)}
                              >
                                <X size={16} color={colors.mutedForeground} />
                              </Pressable>
                            )}
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
                              placeholderTextColor={colors.mutedForeground}
                            />
                          </View>

                          <View style={styles.methodFieldWrap}>
                            <Text style={styles.inlineLabel}>Method</Text>
                            <Dropdown
                              triggerStyle={styles.dropdownTrigger}
                              options={moneyAccountOptions}
                              value={part.settlementAccountRemoteId}
                              onChange={(value: string) =>
                                onChangePartSettlementAccount(
                                  part.paymentPartId,
                                  value,
                                )
                              }
                              placeholder="Select"
                            />
                          </View>
                        </View>

                        <View style={styles.rowQuickActions}>
                          <Pressable
                            style={styles.smallActionChip}
                            onPress={() => applyRemainingToPart(part.paymentPartId)}
                          >
                            <Text style={styles.smallActionChipText}>
                              Remaining
                            </Text>
                          </Pressable>

                          <Pressable
                            style={styles.smallActionChip}
                            onPress={() => applyHalfToPart(part.paymentPartId)}
                          >
                            <Text style={styles.smallActionChipText}>Half</Text>
                          </Pressable>

                          <Pressable
                            style={styles.smallActionChip}
                            onPress={() =>
                              onChangePartAmount(part.paymentPartId, "")
                            }
                          >
                            <Text style={styles.smallActionChipText}>Clear</Text>
                          </Pressable>
                        </View>

                        {isExpanded && (
                          <View style={styles.advancedSection}>
                            <Text style={styles.inlineLabel}>Payer Name</Text>
                            <TextInput
                              style={styles.nameInput}
                              placeholder="Optional"
                              value={part.payerLabel}
                              onChangeText={(value) =>
                                onChangePartPayerLabel(part.paymentPartId, value)
                              }
                              placeholderTextColor={colors.mutedForeground}
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.footer}>
              {remainingAmount > 0 ? (
                <Text style={styles.footerHint}>
                  Remaining amount can stay due only when a customer is selected.
                </Text>
              ) : null}

              <AppButton
                label="Complete Split Bill"
                size="lg"
                onPress={onSubmit}
                disabled={isSubmitDisabled}
                style={styles.submitButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: "center",
  },
  sheet: {
    width: "100%",
    maxHeight: "92%",
    minHeight: 460,
    alignSelf: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  header: {
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    color: colors.cardForeground,
    fontSize: 22,
    fontFamily: "InterBold",
  },
  subtitle: {
    marginTop: 4,
    color: colors.mutedForeground,
    fontSize: 13,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryPill: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  summaryPillLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterMedium",
  },
  summaryPillValue: {
    marginTop: 4,
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  remainingValue: {
    color: colors.primary,
  },
  quickSplitSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  quickSplitRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickChip: {
    minWidth: 52,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickChipText: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  addChip: {
    marginLeft: "auto",
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  addChipText: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  body: {
    flex: 1,
    minHeight: 0,
    paddingTop: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  errorBanner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#F2C7C7",
    backgroundColor: "#FDF1F1",
    padding: spacing.sm,
  },
  errorBannerText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterMedium",
    textAlign: "center",
  },
  partsSection: {
    gap: spacing.sm,
  },
  rowCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  rowHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  moreButton: {
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  moreButtonText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  inlineFieldsRow: {
    flexDirection: "row",
    gap: spacing.sm,
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
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterMedium",
  },
  amountInput: {
    minHeight: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
  },
  dropdownTrigger: {
    minHeight: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
  },
  rowQuickActions: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  smallActionChip: {
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  smallActionChipText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  advancedSection: {
    gap: 6,
  },
  nameInput: {
    minHeight: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  footerHint: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterMedium",
  },
  submitButton: {},
});
