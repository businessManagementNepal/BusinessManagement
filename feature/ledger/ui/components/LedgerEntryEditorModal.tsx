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

  const title = state.mode === "create" ? "Add Ledger Entry" : "Edit Ledger Entry";

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
              <Text style={styles.modalSubtitle}>
                Save business due, sale, purchase, or settlement entry
              </Text>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={viewModel.close}
              accessibilityRole="button"
              accessibilityLabel="Close ledger entry editor"
            >
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <Text style={styles.sectionLabel}>Entry Type</Text>
            <View style={styles.typeChipRow}>
              {viewModel.availableEntryTypes.map((entryTypeOption) => {
                const isSelected = entryTypeOption.value === state.entryType;

                return (
                  <Pressable
                    key={entryTypeOption.value}
                    style={[
                      styles.typeChip,
                      isSelected ? styles.typeChipSelected : null,
                    ]}
                    onPress={() => viewModel.onChangeEntryType(entryTypeOption.value)}
                    disabled={state.isSaving}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        isSelected ? styles.typeChipTextSelected : null,
                      ]}
                    >
                      {entryTypeOption.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {shouldShowDirectionSelector(state.entryType) ? (
              <>
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
                />
              </>
            ) : null}

            <Text style={styles.inputLabel}>Party Name</Text>
            <TextInput
              value={state.partyName}
              onChangeText={viewModel.onChangePartyName}
              placeholder="Enter customer or supplier name"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
              editable={!state.isSaving}
            />

            <Text style={styles.inputLabel}>Party Phone</Text>
            <TextInput
              value={state.partyPhone}
              onChangeText={viewModel.onChangePartyPhone}
              placeholder="Optional phone number"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
              keyboardType="phone-pad"
              editable={!state.isSaving}
            />

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              value={state.title}
              onChangeText={viewModel.onChangeTitle}
              placeholder="Example: Rice sale"
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
              keyboardType="numeric"
              editable={!state.isSaving}
            />

            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              value={state.happenedAt}
              onChangeText={viewModel.onChangeHappenedAt}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
              editable={!state.isSaving}
            />

            <Text style={styles.inputLabel}>Due Date</Text>
            <TextInput
              value={state.dueAt}
              onChangeText={viewModel.onChangeDueAt}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
              editable={!state.isSaving}
            />

            <Text style={styles.inputLabel}>Money Account</Text>
            <Dropdown
              value={state.settlementAccountRemoteId}
              options={accountOptions}
              onChange={viewModel.onChangeSettlementAccountRemoteId}
              placeholder="Optional settlement account"
              modalTitle="Choose money account"
              showLeadingIcon={false}
            />

            <Text style={styles.inputLabel}>Note</Text>
            <TextInput
              value={state.note}
              onChangeText={viewModel.onChangeNote}
              placeholder="Optional note"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, styles.textArea]}
              multiline={true}
              numberOfLines={4}
              editable={!state.isSaving}
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
                label={state.isSaving ? "Saving..." : "Save"}
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
    backgroundColor: "rgba(17, 24, 39, 0.3)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
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
    maxHeight: "92%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  modalSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  typeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  typeChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    color: colors.cardForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  typeChipTextSelected: {
    color: colors.primaryForeground,
  },
  inputLabel: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.cardForeground,
    fontSize: 14,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterMedium",
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
