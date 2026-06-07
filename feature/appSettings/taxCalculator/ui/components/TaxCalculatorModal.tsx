import {
  TAX_CALCULATION_MODE_OPTIONS,
  TaxCalculationModeValue,
  TaxToolPresetOption,
} from "@/feature/appSettings/taxCalculator/types/taxCalculator.types";
import { TaxCalculationSummaryState } from "@/feature/appSettings/taxCalculator/viewModel/taxCalculator.viewModel";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { Calculator } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <FormSheetModal
      visible={visible}
      title="Tax Calculator"
      onClose={onClose}
      closeAccessibilityLabel="Close tax calculator"
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
    >
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

      <LabeledTextInput
        label="Amount"
        value={amountInput}
        onChangeText={onAmountChange}
        keyboardType="decimal-pad"
        placeholder={amountInputPlaceholder}
      />

      <LabeledDropdownField
        label="Tax Preset"
        value={selectedPresetCode}
        options={[...presetOptions]}
        onChange={onPresetChange}
        placeholder="Select tax preset"
        modalTitle="Select tax preset"
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {calculationSummary ? (
        <Card style={styles.resultCard}>
          <View style={styles.resultHeaderRow}>
            <View style={styles.resultBadge}>
              <Calculator size={14} color={theme.colors.primary} />
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
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
      paddingBottom: theme.scaleSpace(spacing.xl),
    },
    segmentWrap: {
      backgroundColor: theme.colors.secondary,
      borderRadius: radius.lg,
      padding: theme.scaleSpace(4),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(4),
    },
    segmentButton: {
      flex: 1,
      minHeight: theme.scaleSpace(40),
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    segmentLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterSemiBold",
    },
    segmentLabelActive: {
      color: theme.colors.primaryForeground,
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterMedium",
    },
    resultCard: {
      padding: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.sm),
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.border,
    },
    resultHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    resultBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(6),
      paddingHorizontal: theme.scaleSpace(spacing.sm),
      minHeight: theme.scaleSpace(28),
      borderRadius: radius.pill,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    resultBadgeText: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(12),
      fontFamily: "InterBold",
    },
    resultModeText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterSemiBold",
    },
    resultRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    resultRowTotal: {
      marginTop: theme.scaleSpace(2),
      paddingTop: theme.scaleSpace(spacing.sm),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    resultLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterMedium",
    },
    resultValue: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterSemiBold",
    },
    resultTotalLabel: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    resultTotalValue: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(18),
      fontFamily: "InterBold",
    },
  });
