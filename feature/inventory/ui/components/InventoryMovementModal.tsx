import {
  InventoryAdjustmentDirectionValue,
  InventoryAdjustmentReason,
  InventoryAdjustmentReasonValue,
  InventoryMovementType,
  InventoryMovementTypeValue,
} from "@/feature/inventory/types/inventory.types";
import {
  InventoryMovementFormState,
  InventoryStockPreview,
} from "@/feature/inventory/viewModel/inventory.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { DualCalendarDatePicker } from "@/shared/components/reusable/Form/DualCalendarDatePicker";
import {
  DefaultSection,
  MoreDetailsSection,
} from "@/shared/components/reusable/Form/FormSections";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { StickyActionFooter } from "@/shared/components/reusable/Form/StickyActionFooter";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type InventoryMovementModalProps = {
  visible: boolean;
  editorType: InventoryMovementTypeValue;
  title: string;
  form: InventoryMovementFormState;
  canManage: boolean;
  currencyPrefix: string;
  productOptions: { label: string; value: string }[];
  adjustmentReasonOptions: readonly { label: string; value: InventoryAdjustmentReasonValue }[];
  adjustmentDirectionOptions: readonly {
    label: string;
    value: InventoryAdjustmentDirectionValue;
  }[];
  stockPreview: InventoryStockPreview | null;
  onClose: () => void;
  onChange: (field: keyof InventoryMovementFormState, value: string) => void;
  onSubmit: () => Promise<void>;
};

export function InventoryMovementModal({
  visible,
  editorType,
  title,
  form,
  canManage,
  currencyPrefix,
  productOptions,
  adjustmentReasonOptions,
  adjustmentDirectionOptions,
  stockPreview,
  onClose,
  onChange,
  onSubmit,
}: InventoryMovementModalProps) {
  const styles = useThemedStyles(createStyles);
  const shouldExpandMoreDetails = form.remark.trim().length > 0;
  const isAdjustment = editorType === InventoryMovementType.Adjustment;
  const isCountCorrection =
    isAdjustment && form.reason === InventoryAdjustmentReason.Correction;
  const isOtherAdjustment =
    isAdjustment && form.reason === InventoryAdjustmentReason.Other;
  const quantityLabel = isCountCorrection ? "Actual Stock Count" : "Quantity";

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Record stock movement details"
      onClose={onClose}
      closeAccessibilityLabel="Close inventory movement editor"
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
      footer={
        <StickyActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={onClose}
          />
          <AppButton
            label="Save"
            size="lg"
            style={styles.actionButton}
            onPress={() => {
              void onSubmit();
            }}
            disabled={!canManage}
          />
        </StickyActionFooter>
      }
    >
      <DefaultSection
        title="Movement Details"
        subtitle="Product, quantity, value, and movement date stay visible by default."
      >
        <LabeledDropdownField
          label="Product"
          value={form.productRemoteId}
          options={productOptions}
          onChange={(value) => onChange("productRemoteId", value)}
          placeholder="Select product"
          modalTitle="Select product"
        />

        {isAdjustment ? (
          <LabeledDropdownField
            label="Adjustment Reason"
            value={form.reason}
            options={adjustmentReasonOptions.map((adjustmentReasonOption) => ({
              label: adjustmentReasonOption.label,
              value: adjustmentReasonOption.value,
            }))}
            onChange={(value) => onChange("reason", value)}
            placeholder="Select reason"
            modalTitle="Select adjustment reason"
          />
        ) : null}

        {isOtherAdjustment ? (
          <LabeledDropdownField
            label="Stock Effect"
            value={form.adjustmentDirection}
            options={adjustmentDirectionOptions.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            onChange={(value) => onChange("adjustmentDirection", value)}
            placeholder="Add or remove stock"
            modalTitle="Select stock effect"
          />
        ) : null}

        <LabeledTextInput
          label={quantityLabel}
          value={form.quantity}
          placeholder={isCountCorrection ? "Enter physical stock count" : "0"}
          keyboardType="decimal-pad"
          onChangeText={(value) => onChange("quantity", value)}
        />

        {stockPreview ? (
          <View style={styles.stockPreviewCard}>
            <View style={styles.stockPreviewRow}>
              <Text style={styles.stockPreviewLabel}>Current Stock</Text>
              <Text style={styles.stockPreviewValue}>
                {stockPreview.currentStock} {stockPreview.unitLabel}
              </Text>
            </View>
            <View style={styles.stockPreviewRow}>
              <Text style={styles.stockPreviewLabel}>Change</Text>
              <Text
                style={[
                  styles.stockPreviewValue,
                  stockPreview.deltaQuantity < 0
                    ? styles.negativeValue
                    : stockPreview.deltaQuantity > 0
                      ? styles.positiveValue
                      : null,
                ]}
              >
                {stockPreview.deltaQuantity > 0 ? "+" : ""}
                {stockPreview.deltaQuantity} {stockPreview.unitLabel}
              </Text>
            </View>
            <View style={styles.stockPreviewDivider} />
            <View style={styles.stockPreviewRow}>
              <Text style={styles.stockPreviewStrongLabel}>Stock After</Text>
              <Text style={styles.stockPreviewStrongValue}>
                {stockPreview.resultingStock} {stockPreview.unitLabel}
              </Text>
            </View>
          </View>
        ) : null}

        <LabeledTextInput
          label={`Unit Rate (${currencyPrefix})`}
          value={form.unitRate}
          placeholder="0"
          keyboardType="decimal-pad"
          onChangeText={(value) => onChange("unitRate", value)}
        />

        <DualCalendarDatePicker
          label="Movement Date"
          value={form.movementDate}
          placeholder="YYYY-MM-DD"
          onChangeText={(value) => onChange("movementDate", value)}
        />
      </DefaultSection>

      <MoreDetailsSection
        title="More Details"
        subtitle="Optional movement remark."
        defaultExpanded={shouldExpandMoreDetails}
      >
        <LabeledTextInput
          label="Remark"
          value={form.remark}
          placeholder="Optional remark"
          onChangeText={(value) => onChange("remark", value)}
          multiline={true}
          numberOfLines={4}
        />
      </MoreDetailsSection>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.md),
      paddingBottom: theme.scaleSpace(spacing.xl),
    },
    stockPreviewCard: {
      gap: theme.scaleSpace(spacing.sm),
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.scaleSpace(12),
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
    },
    stockPreviewRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.md),
    },
    stockPreviewDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    stockPreviewLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
    },
    stockPreviewValue: {
      color: theme.colors.cardForeground,
      fontFamily: "InterMedium",
      fontSize: theme.scaleText(13),
    },
    stockPreviewStrongLabel: {
      color: theme.colors.cardForeground,
      fontFamily: "InterBold",
      fontSize: theme.scaleText(13),
    },
    stockPreviewStrongValue: {
      color: theme.colors.cardForeground,
      fontFamily: "InterBold",
      fontSize: theme.scaleText(14),
    },
    negativeValue: {
      color: theme.colors.destructive,
    },
    positiveValue: {
      color: theme.colors.success,
    },
    actionButton: {
      flex: 1,
    },
  });
