import { OrderStatus } from "@/feature/orders/types/order.types";
import { OrderDetailView } from "@/feature/orders/types/order.view.types";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import {
  Calendar,
  CreditCard,
  Edit2,
  Phone,
  Trash2,
  User,
} from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  canManage: boolean;
  detail: OrderDetailView | null;
  onClose: () => void;
  onOpenEdit: (remoteId: string) => Promise<void>;
  onOpenStatus: () => void;
  onOpenPayment: () => void;
  onOpenRefund: () => void;
  onReturnOrder: () => void;
  onCancelOrder: () => void;
  onDelete: (remoteId: string) => void;
};

export function OrderDetailModal({
  visible,
  canManage,
  detail,
  onClose,
  onOpenEdit,
  onOpenStatus,
  onDelete,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const getStatusChipStyles = (status: string) => {
    switch (status) {
      case OrderStatus.Pending:
        return {
          container: styles.pendingStatusChip,
          label: styles.pendingStatusLabel,
        };
      case OrderStatus.Delivered:
        return {
          container: styles.deliveredStatusChip,
          label: styles.deliveredStatusLabel,
        };
      case OrderStatus.Cancelled:
        return {
          container: styles.cancelledStatusChip,
          label: styles.cancelledStatusLabel,
        };
      case OrderStatus.Returned:
        return {
          container: styles.returnedStatusChip,
          label: styles.returnedStatusLabel,
        };
      default:
        return {
          container: styles.defaultStatusChip,
          label: styles.defaultStatusLabel,
        };
    }
  };

  return (
    <FormSheetModal
      visible={visible}
      title={detail ? detail.order.orderNumber : "Order Detail"}
      onClose={onClose}
      presentation="dialog"
      contentContainerStyle={styles.content}
    >
      {!detail ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.headerActionRow}>
            <View style={styles.statusChipWrap}>
              <View
                style={[
                  styles.statusChipBase,
                  getStatusChipStyles(detail.order.status).container,
                ]}
              >
                <Text style={getStatusChipStyles(detail.order.status).label}>
                  {detail.order.status.replace(/(^|\s)\w/g, (match) =>
                    match.toUpperCase(),
                  )}
                </Text>
              </View>
            </View>
            {canManage ? (
              <View style={styles.inlineActionsRow}>
                {detail.canEdit ? (
                  <Pressable
                    style={styles.actionChip}
                    onPress={() => void onOpenEdit(detail.order.remoteId)}
                  >
                    <Edit2 size={12} color={theme.colors.primary} />
                    <Text style={styles.actionChipLabel}>Edit</Text>
                  </Pressable>
                ) : null}
                {detail.canChangeStatus ? (
                  <Pressable style={styles.actionChip} onPress={onOpenStatus}>
                    <Text style={styles.actionChipLabel}>Status</Text>
                  </Pressable>
                ) : null}
                {detail.canDelete ? (
                  <Pressable
                    style={styles.deleteActionChip}
                    onPress={() => onDelete(detail.order.remoteId)}
                  >
                    <Trash2 size={12} color={theme.colors.destructive} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.customerCard}>
            <View style={styles.customerRow}>
              <User size={14} color={theme.colors.primary} />
              <Text style={styles.customerPrimary}>{detail.customerName}</Text>
            </View>
            {detail.customerPhone ? (
              <View style={styles.customerRow}>
                <Phone size={14} color={theme.colors.primary} />
                <Text style={styles.customerSecondary}>{detail.customerPhone}</Text>
              </View>
            ) : null}
            <View style={styles.customerRow}>
              <Calendar size={14} color={theme.colors.primary} />
              <Text style={styles.customerSecondary}>{detail.orderDateLabel}</Text>
            </View>
            <View style={styles.customerRow}>
              <CreditCard size={14} color={theme.colors.primary} />
              <Text style={styles.customerSecondary}>{detail.paymentMethodLabel}</Text>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionLabel}>Items</Text>
            <View style={styles.itemsCard}>
              {detail.items.map((item) => (
                <View key={item.remoteId} style={styles.itemLineRow}>
                  <View style={styles.itemLineLeft}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemMeta}>
                      Qty: {item.quantityLabel} x {item.unitPriceLabel}
                    </Text>
                  </View>
                  <Text style={styles.itemLineTotal}>{item.lineTotalLabel}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{detail.pricing.subtotalLabel}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({detail.pricing.taxRateLabel})</Text>
              <Text style={styles.totalValue}>{detail.pricing.taxLabel}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.discountValue}>-{detail.pricing.discountLabel}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalBold}>Total</Text>
              <Text style={styles.totalBold}>{detail.pricing.totalLabel}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Paid</Text>
              <Text style={styles.paidValue}>{detail.pricing.paidLabel}</Text>
            </View>
            {detail.pricing.balanceDueAmount > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.balanceLabel}>Balance Due</Text>
                <Text style={styles.balanceValue}>{detail.pricing.balanceDueLabel}</Text>
              </View>
            ) : null}
          </View>

          {detail.order.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesBody}>{detail.order.notes}</Text>
            </View>
          ) : null}
        </>
      )}
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
    },
    centerState: {
      minHeight: 180,
      alignItems: "center",
      justifyContent: "center",
    },
    headerActionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    statusChipWrap: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusChipBase: {
      minHeight: 30,
      borderRadius: radius.pill,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      alignItems: "center",
      justifyContent: "center",
    },
    defaultStatusChip: {
      backgroundColor: theme.colors.accent,
    },
    defaultStatusLabel: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    pendingStatusChip: {
      backgroundColor: "rgba(242, 168, 29, 0.16)",
    },
    pendingStatusLabel: {
      color: theme.colors.warning,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    deliveredStatusChip: {
      backgroundColor: "rgba(46, 139, 87, 0.16)",
    },
    deliveredStatusLabel: {
      color: theme.colors.success,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    cancelledStatusChip: {
      backgroundColor: "rgba(228, 71, 71, 0.15)",
    },
    cancelledStatusLabel: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    returnedStatusChip: {
      backgroundColor: "rgba(242, 168, 29, 0.2)",
    },
    returnedStatusLabel: {
      color: theme.colors.warning,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    inlineActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.xs),
    },
    actionChip: {
      minHeight: 30,
      borderRadius: radius.pill,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      backgroundColor: theme.colors.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    actionChipLabel: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(13),
      fontFamily: "InterSemiBold",
    },
    deleteActionChip: {
      minHeight: 30,
      minWidth: 36,
      borderRadius: radius.pill,
      paddingHorizontal: theme.scaleSpace(spacing.sm),
      backgroundColor: theme.isDarkMode ? "rgba(255, 107, 107, 0.12)" : "rgba(228, 71, 71, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    customerCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : "#EAF4EF",
      borderRadius: radius.lg,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: 8,
    },
    customerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    customerPrimary: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(20),
      fontFamily: "InterBold",
      lineHeight: theme.scaleLineHeight(24),
    },
    customerSecondary: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterMedium",
    },
    sectionWrap: {
      gap: 6,
    },
    sectionLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.45,
    },
    itemsCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.card,
      overflow: "hidden",
    },
    itemLineRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemLineLeft: {
      flex: 1,
      gap: 4,
    },
    itemName: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    itemMeta: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterMedium",
    },
    itemLineTotal: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    totalCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : "#EAF4EF",
      borderRadius: radius.lg,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: 6,
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.sm),
    },
    totalLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterMedium",
    },
    totalValue: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterMedium",
    },
    discountValue: {
      color: theme.colors.success,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    totalDivider: {
      marginTop: 2,
      marginBottom: 2,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    totalBold: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
    paidValue: {
      color: theme.colors.success,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    balanceLabel: {
      color: theme.colors.warning,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    balanceValue: {
      color: theme.colors.warning,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
    notesCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : "#EAF4EF",
      borderRadius: radius.lg,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: 6,
    },
    notesTitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterSemiBold",
    },
    notesBody: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(16),
      fontFamily: "InterMedium",
    },
  });
