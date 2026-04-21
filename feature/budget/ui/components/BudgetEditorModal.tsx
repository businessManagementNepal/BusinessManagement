import { BudgetViewModel } from "@/feature/budget/viewModel/budget.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";
import React, { useMemo } from "react";
import { StyleSheet, Text } from "react-native";

type BudgetEditorModalProps = {
  viewModel: BudgetViewModel;
};

export function BudgetEditorModal({
  viewModel,
}: BudgetEditorModalProps) {
  const { editorState } = viewModel;

  const categoryOptions = useMemo<DropdownOption[]>(
    () =>
      viewModel.categoryOptions.map((categoryOption) => ({
        label: categoryOption.label,
        value: categoryOption.remoteId,
      })),
    [viewModel.categoryOptions],
  );

  const title =
    editorState.mode === "create" ? "New Budget" : "Edit Budget";

  return (
    <FormSheetModal
      visible={editorState.visible}
      title={title}
      onClose={viewModel.onCloseEditor}
      closeAccessibilityLabel="Close budget editor"
      contentContainerStyle={styles.content}
      presentation="bottom-sheet"
      footer={
        <FormModalActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={viewModel.onCloseEditor}
            disabled={editorState.isSaving}
          />
          <AppButton
            label={editorState.isSaving ? "Saving..." : "Save Budget"}
            variant="primary"
            size="lg"
            style={styles.actionButton}
            onPress={() => void viewModel.onSubmit()}
            disabled={editorState.isSaving}
          />
        </FormModalActionFooter>
      }
    >
      <LabeledTextInput
        label="Budget Month *"
        value={editorState.budgetMonth}
        onChangeText={(value) =>
          viewModel.onEditorFieldChange("budgetMonth", value)
        }
        placeholder="YYYY-MM"
        editable={!editorState.isSaving}
      />

      <LabeledDropdownField
        label="Category"
        value={editorState.categoryRemoteId}
        options={categoryOptions}
        onChange={(value) =>
          viewModel.onEditorFieldChange("categoryRemoteId", String(value))
        }
        placeholder="Choose category"
        modalTitle="Select budget category"
        disabled={editorState.isSaving}
      />

      <LabeledTextInput
        label="Planned Amount *"
        value={editorState.plannedAmount}
        onChangeText={(value) =>
          viewModel.onEditorFieldChange("plannedAmount", value)
        }
        placeholder="0"
        keyboardType="decimal-pad"
        editable={!editorState.isSaving}
      />

      <LabeledTextInput
        label="Note"
        value={editorState.note}
        onChangeText={(value) => viewModel.onEditorFieldChange("note", value)}
        placeholder="Optional note"
        multiline={true}
        numberOfLines={4}
        editable={!editorState.isSaving}
      />

      {editorState.errorMessage ? (
        <Text style={styles.errorText}>{editorState.errorMessage}</Text>
      ) : null}
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "InterSemiBold",
  },
  actionButton: {
    flex: 1,
  },
});
