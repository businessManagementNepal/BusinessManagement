import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";
import {
  MONEY_ACCOUNT_TYPE_OPTIONS,
} from "@/feature/accounts/types/moneyAccount.types";
import { MoneyAccountsViewModel } from "@/feature/accounts/viewModel/moneyAccounts.viewModel";

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

      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Account Type</Text>
        <Dropdown
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
          showLeadingIcon={false}
        />
      </View>

      <LabeledTextInput
        label={`Balance (${viewModel.currencyLabel})`}
        value={viewModel.form.balance}
        onChangeText={(value) => viewModel.onFormChange("balance", value)}
        placeholder="0"
        keyboardType="decimal-pad"
      />

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
  fieldWrap: {
    gap: 6,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterBold",
    textTransform: "uppercase",
    letterSpacing: 0.45,
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
  deleteActionButton: {
    borderColor: colors.destructive,
    backgroundColor: "#FDECEC",
  },
  deleteActionLabel: {
    color: colors.destructive,
  },
});
