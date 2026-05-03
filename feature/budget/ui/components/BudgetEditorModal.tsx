import { BudgetViewModel } from "@/feature/budget/viewModel/budget.viewModel";
import { BudgetMonthPickerField } from "@/feature/budget/ui/components/BudgetMonthPickerField";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type BudgetEditorModalProps = {
  viewModel: BudgetViewModel;
};

export function BudgetEditorModal({
  viewModel,
}: BudgetEditorModalProps) {
  const styles = useThemedStyles(createStyles);
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
      sheetStyle={styles.sheet}
      presentation="bottom-sheet"
      footer={
        <FormModalActionFooter style={styles.footerActions}>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={viewModel.onCloseEditor}
            disabled={
              editorState.isSaving || viewModel.quickCategoryState.isSaving
            }
          />
          <AppButton
            label={editorState.isSaving ? "Saving..." : "Save Budget"}
            variant="primary"
            size="lg"
            style={styles.actionButton}
            onPress={() => void viewModel.onSubmit()}
            disabled={
              editorState.isSaving || viewModel.quickCategoryState.isSaving
            }
          />
        </FormModalActionFooter>
      }
    >
      <BudgetMonthPickerField
        label="Budget Month *"
        value={editorState.budgetMonth}
        onChange={(value) =>
          viewModel.onEditorFieldChange("budgetMonth", value)
        }
        disabled={editorState.isSaving}
      />

      <LabeledDropdownField
        label="Category"
        value={editorState.categoryRemoteId}
        options={categoryOptions}
        onChange={(value) =>
          viewModel.onEditorFieldChange("categoryRemoteId", String(value))
        }
        placeholder={
          categoryOptions.length > 0
            ? "Choose category"
            : "Add an expense category below first"
        }
        modalTitle="Select budget category"
        disabled={
          editorState.isSaving ||
          viewModel.quickCategoryState.isSaving ||
          categoryOptions.length === 0
        }
      />

      <View style={styles.quickCategoryCard}>
        <Text style={styles.quickCategoryTitle}>Add Expense Category</Text>
        <Text style={styles.quickCategoryHelper}>
          Create a category here when the budget needs a new spending bucket.
        </Text>
        <LabeledTextInput
          label="Category Name"
          value={viewModel.quickCategoryState.name}
          onChangeText={viewModel.onQuickCategoryNameChange}
          placeholder="Example: Groceries"
          editable={
            !editorState.isSaving && !viewModel.quickCategoryState.isSaving
          }
          errorText={viewModel.quickCategoryState.errorMessage ?? undefined}
        />
        <AppButton
          label={
            viewModel.quickCategoryState.isSaving
              ? "Adding..."
              : "Add Category"
          }
          variant="secondary"
          size="md"
          style={styles.quickCategoryButton}
          onPress={() => void viewModel.onCreateQuickExpenseCategory()}
          disabled={
            editorState.isSaving ||
            viewModel.quickCategoryState.isSaving ||
            viewModel.quickCategoryState.name.trim().length === 0
          }
        />
      </View>

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

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    sheet: {
      alignSelf: "stretch",
      width: "100%",
    },
    content: {
      gap: theme.scaleSpace(spacing.sm),
      paddingBottom: theme.scaleSpace(spacing.xl),
    },
    quickCategoryCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.scaleSpace(14),
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.xs),
    },
    quickCategoryTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterBold",
    },
    quickCategoryHelper: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
    quickCategoryButton: {
      width: "100%",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterSemiBold",
    },
    footerActions: {
      alignSelf: "stretch",
      width: "100%",
    },
    actionButton: {
      flex: 1,
      minWidth: 0,
    },
  });
