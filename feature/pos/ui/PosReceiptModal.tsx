import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Printer, X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PosReceipt } from "../types/pos.entity.types";
import { formatCurrency } from "./posScreen.shared";

type PosReceiptModalProps = {
  visible: boolean;
  receipt: PosReceipt | null;
  currencyCode: string;
  countryCode: string | null;
  onClose: () => void;
  onPrint: () => void;
  onShare: () => void;
  isPrintAvailable?: boolean;
  isShareAvailable?: boolean;
};

export function PosReceiptModal({
  visible,
  receipt,
  currencyCode,
  countryCode,
  onClose,
  onPrint,
  onShare,
  isPrintAvailable = false,
  isShareAvailable = true,
}: PosReceiptModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Receipt</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {receipt ? (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              <Text style={styles.metaText}>{receipt.receiptNumber}</Text>
              <Text style={styles.metaText}>{new Date(receipt.issuedAt).toLocaleString()}</Text>
              
              {receipt.customerName ? (
                <View style={styles.customerSection}>
                  <Text style={styles.customerLabel}>Customer</Text>
                  <Text style={styles.customerName}>{receipt.customerName}</Text>
                  {receipt.customerPhone ? (
                    <Text style={styles.customerPhone}>{receipt.customerPhone}</Text>
                  ) : null}
                </View>
              ) : null}
              {receipt.lines.map((line) => (
                <View key={line.lineId} style={styles.lineRow}>
                  <View style={styles.lineBody}>
                    <Text style={styles.lineTitle}>{line.productName}</Text>
                    <Text style={styles.lineMeta}>
                      {formatCurrency(line.unitPrice, currencyCode, countryCode)} x {line.quantity}
                    </Text>
                  </View>
                  <Text style={styles.lineAmount}>
                    {formatCurrency(line.lineSubtotal, currencyCode, countryCode)}
                  </Text>
                </View>
              ))}

              <View style={styles.totalsWrap}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Gross</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(receipt.totals.gross, currencyCode, countryCode)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(receipt.totals.discountAmount, currencyCode, countryCode)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Surcharge</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(receipt.totals.surchargeAmount, currencyCode, countryCode)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(receipt.totals.taxAmount, currencyCode, countryCode)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Paid</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(receipt.paidAmount, currencyCode, countryCode)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Due</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(receipt.dueAmount, currencyCode, countryCode)}
                  </Text>
                </View>
              </View>

              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(receipt.totals.grandTotal, currencyCode, countryCode)}
              </Text>
              {receipt.ledgerEffect.type === "due_balance_created" ? (
                <Text style={styles.ledgerSuccessText}>
                  Ledger due created for{" "}
                  {formatCurrency(
                    receipt.ledgerEffect.dueAmount,
                    currencyCode,
                    countryCode,
                  )}
                  .
                </Text>
              ) : receipt.ledgerEffect.type === "due_balance_create_failed" ? (
                <Text style={styles.ledgerWarningText}>
                  Sale was completed but due posting failed. Add ledger entry manually for{" "}
                  {formatCurrency(
                    receipt.ledgerEffect.dueAmount,
                    currencyCode,
                    countryCode,
                  )}
                  .
                </Text>
              ) : null}

              {!isPrintAvailable ? (
                <Text style={styles.printUnavailableText}>
                  Printing is unavailable in this build. The receipt shown here is
                  accurate, but no print action will be attempted.
                </Text>
              ) : null}
            </ScrollView>
          ) : null}

          <View style={styles.actionsRow}>
            <AppButton
              label={isShareAvailable ? "Share Receipt" : "Share Unavailable"}
              size="lg"
              variant="secondary"
              style={styles.actionButton}
              onPress={onShare}
              disabled={!isShareAvailable}
            />
            <AppButton
              label={isPrintAvailable ? "Print Receipt" : "Print Unavailable"}
              size="lg"
              leadingIcon={<Printer size={18} color={colors.primaryForeground} />}
              style={styles.actionButton}
              onPress={onPrint}
              disabled={!isPrintAvailable}
            />
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
    maxHeight: "80%",
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
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    gap: spacing.sm,
  },
  metaText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginBottom: spacing.xs,
  },
  customerSection: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  customerLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterSemiBold",
    marginBottom: spacing.xs,
  },
  customerName: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  customerPhone: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginTop: spacing.xs,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  lineBody: {
    flex: 1,
  },
  lineTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  lineMeta: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  lineAmount: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  totalsWrap: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  totalValue: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterSemiBold",
  },
  grandTotalLabel: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  grandTotalValue: {
    color: colors.primary,
    fontSize: 24,
    fontFamily: "InterBold",
  },
  ledgerSuccessText: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "InterMedium",
  },
  ledgerWarningText: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "InterMedium",
  },
  printUnavailableText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "InterMedium",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
