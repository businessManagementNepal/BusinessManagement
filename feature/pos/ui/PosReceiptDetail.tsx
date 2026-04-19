import { BillingDocument } from "@/feature/billing/types/billing.types";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import { Printer, Share2, X } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type PosReceiptDetailProps = {
  receipt: BillingDocument | null;
  onPrintReceipt: (receipt: BillingDocument) => void;
  onShareReceipt: (receipt: BillingDocument) => void;
  onClose: () => void;
  currencyCode: string;
  countryCode: string | null;
  extraContent?: React.ReactNode;
};

export function PosReceiptDetail({
  receipt,
  onPrintReceipt,
  onShareReceipt,
  onClose,
  currencyCode,
  countryCode,
  extraContent,
}: PosReceiptDetailProps) {
  if (!receipt) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Receipt Details</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.receiptHeader}>
            <Text style={styles.receiptNumber}>{receipt.documentNumber}</Text>
            <Text style={styles.receiptDate}>
              {formatDateTime(receipt.issuedAt)}
            </Text>
          </View>

          {receipt.customerName && (
            <View style={styles.customerSection}>
              <Text style={styles.sectionTitle}>Customer</Text>
              <Text style={styles.customerName}>{receipt.customerName}</Text>
            </View>
          )}

          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items</Text>
            {receipt.items.map((item) => (
              <View key={item.remoteId} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemQuantity}>
                    {item.quantity} x {formatCurrencyAmount({
                      amount: item.unitRate,
                      currencyCode,
                      countryCode,
                    })}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatCurrencyAmount({
                    amount: item.lineTotal,
                    currencyCode,
                    countryCode,
                  })}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrencyAmount({
                  amount: receipt.subtotalAmount,
                  currencyCode,
                  countryCode,
                })}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>
                {formatCurrencyAmount({
                  amount: receipt.taxAmount,
                  currencyCode,
                  countryCode,
                })}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrencyAmount({
                  amount: receipt.totalAmount,
                  currencyCode,
                  countryCode,
                })}
              </Text>
            </View>
            {receipt.paidAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Paid</Text>
                <Text style={styles.totalValue}>
                  {formatCurrencyAmount({
                    amount: receipt.paidAmount,
                    currencyCode,
                    countryCode,
                  })}
                </Text>
              </View>
            )}
            {receipt.outstandingAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Due</Text>
                <Text style={[styles.totalValue, styles.dueValue]}>
                  {formatCurrencyAmount({
                    amount: receipt.outstandingAmount,
                    currencyCode,
                    countryCode,
                  })}
                </Text>
              </View>
            )}
          </View>

          {receipt.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{receipt.notes}</Text>
            </View>
          )}

          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Text style={[
              styles.statusText,
              { color: receipt.status === "paid" ? colors.success : colors.warning }
            ]}>
              {receipt.status.toUpperCase()}
            </Text>
          </View>
        </ScrollView>

        {extraContent ? extraContent : null}

        <View style={styles.actionsRow}>
          <AppButton
            label="Print Receipt"
            size="lg"
            leadingIcon={<Printer size={18} color={colors.primaryForeground} />}
            onPress={() => onPrintReceipt(receipt)}
            style={styles.actionButton}
          />
          <AppButton
            label="Share Receipt"
            size="lg"
            leadingIcon={<Share2 size={18} color={colors.primaryForeground} />}
            onPress={() => onShareReceipt(receipt)}
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
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
    maxHeight: "90%",
    gap: spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  receiptNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  receiptDate: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  customerSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cardForeground,
    marginBottom: spacing.sm,
  },
  customerName: {
    fontSize: 16,
    color: colors.cardForeground,
  },
  itemsSection: {
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: colors.cardForeground,
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cardForeground,
  },
  totalsSection: {
    marginBottom: spacing.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cardForeground,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  dueValue: {
    color: colors.warning,
  },
  notesSection: {
    marginBottom: spacing.md,
  },
  notesText: {
    fontSize: 14,
    color: colors.cardForeground,
    fontStyle: "italic",
  },
  statusSection: {
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

