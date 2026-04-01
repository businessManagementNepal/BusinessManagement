import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { TransactionEditorViewModel } from "@/feature/transactions/viewModel/transactionEditor.viewModel";
import { TransactionDirection, TransactionType } from "@/feature/transactions/types/transaction.entity.types";

type TransactionEditorModalProps = {
  viewModel: TransactionEditorViewModel;
};

export function TransactionEditorModal({
  viewModel,
}: TransactionEditorModalProps) {
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

  const title = state.mode === "create" ? "Add Transaction" : "Edit Transaction";
  const showDirectionControl =
    state.type === TransactionType.Transfer || state.type === TransactionType.Refund;

  return (
    <Modal
      visible={state.visible}
      transparent={true}
      animationType="slide"
      onRequestClose={viewModel.close}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={viewModel.close} />

        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>Save personal money movement</Text>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={viewModel.close}
              accessibilityRole="button"
              accessibilityLabel="Close transaction editor"
            >
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <Text style={styles.sectionLabel}>Type</Text>
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

            {showDirectionControl ? (
              <>
                <Text style={styles.inputLabel}>Direction</Text>
                <Dropdown
                  value={state.direction}
                  options={directionOptions}
                  onChange={(value) => {
                    if (value === TransactionDirection.In || value === TransactionDirection.Out) {
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
              placeholder="Enter amount"
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
          </ScrollView>

          <View style={styles.actionRow}>
            <AppButton
              label="Cancel"
              variant="secondary"
              size="md"
              style={styles.actionButton}
              onPress={viewModel.close}
              disabled={state.isSaving}
            />
            <AppButton
              label={state.isSaving ? "Saving..." : "Save"}
              variant="primary"
              size="md"
              style={styles.actionButton}
              onPress={() => void viewModel.submit()}
              disabled={state.isSaving}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    zIndex: 1,
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  modalTitle: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  modalSubtitle: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.sm,
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
    marginBottom: spacing.sm,
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
    marginTop: spacing.sm,
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
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
