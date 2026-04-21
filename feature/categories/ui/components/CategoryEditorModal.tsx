import { CategoryKind, CategoryKindValue } from "@/feature/categories/types/category.types";
import { CategoryFormState } from "@/feature/categories/viewModel/categories.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { StyleSheet } from "react-native";

const CATEGORY_KIND_OPTIONS = [
  { label: "Income", value: CategoryKind.Income },
  { label: "Expense", value: CategoryKind.Expense },
  { label: "Business", value: CategoryKind.Business },
  { label: "Product", value: CategoryKind.Product },
] as const;

type Props = {
  visible: boolean;
  title: string;
  form: CategoryFormState;
  allowedKinds: readonly CategoryKindValue[];
  isEditMode: boolean;
  isDeleting: boolean;
  canDelete: boolean;
  onClose: () => void;
  onChange: (field: keyof CategoryFormState, value: string) => void;
  onSubmit: () => Promise<void>;
  onDelete: () => void;
};

export function CategoryEditorModal({
  visible,
  title,
  form,
  allowedKinds,
  isEditMode,
  isDeleting,
  canDelete,
  onClose,
  onChange,
  onSubmit,
  onDelete,
}: Props): React.ReactElement {
  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Manage category details"
      onClose={onClose}
      closeAccessibilityLabel="Close category editor"
      contentContainerStyle={styles.content}
      presentation="dialog"
      footer={
        <FormModalActionFooter>
          {isEditMode ? (
            <AppButton
              label={isDeleting ? "Deleting..." : "Delete"}
              variant="secondary"
              size="lg"
              style={[styles.actionButton, styles.deleteActionButton]}
              labelStyle={styles.deleteActionLabel}
              onPress={onDelete}
              disabled={!canDelete || isDeleting}
            />
          ) : null}
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={onClose}
          />
          <AppButton
            label="Save Category"
            variant="primary"
            size="lg"
            style={styles.actionButton}
            onPress={() => void onSubmit()}
          />
        </FormModalActionFooter>
      }
    >
      <LabeledTextInput
        label="Category Name"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        placeholder="Category Name"
      />

      <LabeledDropdownField
        label="Type"
        value={form.kind}
        options={CATEGORY_KIND_OPTIONS.filter((item) => allowedKinds.includes(item.value))}
        onChange={(value) => onChange("kind", value)}
        placeholder="Choose category type"
        modalTitle="Choose category type"
      />

      <LabeledTextInput
        label="Description"
        value={form.description}
        onChangeText={(value) => onChange("description", value)}
        placeholder="Description"
        multiline={true}
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
  deleteActionButton: {
    borderColor: colors.destructive,
    backgroundColor: "#FDECEC",
  },
  deleteActionLabel: {
    color: colors.destructive,
  },
});
