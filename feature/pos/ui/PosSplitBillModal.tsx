import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Plus, X } from "lucide-react-native";
import React from "react";
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
  const isSubmitDisabled = parts.length < 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Split Bill</Text>
                <Text style={styles.subtitle}>
                  Split the total across multiple payments
                </Text>
              </View>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <X size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Grand Total</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(grandTotal, currencyCode, countryCode)}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Allocated</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(allocatedAmount, currencyCode, countryCode)}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelStrong}>Remaining</Text>
                  <Text style={styles.summaryValueStrong}>
                    {formatCurrency(remainingAmount, currencyCode, countryCode)}
                  </Text>
                </View>
              </View>

              <View style={styles.quickSplitSection}>
                <Text style={styles.sectionTitle}>Quick Split</Text>
                <View style={styles.quickSplitRow}>
                  <Pressable
                    style={styles.quickSplitButton}
                    onPress={() => onApplyEqualSplit(2)}
                  >
                    <Text style={styles.quickSplitButtonText}>Split 2</Text>
                  </Pressable>
                  <Pressable
                    style={styles.quickSplitButton}
                    onPress={() => onApplyEqualSplit(3)}
                  >
                    <Text style={styles.quickSplitButtonText}>Split 3</Text>
                  </Pressable>
                  <Pressable
                    style={styles.quickSplitButton}
                    onPress={() => onApplyEqualSplit(4)}
                  >
                    <Text style={styles.quickSplitButtonText}>Split 4</Text>
                  </Pressable>
                </View>
              </View>

              {!!errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              <View style={styles.partsSection}>
                <Text style={styles.sectionTitle}>Payment Parts</Text>

                {parts.map((part, index) => (
                  <View key={part.paymentPartId} style={styles.partCard}>
                    <View style={styles.partCardHeader}>
                      <Text
                        style={styles.partCardTitle}
                      >{`Part ${index + 1}`}</Text>
                      {parts.length > 2 && (
                        <Pressable
                          style={styles.removePartButton}
                          onPress={() => onRemovePart(part.paymentPartId)}
                        >
                          <X size={16} color={colors.mutedForeground} />
                        </Pressable>
                      )}
                    </View>

                    <View style={styles.partFields}>
                      <View style={styles.fieldWrap}>
                        <Text style={styles.fieldLabel}>Payer Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter payer name"
                          value={part.payerLabel}
                          onChangeText={(value) =>
                            onChangePartPayerLabel(part.paymentPartId, value)
                          }
                          placeholderTextColor={colors.mutedForeground}
                        />
                      </View>

                      <View style={styles.fieldWrap}>
                        <Text style={styles.fieldLabel}>Amount</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="0"
                          value={part.amountInput}
                          onChangeText={(value) =>
                            onChangePartAmount(part.paymentPartId, value)
                          }
                          keyboardType="numeric"
                          placeholderTextColor={colors.mutedForeground}
                        />
                      </View>

                      <View style={styles.fieldWrap}>
                        <Text style={styles.fieldLabel}>
                          Settlement Account
                        </Text>
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
                          placeholder="Select account"
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <Pressable style={styles.addPartButton} onPress={onAddPart}>
                  <Plus size={18} color={colors.cardForeground} />
                  <Text style={styles.addPartButtonText}>Add Part</Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.footer}>
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
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  sheetWrap: {
    width: "100%",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.cardForeground,
    fontSize: 22,
    fontFamily: "InterBold",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.mutedForeground,
    fontFamily: "InterMedium",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  summaryValue: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  summaryLabelStrong: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  summaryValueStrong: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  quickSplitSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  quickSplitRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickSplitButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  quickSplitButtonText: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
  },
  errorBanner: {
    backgroundColor: "#FDF1F1",
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "#F2C7C7",
  },
  errorBannerText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterMedium",
    textAlign: "center",
  },
  partsSection: {
    gap: spacing.md,
  },
  partCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  partCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  partCardTitle: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  removePartButton: {
    padding: spacing.xs,
  },
  partFields: {
    gap: spacing.md,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  input: {
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterMedium",
  },
  dropdownTrigger: {
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
  },
  addPartButton: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    gap: spacing.sm,
  },
  addPartButtonText: {
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
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
