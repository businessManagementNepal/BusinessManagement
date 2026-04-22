import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { StyleSheet } from "react-native";

type PosQuickProductModalProps = {
  visible: boolean;
  name: string;
  salePrice: string;
  categoryName: string;
  fieldErrors: {
    name?: string;
    salePrice?: string;
  };
  onNameChange: (value: string) => void;
  onSalePriceChange: (value: string) => void;
  onCategoryNameChange: (value: string) => void;
  onCreate: () => void;
  onClose: () => void;
};

export function PosQuickProductModal({
  visible,
  name,
  salePrice,
  categoryName,
  fieldErrors,
  onNameChange,
  onSalePriceChange,
  onCategoryNameChange,
  onCreate,
  onClose,
}: PosQuickProductModalProps) {
  return (
    <FormSheetModal
      visible={visible}
      title="Create Product"
      subtitle="Quickly add a new product for direct selling"
      onClose={onClose}
      closeAccessibilityLabel="Close quick product form"
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
            label="Create Product"
            size="lg"
            style={styles.actionButton}
            onPress={onCreate}
          />
        </FormModalActionFooter>
      }
    >
      <LabeledTextInput
        label="Product Name *"
        value={name}
        placeholder="Product name *"
        onChangeText={onNameChange}
        autoCapitalize="words"
        errorText={fieldErrors.name}
      />

      <LabeledTextInput
        label="Sale Price"
        value={salePrice}
        placeholder="Sale price"
        keyboardType="decimal-pad"
        onChangeText={onSalePriceChange}
        errorText={fieldErrors.salePrice}
      />

      <LabeledTextInput
        label="Category"
        value={categoryName}
        placeholder="Category (optional)"
        onChangeText={onCategoryNameChange}
      />
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
