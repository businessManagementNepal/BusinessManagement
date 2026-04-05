import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { ChipSelectorField } from "@/shared/components/reusable/Form/ChipSelectorField";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { LedgerEditorViewModel } from "@/feature/ledger/viewModel/ledgerEditor.viewModel";
import { shouldShowDirectionSelector } from "@/feature/ledger/viewModel/ledger.shared";

type LedgerEntryEditorModalProps = {
  viewModel: LedgerEditorViewModel;
};

export function LedgerEntryEditorModal({
  viewModel,
}: LedgerEntryEditorModalProps) {
  const { state } = viewModel;

  const accountOptions: DropdownOption[] = viewModel.accountOptions.map((account) => ({
    label: account.label,
    value: account.remoteId,
  }));

  const directionOptions: DropdownOption[] = viewModel.availableDirections.map(
    (option) => ({
      label: option.label,
      value: option.value,
    }),
  );

  const entryTypeOptions = viewModel.availableEntryTypes;

  const title = state.mode === "create" ? "Add Ledger Entry" : "Edit Ledger Entry";

  return (
    <FormSheetModal
      visible={state.visible}
      title={title}
      subtitle="Save sale, purchase, due, or settlement entry"
      onClose={viewModel.close}
      closeAccessibilityLabel="Close ledger entry editor"
      contentContainerStyle={styles.content}
      presentation="dialog"
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
      <ChipSelectorField
        label="Entry Type"
        options={entryTypeOptions}
        selectedValue={state.entryType}
        onSelect={viewModel.onChangeEntryType}
        disabled={state.isSaving}
      />

      {shouldShowDirectionSelector(state.entryType) ? (
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>Impact</Text>
          <Dropdown
            value={state.balanceDirection}
            options={directionOptions}
            onChange={(value) => {
              if (value === "receive" || value === "pay") {
                viewModel.onChangeBalanceDirection(value);
              }
            }}
            placeholder="Select impact"
            modalTitle="Choose impact"
            showLeadingIcon={false}
            triggerStyle={styles.dropdownTrigger}
            triggerTextStyle={styles.dropdownTriggerText}
            disabled={state.isSaving}
          />
        </View>
      ) : null}

      <LabeledTextInput
        label="Party Name"
        value={state.partyName}
        onChangeText={viewModel.onChangePartyName}
        placeholder="Enter customer or supplier name"
        editable={!state.isSaving}
      />

      <LabeledTextInput
        label="Party Phone"
        value={state.partyPhone}
        onChangeText={viewModel.onChangePartyPhone}
        placeholder="Optional phone number"
        keyboardType="phone-pad"
        editable={!state.isSaving}
      />

      <LabeledTextInput
        label="Title"
        value={state.title}
        onChangeText={viewModel.onChangeTitle}
        placeholder="Example: Rice sale"
        editable={!state.isSaving}
      />

      <LabeledTextInput
        label="Amount"
        value={state.amount}
        onChangeText={viewModel.onChangeAmount}
        placeholder="0"
        keyboardType="numeric"
        editable={!state.isSaving}
      />

      <LabeledTextInput
        label="Date"
        value={state.happenedAt}
        onChangeText={viewModel.onChangeHappenedAt}
        placeholder="YYYY-MM-DD"
        editable={!state.isSaving}
      />

      <LabeledTextInput
        label="Due Date"
        value={state.dueAt}
        onChangeText={viewModel.onChangeDueAt}
        placeholder="YYYY-MM-DD"
        editable={!state.isSaving}
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.inputLabel}>Money Account</Text>
        <Dropdown
          value={state.settlementAccountRemoteId}
          options={accountOptions}
          onChange={viewModel.onChangeSettlementAccountRemoteId}
          placeholder="Optional settlement account"
          modalTitle="Choose money account"
          showLeadingIcon={false}
          triggerStyle={styles.dropdownTrigger}
          triggerTextStyle={styles.dropdownTriggerText}
          disabled={state.isSaving}
        />
      </View>

      <LabeledTextInput
        label="Note"
        value={state.note}
        onChangeText={viewModel.onChangeNote}
        placeholder="Optional note"
        multiline={true}
        numberOfLines={4}
        editable={!state.isSaving}
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
  dropdownTriggerText: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
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
