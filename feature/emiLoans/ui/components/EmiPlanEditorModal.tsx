import { EmiPlanEditorViewModel } from "@/feature/emiLoans/viewModel/emiPlanEditor.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { ChipSelectorField } from "@/shared/components/reusable/Form/ChipSelectorField";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

type EmiPlanEditorModalProps = {
  viewModel: EmiPlanEditorViewModel;
};

export function EmiPlanEditorModal({
  viewModel,
}: EmiPlanEditorModalProps) {
  const { state } = viewModel;
  const counterpartyLabel =
    state.planMode === "business" && state.planType === "customer_installment"
      ? "Customer Name"
      : "Lender / Bank";

  const planTypeOptions = viewModel.availablePlanTypes;

  return (
    <FormSheetModal
      visible={state.visible}
      title={state.planMode === "business" ? "Add Business Plan" : "Add My Plan"}
      subtitle={viewModel.accountLabel}
      onClose={viewModel.close}
      closeAccessibilityLabel="Close EMI plan editor"
      contentContainerStyle={styles.content}
      presentation="bottom-sheet"
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
            label={
              state.isSaving
                ? "Saving..."
                : state.planMode === "business"
                  ? "Save Plan"
                  : "Save My Plan"
            }
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
        label="Plan Type"
        options={planTypeOptions}
        selectedValue={state.planType}
        onSelect={viewModel.onChangePlanType}
        disabled={state.isSaving}
      />

      <LabeledTextInput
        label="Title *"
        value={state.title}
        onChangeText={viewModel.onChangeTitle}
        placeholder={
          state.planMode === "business"
            ? "For example: Rice machine finance"
            : "For example: Phone EMI"
        }
        editable={!state.isSaving}
        errorText={state.fieldErrors.title}
      />

      <LabeledTextInput
        label={counterpartyLabel}
        value={state.counterpartyName}
        onChangeText={viewModel.onChangeCounterpartyName}
        placeholder="Optional"
        editable={!state.isSaving}
      />

      <LabeledTextInput
        label="Phone"
        value={state.counterpartyPhone}
        onChangeText={viewModel.onChangeCounterpartyPhone}
        placeholder="Optional"
        keyboardType="phone-pad"
        editable={!state.isSaving}
      />

      <LabeledTextInput
        label="Total Amount *"
        value={state.totalAmount}
        onChangeText={viewModel.onChangeTotalAmount}
        placeholder="0"
        keyboardType="decimal-pad"
        editable={!state.isSaving}
        errorText={state.fieldErrors.totalAmount}
      />

      <LabeledTextInput
        label="Installments *"
        value={state.installmentCount}
        onChangeText={viewModel.onChangeInstallmentCount}
        placeholder="6"
        keyboardType="number-pad"
        editable={!state.isSaving}
        errorText={state.fieldErrors.installmentCount}
      />

      <LabeledTextInput
        label="First Due *"
        value={state.firstDueAt}
        onChangeText={viewModel.onChangeFirstDueAt}
        placeholder="YYYY-MM-DD"
        editable={!state.isSaving}
        errorText={state.fieldErrors.firstDueAt}
      />

      <Card style={styles.switchCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.switchTitle}>Reminder</Text>
            <Text style={styles.switchSubtitle}>Save reminder preference with this plan</Text>
          </View>
          <Switch
            value={state.reminderEnabled}
            onValueChange={viewModel.onToggleReminder}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.card}
            disabled={state.isSaving}
          />
        </View>
      </Card>

      {state.reminderEnabled ? (
        <LabeledTextInput
          label="Remind Before (days) *"
          value={state.reminderDaysBefore}
          onChangeText={viewModel.onChangeReminderDaysBefore}
          placeholder="1"
          keyboardType="number-pad"
          editable={!state.isSaving}
          errorText={state.fieldErrors.reminderDaysBefore}
        />
      ) : null}

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
  switchCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  switchTextWrap: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  switchSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
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
