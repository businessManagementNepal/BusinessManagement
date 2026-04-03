import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import {
  InventoryAdjustmentReasonValue,
  InventoryMovementType,
  InventoryMovementTypeValue,
} from "@/feature/inventory/types/inventory.types";
import { InventoryMovementFormState } from "@/feature/inventory/viewModel/inventory.viewModel";

type InventoryMovementModalProps = {
  visible: boolean;
  editorType: InventoryMovementTypeValue;
  title: string;
  form: InventoryMovementFormState;
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
      presentation="dialog"
      contentContainerStyle={styles.content}
    >
      <View style={styles.fieldWrap}>
        <Text style={styles.inputLabel}>Product</Text>
        <Dropdown
          value={form.productRemoteId}
          options={productOptions}
          onChange={(value) => onChange("productRemoteId", value)}
          placeholder="Select product"
          modalTitle="Select product"
          showLeadingIcon={false}
          triggerStyle={styles.dropdownTrigger}
          triggerTextStyle={styles.dropdownText}
        />
      </View>

      <View style={styles.doubleRow}>
        <LabeledTextInput
          label="Quantity"
          value={form.quantity}
          placeholder="0"
          keyboardType="decimal-pad"
          onChangeText={(value) => onChange("quantity", value)}
          containerStyle={styles.flexOne}
        />

        <LabeledTextInput
          label="Unit Rate (NPR)"
          value={form.unitRate}
          placeholder="0"
          keyboardType="decimal-pad"
          onChangeText={(value) => onChange("unitRate", value)}
          containerStyle={styles.flexOne}
        />
      </View>

      {editorType === InventoryMovementType.Adjustment ? (
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>Adjustment Reason</Text>
          <Dropdown
            value={form.reason}
            options={adjustmentReasonOptions.map((adjustmentReasonOption) => ({
              label: adjustmentReasonOption.label,
              value: adjustmentReasonOption.value,
            }))}
            onChange={(value) => onChange("reason", value)}
            placeholder="Select reason"
            modalTitle="Select adjustment reason"
            showLeadingIcon={false}
            triggerStyle={styles.dropdownTrigger}
            triggerTextStyle={styles.dropdownText}
          />
        </View>
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

      <AppButton
        label="Save"
        size="lg"
        onPress={() => {
          void onSubmit();
        }}
      />
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  fieldWrap: {
    gap: 6,
  },
  inputLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterBold",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  dropdownTrigger: {
    minHeight: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    borderColor: colors.border,
  },
  dropdownText: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
  },
  doubleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexOne: {
    flex: 1,
  },
});
