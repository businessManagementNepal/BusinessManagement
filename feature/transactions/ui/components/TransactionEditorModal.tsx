import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { TransactionEditorViewModel } from "@/feature/transactions/viewModel/transactionEditor.viewModel";
import {
  TransactionDirection,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";

type TransactionEditorModalProps = {
  viewModel: TransactionEditorViewModel;
};

export function TransactionEditorModal({
  viewModel,
}: TransactionEditorModalProps) {
  const { state } = viewModel;

  const accountOptions: DropdownOption[] = viewModel.accountOptions.map(
    (account) => ({
      label: account.label,
      value: account.remoteId,
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
      <Text style={styles.sectionLabel}>Type</Text>
      <View style={styles.typeChipRow}>
        {viewModel.availableTypes.map((typeOption) => {
          const isSelected = typeOption.value === state.type;

          return (
            <Pressable
              key={typeOption.value}
              style={[styles.typeChip, isSelected ? styles.typeChipSelected : null]}
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

      {showDirectionControl ? (
        <>
          <Text style={styles.inputLabel}>Direction</Text>
          <Dropdown
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
            showLeadingIcon={false}
          />
        </>
      ) : null}

      <Text style={styles.inputLabel}>Title</Text>
      <TextInput
        value={state.title}
        onChangeText={viewModel.onChangeTitle}
        placeholder="Example: Salary, House Rent, Grocery"
        placeholderTextColor={colors.mutedForeground}
        style={styles.input}
        editable={!state.isSaving}
      />

      <Text style={styles.inputLabel}>Amount</Text>
      <TextInput
        value={state.amount}
        onChangeText={viewModel.onChangeAmount}
        placeholder="0"
        placeholderTextColor={colors.mutedForeground}
        style={styles.input}
        keyboardType="decimal-pad"
        editable={!state.isSaving}
      />

      <Text style={styles.inputLabel}>Account</Text>
      <Dropdown
        value={state.accountRemoteId}
        options={accountOptions}
        onChange={viewModel.onChangeAccountRemoteId}
        placeholder="Select account"
        modalTitle="Select account"
        showLeadingIcon={false}
      />

      <Text style={styles.inputLabel}>Category (optional)</Text>
      <TextInput
        value={state.categoryLabel}
        onChangeText={viewModel.onChangeCategoryLabel}
        placeholder="Example: Food, Salary, Transport"
        placeholderTextColor={colors.mutedForeground}
        style={styles.input}
        editable={!state.isSaving}
      />

      <Text style={styles.inputLabel}>Date</Text>
      <TextInput
        value={state.happenedAt}
        onChangeText={viewModel.onChangeHappenedAt}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.mutedForeground}
        style={styles.input}
        autoCapitalize="none"
        editable={!state.isSaving}
      />

      <Text style={styles.inputLabel}>Note (optional)</Text>
      <TextInput
        value={state.note}
        onChangeText={viewModel.onChangeNote}
        placeholder="Add a short note"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, styles.noteInput]}
        editable={!state.isSaving}
        multiline={true}
        textAlignVertical="top"
      />

      {state.errorMessage ? (
        <Text style={styles.errorText}>{state.errorMessage}</Text>
      ) : null}
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xs,
  },
  sectionLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginBottom: 6,
  },
  typeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    color: colors.cardForeground,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  typeChipTextSelected: {
    color: colors.primaryForeground,
  },
  inputLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginBottom: 6,
    marginTop: spacing.xs,
  },
  input: {
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    color: colors.cardForeground,
    fontSize: 14,
  },
  noteInput: {
    minHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
