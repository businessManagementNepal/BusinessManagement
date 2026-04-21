import {
    MONEY_ACCOUNT_TYPE_OPTIONS,
} from "@/feature/accounts/types/moneyAccount.types";
import { MoneyAccountsViewModel } from "@/feature/accounts/viewModel/moneyAccounts.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
    DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type MoneyAccountEditorModalProps = {
  viewModel: MoneyAccountsViewModel;
};

export function MoneyAccountEditorModal({
  viewModel,
}: MoneyAccountEditorModalProps): React.ReactElement {
  const accountTypeOptions: DropdownOption[] = MONEY_ACCOUNT_TYPE_OPTIONS.map(
    (option) => ({
      label: option.label,
      value: option.value,
    }),
  );

  const title =
    viewModel.editorMode === "create" ? "New Account" : "Edit Account";
  const isOpeningBalanceEditable = viewModel.editorMode === "create";

  return (
    <FormSheetModal
      visible={viewModel.isEditorVisible}
      title={title}
      onClose={viewModel.onCloseEditor}
      closeAccessibilityLabel="Close account editor"
      contentContainerStyle={styles.content}
      footer={
        <FormModalActionFooter>
          {viewModel.editorMode === "edit" ? (
            <AppButton
              label={viewModel.isDeleting ? "Deleting..." : "Delete"}
              variant="secondary"
              size="lg"
              style={[styles.actionButton, styles.deleteActionButton]}
              labelStyle={styles.deleteActionLabel}
              onPress={viewModel.onRequestDeleteCurrent}
              disabled={!viewModel.canDeleteCurrent || viewModel.isDeleting}
            />
          ) : null}
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={viewModel.onCloseEditor}
          />
          <AppButton
            label="Save Account"
            variant="primary"
            size="lg"
            style={styles.actionButton}
            onPress={() => void viewModel.onSubmit()}
            disabled={!viewModel.canManage}
          />
        </FormModalActionFooter>
      }
    >
      <LabeledTextInput
        label="Account Name *"
        value={viewModel.form.name}
        onChangeText={(value) => viewModel.onFormChange("name", value)}
        placeholder="Account Name"
      />

      <LabeledDropdownField
        label="Account Type"
        value={viewModel.form.type}
        options={accountTypeOptions}
        onChange={(value) => {
          if (
            value === "cash" ||
            value === "bank" ||
            value === "wallet"
          ) {
            viewModel.onFormChange("type", value);
          }
        }}
        placeholder="Select type"
        modalTitle="Choose account type"
      />

      <LabeledTextInput
        label={`${
          isOpeningBalanceEditable ? "Opening Balance" : "Current Balance"
        } (${viewModel.currencyLabel})`}
        value={viewModel.form.balance}
        onChangeText={(value) => viewModel.onFormChange("balance", value)}
        placeholder="0"
        keyboardType="decimal-pad"
        editable={isOpeningBalanceEditable}
        helperText={
          isOpeningBalanceEditable
            ? "Set the starting amount for this cash, bank, or wallet account."
            : "Current balance changes through posted money movements."
        }
      />

      {!isOpeningBalanceEditable ? (
        <View style={styles.balanceActionRow}>
          <AppButton
            label="View History"
            variant="secondary"
            size="md"
            style={styles.balanceActionButton}
            onPress={viewModel.onOpenHistoryForCurrent}
          />
          <AppButton
            label="Correct Balance"
            variant="secondary"
            size="md"
            style={styles.balanceActionButton}
            onPress={viewModel.onOpenAdjustmentForCurrent}
            disabled={!viewModel.canManage}
          />
        </View>
      ) : null}

      <LabeledTextInput
        label="Description"
        value={viewModel.form.description}
        onChangeText={(value) => viewModel.onFormChange("description", value)}
        placeholder="Description"
        multiline={true}
        numberOfLines={4}
      />

      {viewModel.errorMessage ? (
        <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
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
  balanceActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  balanceActionButton: {
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
