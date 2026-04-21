import {
    TransactionDirection,
    TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { TransactionEditorViewModel } from "@/feature/transactions/viewModel/transactionEditor.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  const moneyAccountOptions: DropdownOption[] = viewModel.moneyAccountOptions.map(
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
      />

      <LabeledTextInput
        label="Amount"
        value={state.amount}
        onChangeText={viewModel.onChangeAmount}
        placeholder="0"
        keyboardType="decimal-pad"
        editable={!state.isSaving}
      />

      <LabeledDropdownField
        label="Account"
        value={state.accountRemoteId}
        options={accountOptions}
        onChange={viewModel.onChangeAccountRemoteId}
        placeholder="Select account"
        modalTitle="Select account"
        disabled={state.isSaving}
      />

      <LabeledDropdownField
        label="Money Account"
        value={state.settlementMoneyAccountRemoteId}
        options={moneyAccountOptions}
        onChange={viewModel.onChangeSettlementMoneyAccountRemoteId}
        placeholder="Select money account"
        modalTitle="Select money account"
        disabled={state.isSaving}
      />

      <LabeledTextInput
        label="Category (optional)"
        value={state.categoryLabel}
        onChangeText={viewModel.onChangeCategoryLabel}
        placeholder="Example: Food, Salary, Transport"
        editable={!state.isSaving}
      />

      <LabeledTextInput
        label="Date"
        value={state.happenedAt}
        onChangeText={viewModel.onChangeHappenedAt}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        editable={!state.isSaving}
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

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterBold",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  typeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
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
