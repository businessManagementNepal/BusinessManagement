import {
    InventoryAdjustmentReasonValue,
    InventoryMovementType,
    InventoryMovementTypeValue,
} from "@/feature/inventory/types/inventory.types";
import { InventoryMovementFormState } from "@/feature/inventory/viewModel/inventory.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { StyleSheet } from "react-native";

type InventoryMovementModalProps = {
  visible: boolean;
  editorType: InventoryMovementTypeValue;
  title: string;
  form: InventoryMovementFormState;
  canManage: boolean;
  currencyPrefix: string;
  productOptions: { label: string; value: string }[];
  adjustmentReasonOptions: readonly { label: string; value: InventoryAdjustmentReasonValue }[];
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
  onClose,
  onChange,
  onSubmit,
}: InventoryMovementModalProps) {
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
        <FormModalActionFooter>
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
        </FormModalActionFooter>
      }
    >
      <LabeledDropdownField
        label="Product"
        value={form.productRemoteId}
        options={productOptions}
        onChange={(value) => onChange("productRemoteId", value)}
        placeholder="Select product"
        modalTitle="Select product"
      />

      <LabeledTextInput
        label="Quantity"
        value={form.quantity}
        placeholder="0"
        keyboardType="decimal-pad"
        onChangeText={(value) => onChange("quantity", value)}
      />

      <LabeledTextInput
        label={`Unit Rate (${currencyPrefix})`}
        value={form.unitRate}
        placeholder="0"
        keyboardType="decimal-pad"
        onChangeText={(value) => onChange("unitRate", value)}
      />

      {editorType === InventoryMovementType.Adjustment ? (
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

      <LabeledTextInput
        label="Movement Date"
        value={form.movementDate}
        placeholder="YYYY-MM-DD"
        onChangeText={(value) => onChange("movementDate", value)}
      />

      <LabeledTextInput
        label="Remark"
        value={form.remark}
        placeholder="Optional remark"
        onChangeText={(value) => onChange("remark", value)}
        multiline={true}
        numberOfLines={4}
      />
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
});
