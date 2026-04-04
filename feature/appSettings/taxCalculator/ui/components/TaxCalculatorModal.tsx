import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calculator, X } from "lucide-react-native";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { AppTextInput } from "@/shared/components/reusable/Form/AppTextInput";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import {
  TAX_CALCULATION_MODE_OPTIONS,
  TaxCalculationModeValue,
  TaxToolPresetOption,
} from "@/feature/appSettings/taxCalculator/types/taxCalculator.types";
import { TaxCalculationSummaryState } from "@/feature/appSettings/taxCalculator/viewModel/taxCalculator.viewModel";

type TaxCalculatorModalProps = {
  visible: boolean;
  amountInput: string;
  amountInputPlaceholder: string;
  selectedMode: TaxCalculationModeValue;
  selectedPresetCode: string;
  presetOptions: readonly TaxToolPresetOption[];
  errorMessage: string | null;
  calculationSummary: TaxCalculationSummaryState | null;
  onAmountChange: (value: string) => void;
  onModeChange: (value: TaxCalculationModeValue) => void;
  onPresetChange: (value: string) => void;
  onClose: () => void;
};

export function TaxCalculatorModal({
  visible,
  amountInput,
  amountInputPlaceholder,
  selectedMode,
  selectedPresetCode,
  presetOptions,
  errorMessage,
  calculationSummary,
  onAmountChange,
  onModeChange,
  onPresetChange,
  onClose,
}: TaxCalculatorModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Tax Calculator</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.segmentWrap}>
            {TAX_CALCULATION_MODE_OPTIONS.map((option) => {
              const isSelected = option.value === selectedMode;

              return (
                <Pressable
                  key={option.value}
                  style={[styles.segmentButton, isSelected ? styles.segmentButtonActive : null]}
                  onPress={() => onModeChange(option.value)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      isSelected ? styles.segmentLabelActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <AppTextInput
            value={amountInput}
            onChangeText={onAmountChange}
            keyboardType="decimal-pad"
            placeholder={amountInputPlaceholder}
            containerStyle={styles.inputWrap}
          />

          <Dropdown
            value={selectedPresetCode}
            options={[...presetOptions]}
            onChange={onPresetChange}
            placeholder="Select tax preset"
            modalTitle="Select tax preset"
            showLeadingIcon={false}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {calculationSummary ? (
            <Card style={styles.resultCard}>
              <View style={styles.resultHeaderRow}>
                <View style={styles.resultBadge}>
                  <Calculator size={14} color={colors.primary} />
                  <Text style={styles.resultBadgeText}>{calculationSummary.presetLabel}</Text>
                </View>
                <Text style={styles.resultModeText}>{calculationSummary.modeLabel}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Subtotal</Text>
                <Text style={styles.resultValue}>{calculationSummary.subtotalLabel}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Tax Amount</Text>
                <Text style={styles.resultValue}>{calculationSummary.taxAmountLabel}</Text>
              </View>
              <View style={[styles.resultRow, styles.resultRowTotal]}>
                <Text style={styles.resultTotalLabel}>Total Amount</Text>
                <Text style={styles.resultTotalValue}>{calculationSummary.totalAmountLabel}</Text>
              </View>
            </Card>
          ) : null}
        </View>
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
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  segmentWrap: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterSemiBold",
  },
  segmentLabelActive: {
    color: colors.primaryForeground,
  },
  inputWrap: {
    backgroundColor: colors.secondary,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "InterMedium",
  },
  resultCard: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderColor: colors.border,
  },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    minHeight: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  resultModeText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  resultRowTotal: {
    marginTop: 2,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  resultValue: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterSemiBold",
  },
  resultTotalLabel: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  resultTotalValue: {
    color: colors.primary,
    fontSize: 18,
    fontFamily: "InterBold",
  },
});
