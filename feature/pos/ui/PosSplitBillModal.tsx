import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { X } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { PosSplitDraftPart } from "../types/pos.entity.types";
import { formatCurrency } from "./posScreen.shared";

type PosSplitBillModalProps = {
  visible: boolean;
  grandTotal: number;
  allocatedAmount: number;
  remainingAmount: number;
  parts: readonly PosSplitDraftPart[];
  moneyAccountOptions: readonly DropdownOption[];
  currencyCode: string | null;
  countryCode: string | null;
  errorMessage: string | null;
  onClose: () => void;
  onApplyEqualSplit: (count: number) => void;
  onAddPart: () => void;
  onRemovePart: (paymentPartId: string) => void;
  onChangePartPayerLabel: (paymentPartId: string, value: string) => void;
  onChangePartAmount: (paymentPartId: string, value: string) => void;
  onChangePartSettlementAccount: (
    paymentPartId: string,
    settlementAccountRemoteId: string,
  ) => void;
  onSubmit: () => void;
};

export function PosSplitBillModal({
  visible,
  grandTotal,
  allocatedAmount,
  remainingAmount,
  parts,
  moneyAccountOptions,
  currencyCode,
  countryCode,
  errorMessage,
  onClose,
  onApplyEqualSplit,
  onAddPart,
  onRemovePart,
  onChangePartPayerLabel,
  onChangePartAmount,
  onChangePartSettlementAccount,
  onSubmit,
}: PosSplitBillModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Split Bill</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Grand Total</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(grandTotal, currencyCode, countryCode)}
          </Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Allocated</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(allocatedAmount, currencyCode, countryCode)}
          </Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(remainingAmount, currencyCode, countryCode)}
          </Text>
        </View>

        <View style={styles.quickActions}>
          <AppButton
            label="Split 2"
            variant="secondary"
            size="sm"
            onPress={() => onApplyEqualSplit(2)}
            style={styles.quickButton}
          />
          <AppButton
            label="Split 3"
            variant="secondary"
            size="sm"
            onPress={() => onApplyEqualSplit(3)}
            style={styles.quickButton}
          />
          <AppButton
            label="Split 4"
            variant="secondary"
            size="sm"
            onPress={() => onApplyEqualSplit(4)}
            style={styles.quickButton}
          />
        </View>

        <View style={styles.partsList}>
          {parts.map((part) => (
            <View key={part.paymentPartId} style={styles.partRow}>
              <View style={styles.partInputs}>
                <TextInput
                  style={styles.payerInput}
                  placeholder="Payer name"
                  value={part.payerLabel}
                  onChangeText={(value) =>
                    onChangePartPayerLabel(part.paymentPartId, value)
                  }
                />

                <TextInput
                  style={styles.amountInput}
                  placeholder="Amount"
                  value={part.amountInput}
                  onChangeText={(value) =>
                    onChangePartAmount(part.paymentPartId, value)
                  }
                  keyboardType="numeric"
                />

                <Dropdown
                  triggerStyle={styles.accountDropdown}
                  options={moneyAccountOptions}
                  value={part.settlementAccountRemoteId}
                  onChange={(value: string) =>
                    onChangePartSettlementAccount(part.paymentPartId, value)
                  }
                  placeholder="Account"
                />
              </View>

              <View style={styles.partActions}>
                <Pressable
                  onPress={() => onRemovePart(part.paymentPartId)}
                  style={styles.removeButton}
                >
                  <X size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          ))}

          <AppButton
            label="Add Part"
            variant="secondary"
            onPress={onAddPart}
            style={styles.addPartButton}
          />
        </View>

        <View style={styles.footer}>
          <AppButton
            label="Complete Split Bill"
            onPress={onSubmit}
            disabled={parts.length < 2}
            style={styles.submitButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.foreground,
  },
  closeButton: {
    padding: spacing.xs,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 14,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    color: colors.foreground,
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  quickButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  partsList: {
    flex: 1,
    marginTop: spacing.md,
  },
  partRow: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  partInputs: {
    flex: 1,
  },
  payerInput: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 14,
    marginBottom: spacing.sm,
    color: colors.foreground,
  },
  amountInput: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 14,
    marginBottom: spacing.sm,
    color: colors.foreground,
    flex: 1,
  },
  accountDropdown: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  partActions: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: spacing.sm,
  },
  removeButton: {
    padding: spacing.xs,
  },
  addPartButton: {
    marginTop: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
