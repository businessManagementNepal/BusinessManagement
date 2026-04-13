import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Printer, X } from "lucide-react-native";
import React from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { PosCustomer, PosTotals } from "../types/pos.entity.types";
import { formatCurrency } from "./posScreen.shared";

type PosPaymentModalProps = {
  visible: boolean;
  totals: PosTotals;
  currencyCode: string;
  countryCode: string | null;
  paidAmount: string;
  selectedCustomer: PosCustomer | null;
  onPaidAmountChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function PosPaymentModal({
  visible,
  totals,
  currencyCode,
  countryCode,
  paidAmount,
  selectedCustomer,
  onPaidAmountChange,
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

          {selectedCustomer && (
            <View style={styles.customerSummaryCard}>
              <Text style={styles.customerSummaryLabel}>Customer</Text>
              <Text style={styles.customerSummaryName}>{selectedCustomer.fullName}</Text>
              {selectedCustomer.phone && (
                <Text style={styles.customerSummaryPhone}>{selectedCustomer.phone}</Text>
              )}
            </View>
          )}

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

          <View style={[
            styles.dueAmountCard,
            {
              backgroundColor: totals.grandTotal - Number(paidAmount || "0") > 0 ? "#FEF3CD" : "#D1E7DD",
            }
          ]}>
            <Text style={styles.dueAmountLabel}>Due Amount</Text>
            <Text style={[
              styles.dueAmountValue,
              {
                color: totals.grandTotal - Number(paidAmount || "0") > 0 ? colors.warning : colors.success,
              }
            ]}>
              {formatCurrency(totals.grandTotal - Number(paidAmount || "0"), currencyCode, countryCode)}
            </Text>
          </View>

          <View>
            {(() => {
              const dueAmount = totals.grandTotal - Number(paidAmount || "0");
              const requiresCustomer = dueAmount > 0;
              const customerValid = !requiresCustomer || selectedCustomer !== null;

              return (
                <>
                  {requiresCustomer && !customerValid && (
                    <View style={styles.errorCard}>
                      <Text style={styles.errorText}>
                        Customer selection is required for unpaid sales
                      </Text>
                    </View>
                  )}
                  <AppButton
                    label="Complete Sale"
                    size="lg"
                    leadingIcon={<Printer size={18} color={colors.primaryForeground} />}
                    onPress={onConfirm}
                    disabled={!customerValid}
                  />
                </>
              );
            })()}
          </View>
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
  errorCard: {
    backgroundColor: "#FDF1F1",
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "#F2C7C7",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterMedium",
    textAlign: "center",
  },
  customerSummaryCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    padding: spacing.md,
    gap: 4,
  },
  customerSummaryLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  customerSummaryName: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
  },
  customerSummaryPhone: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  dueAmountCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  dueAmountLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  dueAmountValue: {
    fontSize: 16,
    fontFamily: "InterBold",
  },
});
