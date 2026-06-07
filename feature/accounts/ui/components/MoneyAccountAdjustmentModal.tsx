import { MoneyAccountsViewModel } from "@/feature/accounts/viewModel/moneyAccounts.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { DefaultSection } from "@/shared/components/reusable/Form/FormSections";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { StickyActionFooter } from "@/shared/components/reusable/Form/StickyActionFooter";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet, Text } from "react-native";

type MoneyAccountAdjustmentModalProps = {
  viewModel: MoneyAccountsViewModel;
};

export function MoneyAccountAdjustmentModal({
  viewModel,
}: MoneyAccountAdjustmentModalProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);

  return (
    <FormSheetModal
      visible={viewModel.isAdjustmentModalVisible}
      title="Correct Balance"
      subtitle={viewModel.adjustmentForm.accountName}
      onClose={viewModel.onCloseAdjustment}
      closeAccessibilityLabel="Close balance correction"
      contentContainerStyle={styles.content}
      footer={
        <StickyActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={viewModel.onCloseAdjustment}
            disabled={viewModel.adjustmentForm.isSaving}
          />
          <AppButton
            label={
              viewModel.adjustmentForm.isSaving
                ? "Saving..."
                : "Apply Correction"
            }
            variant="primary"
            size="lg"
            style={styles.actionButton}
            onPress={() => void viewModel.onSubmitAdjustment()}
            disabled={!viewModel.canManage || viewModel.adjustmentForm.isSaving}
          />
        </StickyActionFooter>
      }
    >
      <DefaultSection
        title="Balance Details"
        subtitle="Current and corrected balances stay visible by default."
      >
        <LabeledTextInput
          label="Current Balance"
          value={viewModel.adjustmentForm.currentBalanceLabel}
          editable={false}
        />

        <LabeledTextInput
          label={`Actual Balance (${viewModel.currencyLabel}) *`}
          value={viewModel.adjustmentForm.targetBalance}
          onChangeText={(value) =>
            viewModel.onAdjustmentFormChange("targetBalance", value)
          }
          placeholder="0"
          keyboardType="decimal-pad"
          helperText="Enter the cash, bank, or wallet balance you counted."
          errorText={viewModel.adjustmentForm.fieldErrors.targetBalance}
        />

        <LabeledTextInput
          label="Reason *"
          value={viewModel.adjustmentForm.reason}
          onChangeText={(value) => viewModel.onAdjustmentFormChange("reason", value)}
          placeholder="Example: cash counted at closing"
          errorText={viewModel.adjustmentForm.fieldErrors.reason}
        />
      </DefaultSection>

      {viewModel.adjustmentForm.errorMessage ? (
        <Text style={styles.errorText}>
          {viewModel.adjustmentForm.errorMessage}
        </Text>
      ) : null}
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.md),
      paddingBottom: theme.scaleSpace(spacing.xl),
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
  });
