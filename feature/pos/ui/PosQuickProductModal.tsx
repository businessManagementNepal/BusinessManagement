import React from "react";
import { StyleSheet } from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { AppTextInput } from "@/shared/components/reusable/Form/AppTextInput";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { spacing } from "@/shared/components/theme/spacing";

type PosQuickProductModalProps = {
  visible: boolean;
  name: string;
  salePrice: string;
  categoryName: string;
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
      subtitle="Quickly add a product and assign it from POS"
      onClose={onClose}
      closeAccessibilityLabel="Close quick product form"
      presentation="dialog"
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
      <AppTextInput
        value={name}
        placeholder="Product name *"
        onChangeText={onNameChange}
        autoCapitalize="words"
      />
      <AppTextInput
        value={salePrice}
        placeholder="Sale price"
        keyboardType="decimal-pad"
        onChangeText={onSalePriceChange}
      />
      <AppTextInput
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
