import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Printer, X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { PosTotals } from "../types/pos.entity.types";
import { formatCurrency } from "./posScreen.shared";

type PosPaymentModalProps = {
  visible: boolean;
  totals: PosTotals;
  currencyCode: string;
  countryCode: string | null;
  paidAmount: string;
  splitCount: string;
  onPaidAmountChange: (value: string) => void;
  onSplitCountChange: (value: string) => void;
  onSplitPreview: () => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function PosPaymentModal({
  visible,
  totals,
  currencyCode,
  countryCode,
  paidAmount,
  splitCount,
  onPaidAmountChange,
  onSplitCountChange,
  onSplitPreview,
  onConfirm,
  onClose,
}: PosPaymentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Take Payment</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Grand Total</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totals.grandTotal, currencyCode, countryCode)}
            </Text>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Paid Amount</Text>
            <TextInput
              value={paidAmount}
              onChangeText={onPaidAmountChange}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldWrap, styles.flexField]}>
              <Text style={styles.fieldLabel}>Split Count</Text>
              <TextInput
                value={splitCount}
                onChangeText={onSplitCountChange}
                keyboardType="number-pad"
                placeholder="2"
                placeholderTextColor={colors.mutedForeground}
                style={styles.input}
              />
            </View>
            <AppButton
              label="Split Preview"
              variant="secondary"
              style={styles.splitButton}
              onPress={onSplitPreview}
            />
          </View>

          <AppButton
            label="Complete Sale"
            size="lg"
            leadingIcon={<Printer size={18} color={colors.primaryForeground} />}
            onPress={onConfirm}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  summaryCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    padding: spacing.md,
    gap: 4,
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 24,
    fontFamily: "InterBold",
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  input: {
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterMedium",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  flexField: {
    flex: 1,
  },
  splitButton: {
    minWidth: 120,
  },
});
