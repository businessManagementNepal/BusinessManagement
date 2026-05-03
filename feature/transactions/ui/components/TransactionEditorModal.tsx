import {
  TransactionDirection,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { TransactionEditorViewModel } from "@/feature/transactions/viewModel/transactionEditor.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { DualCalendarDatePicker } from "@/shared/components/reusable/Form/DualCalendarDatePicker";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TransactionEditorModalProps = {
  viewModel: TransactionEditorViewModel;
};

export function TransactionEditorModal({
  viewModel,
}: TransactionEditorModalProps) {
  const theme = useAppTheme();
  const { state } = viewModel;
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: theme.scaleSpace(spacing.sm),
          paddingBottom: theme.scaleSpace(spacing.xl),
        },
        fieldWrap: {
          gap: theme.scaleSpace(6),
        },
        fieldLabel: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(11),
          fontFamily: "InterBold",
          textTransform: "uppercase",
          letterSpacing: 0.45,
        },
        typeChipRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.scaleSpace(spacing.xs),
        },
        typeChip: {
          paddingHorizontal: theme.scaleSpace(12),
          paddingVertical: theme.scaleSpace(10),
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.secondary,
        },
        typeChipSelected: {
          backgroundColor: theme.isDarkMode
            ? theme.colors.accent
            : theme.colors.primary,
          borderColor: theme.isDarkMode
            ? theme.colors.foreground
            : theme.colors.primary,
        },
        typeChipText: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(16),
          fontFamily: "InterBold",
        },
        typeChipTextSelected: {
          color: theme.isDarkMode
            ? theme.colors.foreground
            : theme.colors.primaryForeground,
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(16),
          fontFamily: "InterSemiBold",
        },
        actionButton: {
          flex: 1,
        },
      }),
    [theme],
  );

  const accountOptions: DropdownOption[] = viewModel.accountOptions.map(
    (account) => ({
      label: account.label,
      value: account.remoteId,
    }),
  );
  const moneyAccountOptions: DropdownOption[] = viewModel.moneyAccountOptions.map(
    (account) => ({
      label: account.label,
      value: account.remoteId,
    }),
  );
  const categoryOptions: DropdownOption[] = viewModel.categoryOptions.map(
    (category) => ({
      label: category.label,
      value: category.remoteId,
    }),
  );

  const directionOptions: DropdownOption[] = viewModel.availableDirections.map(
    (option) => ({
      label: option.label,
      value: option.value,
    }),
  );

  const title = state.mode === "create" ? "Add Transaction" : "Edit Transaction";
  const showDirectionControl =
    state.type === TransactionType.Transfer ||
    state.type === TransactionType.Refund;

  return (
    <FormSheetModal
      visible={state.visible}
      title={title}
      subtitle="Save personal money movement"
      onClose={viewModel.close}
      closeAccessibilityLabel="Close transaction editor"
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
      footer={
        <FormModalActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={viewModel.close}
            disabled={state.isSaving}
          />
          <AppButton
            label={state.isSaving ? "Saving..." : "Save"}
            variant="primary"
            size="lg"
            style={styles.actionButton}
            onPress={() => void viewModel.submit()}
            disabled={state.isSaving}
          />
        </FormModalActionFooter>
      }
    >
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.typeChipRow}>
          {viewModel.availableTypes.map((typeOption) => {
            const isSelected = typeOption.value === state.type;

            return (
              <Pressable
                key={typeOption.value}
                style={[
                  styles.typeChip,
                  isSelected ? styles.typeChipSelected : null,
                ]}
                onPress={() => viewModel.onChangeType(typeOption.value)}
                disabled={state.isSaving}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    isSelected ? styles.typeChipTextSelected : null,
                  ]}
                >
                  {typeOption.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showDirectionControl ? (
        <LabeledDropdownField
          label="Direction"
          value={state.direction}
          options={directionOptions}
          onChange={(value) => {
            if (
              value === TransactionDirection.In ||
              value === TransactionDirection.Out
            ) {
              viewModel.onChangeDirection(value);
            }
          }}
          placeholder="Select direction"
          modalTitle="Select direction"
          disabled={state.isSaving}
        />
      ) : null}

      <LabeledTextInput
        label="Title"
        value={state.title}
        onChangeText={viewModel.onChangeTitle}
        placeholder="Example: Salary, House Rent, Grocery"
        editable={!state.isSaving}
        errorText={state.fieldErrors.title}
      />

      <LabeledTextInput
        label="Amount"
        value={state.amount}
        onChangeText={viewModel.onChangeAmount}
        placeholder="0"
        keyboardType="decimal-pad"
        editable={!state.isSaving}
        errorText={state.fieldErrors.amount}
      />

      <LabeledDropdownField
        label="Account"
        value={state.accountRemoteId}
        options={accountOptions}
        onChange={viewModel.onChangeAccountRemoteId}
        placeholder="Select account"
        modalTitle="Select account"
        disabled={state.isSaving}
        errorText={state.fieldErrors.accountRemoteId}
      />

      <LabeledDropdownField
        label="Money Account"
        value={state.settlementMoneyAccountRemoteId}
        options={moneyAccountOptions}
        onChange={viewModel.onChangeSettlementMoneyAccountRemoteId}
        placeholder="Select money account"
        modalTitle="Select money account"
        disabled={state.isSaving}
        errorText={state.fieldErrors.settlementMoneyAccountRemoteId}
      />

      {state.type !== TransactionType.Transfer ? (
        <LabeledDropdownField
          label="Category"
          value={state.categoryRemoteId}
          options={categoryOptions}
          onChange={viewModel.onChangeCategoryRemoteId}
          placeholder="Select category"
          modalTitle="Select category"
          disabled={state.isSaving}
          errorText={state.fieldErrors.categoryRemoteId}
        />
      ) : null}

      <DualCalendarDatePicker
        label="Date"
        value={state.happenedAt}
        onChangeText={viewModel.onChangeHappenedAt}
        placeholder="YYYY-MM-DD"
        editable={!state.isSaving}
        errorText={state.fieldErrors.happenedAt}
      />

      <LabeledTextInput
        label="Note (optional)"
        value={state.note}
        onChangeText={viewModel.onChangeNote}
        placeholder="Add a short note"
        editable={!state.isSaving}
        multiline={true}
        numberOfLines={4}
      />

      {state.errorMessage ? (
        <Text style={styles.errorText}>{state.errorMessage}</Text>
      ) : null}
    </FormSheetModal>
  );
}
