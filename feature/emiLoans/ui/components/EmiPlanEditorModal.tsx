import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { EmiPlanEditorViewModel } from "@/feature/emiLoans/viewModel/emiPlanEditor.viewModel";

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

  return (
    <Modal
      visible={state.visible}
      transparent={true}
      animationType="slide"
      onRequestClose={viewModel.close}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.dismissArea} onPress={viewModel.close} />

        <View style={styles.modalSheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>
                {state.planMode === "business" ? "Add Business Plan" : "Add My Plan"}
              </Text>
              <Text style={styles.subtitle}>{viewModel.accountLabel}</Text>
            </View>

            <Pressable style={styles.closeButton} onPress={viewModel.close}>
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <Text style={styles.inputLabel}>Plan Type</Text>
            <View style={styles.chipRow}>
              {viewModel.availablePlanTypes.map((option) => {
                const isSelected = option.value === state.planType;

                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipSelected : null,
                    ]}
                    onPress={() => viewModel.onChangePlanType(option.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected ? styles.chipTextSelected : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              value={state.title}
              onChangeText={viewModel.onChangeTitle}
              placeholder={
                state.planMode === "business"
                  ? "For example: Rice machine finance"
                  : "For example: Phone EMI"
              }
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>{counterpartyLabel}</Text>
            <TextInput
              value={state.counterpartyName}
              onChangeText={viewModel.onChangeCounterpartyName}
              placeholder="Optional"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              value={state.counterpartyPhone}
              onChangeText={viewModel.onChangeCounterpartyPhone}
              placeholder="Optional"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Total Amount</Text>
            <TextInput
              value={state.totalAmount}
              onChangeText={viewModel.onChangeTotalAmount}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Installments</Text>
            <TextInput
              value={state.installmentCount}
              onChangeText={viewModel.onChangeInstallmentCount}
              placeholder="6"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>First Due</Text>
            <TextInput
              value={state.firstDueAt}
              onChangeText={viewModel.onChangeFirstDueAt}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.inputLabel}>Reminder</Text>
                <Text style={styles.helperText}>Save reminder preference with this plan</Text>
              </View>
              <Switch
                value={state.reminderEnabled}
                onValueChange={viewModel.onToggleReminder}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.card}
              />
            </View>

            {state.reminderEnabled ? (
              <>
                <Text style={styles.inputLabel}>Remind Before (days)</Text>
                <TextInput
                  value={state.reminderDaysBefore}
                  onChangeText={viewModel.onChangeReminderDaysBefore}
                  placeholder="1"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.input}
                  keyboardType="numeric"
                />
              </>
            ) : null}

            <Text style={styles.inputLabel}>Note</Text>
            <TextInput
              value={state.note}
              onChangeText={viewModel.onChangeNote}
              placeholder="Optional note"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, styles.textArea]}
              multiline={true}
              numberOfLines={4}
            />

            {state.errorMessage ? (
              <Text style={styles.errorText}>{state.errorMessage}</Text>
            ) : null}

            <View style={styles.actionRow}>
              <AppButton
                label="Cancel"
                variant="secondary"
                size="lg"
                style={styles.actionButton}
                onPress={viewModel.close}
                disabled={state.isSaving}
              />
              <AppButton
                label={state.planMode === "business" ? "Save Plan" : "Save My Plan"}
                variant="primary"
                size="lg"
                style={styles.actionButton}
                onPress={() => void viewModel.submit()}
                disabled={state.isSaving}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.28)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: "90%",
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  subtitle: {
    marginTop: 4,
    color: colors.mutedForeground,
    fontSize: 13,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  inputLabel: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.foreground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  chipTextSelected: {
    color: colors.primaryForeground,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    fontSize: 14,
  },
  textArea: {
    minHeight: 108,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  switchTextWrap: {
    flex: 1,
    gap: 4,
  },
  helperText: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
