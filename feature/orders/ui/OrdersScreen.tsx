import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import {
    OrderStatus,
    OrderStatusValue,
} from "@/feature/orders/types/order.types";
import { OrdersViewModel } from "@/feature/orders/viewModel/orders.viewModel";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { Pill } from "@/shared/components/reusable/List/Pill";
import { BottomTabAwareFooter } from "@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Download, Plus, Search, Upload } from "lucide-react-native";
import React, { useCallback } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { OrderDetailModal } from "./components/OrderDetailModal";
import { OrderEditorModal } from "./components/OrderEditorModal";
import { OrderMoneyActionModal } from "./components/OrderMoneyActionModal";
import { OrderStatusModal } from "./components/OrderStatusModal";

type StatusFilterValue = "all" | OrderStatusValue;

const STATUS_FILTER_OPTIONS: readonly {
  label: string;
  value: StatusFilterValue;
}[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: OrderStatus.Pending },
  { label: "Confirmed", value: OrderStatus.Confirmed },
  { label: "Processing", value: OrderStatus.Processing },
  { label: "Ready", value: OrderStatus.Ready },
  { label: "Shipped", value: OrderStatus.Shipped },
  { label: "Delivered", value: OrderStatus.Delivered },
  { label: "Cancelled", value: OrderStatus.Cancelled },
  { label: "Returned", value: OrderStatus.Returned },
  { label: "Draft", value: OrderStatus.Draft },
];

const formatStatusLabel = (status: OrderStatusValue): string => {
  return status.replace(/(^|\s)\w/g, (match) => match.toUpperCase());
};

const getStatusPillTone = (
  status: OrderStatusValue,
): "success" | "warning" | "danger" | "neutral" => {
  switch (status) {
    case OrderStatus.Pending:
      return "warning";
    case OrderStatus.Confirmed:
    case OrderStatus.Delivered:
      return "success";
    case OrderStatus.Cancelled:
      return "danger";
    default:
      return "neutral";
  }
};

export function OrdersScreen({ viewModel }: { viewModel: OrdersViewModel }) {
  const filteredOrders = Array.isArray(viewModel.orders) ? viewModel.orders : [];

  const showDataToolsHint = useCallback(() => {
    Alert.alert(
      "Data Tools",
      "Use Settings > Data Tools for import/export files.",
    );
  }, []);

  return (
    <>
      <DashboardTabScaffold
        footer={
          <BottomTabAwareFooter style={styles.fabFooter}>
            <View style={styles.fabRow}>
              <Pressable
                style={[
                  styles.fabButton,
                  !viewModel.canManage ? styles.fabButtonDisabled : null,
                ]}
                onPress={viewModel.onOpenCreate}
                disabled={!viewModel.canManage}
                accessibilityRole="button"
              >
                <Plus size={24} color={colors.primaryForeground} />
              </Pressable>
            </View>
          </BottomTabAwareFooter>
        }
        baseBottomPadding={170}
        contentContainerStyle={styles.content}
        showDivider={false}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Search size={17} color={colors.mutedForeground} />
            <TextInput
              value={viewModel.searchQuery}
              onChangeText={viewModel.onSearchQueryChange}
              placeholder="Search orders..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>
          <Pressable
            style={styles.quickActionIconButton}
            onPress={showDataToolsHint}
            accessibilityRole="button"
          >
            <Download size={16} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={styles.quickActionIconButton}
            onPress={showDataToolsHint}
            accessibilityRole="button"
          >
            <Upload size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <FilterChipGroup
          options={STATUS_FILTER_OPTIONS}
          selectedValue={viewModel.statusFilter}
          onSelect={(value) => viewModel.onStatusFilterChange(value as StatusFilterValue)}
          scrollStyle={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        />

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.activeSummaryValue}>{viewModel.summary.activeCount}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.deliveredSummaryValue}>
              {viewModel.summary.deliveredCount}
            </Text>
            <Text style={styles.summaryLabel}>Delivered</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cancelledSummaryValue}>
              {viewModel.summary.cancelledCount}
            </Text>
            <Text style={styles.summaryLabel}>Cancelled</Text>
          </View>
        </View>

        <Text style={styles.listHeaderText}>
          Orders ({filteredOrders.length})
        </Text>

        {viewModel.errorMessage ? (
          <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
        ) : null}

        {viewModel.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>No matching orders found.</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {filteredOrders.map((order) => (
              <Pressable
                key={order.remoteId}
                style={styles.orderCard}
                onPress={() => {
                  void viewModel.onOpenDetail(order.remoteId);
                }}
              >
                <View style={styles.orderHeaderRow}>
                  <View style={styles.orderHeaderTextWrap}>
                    <View style={styles.titleWithStatusRow}>
                      <Text style={styles.orderTitle}>{order.orderNumber}</Text>
                      <Pill
                        label={formatStatusLabel(order.status)}
                        tone={getStatusPillTone(order.status)}
                      />
                    </View>
                    <Text style={styles.orderSubtitle}>
                      {order.customerName}
                    </Text>
                  </View>

                  <View style={styles.orderAmountWrap}>
                    <Text style={styles.orderTotalLabel}>
                      {order.totalLabel}
                    </Text>
                    <Text style={styles.orderDateLabel}>
                      {order.orderDateLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaText}>
                    {order.itemCountLabel} | {order.paymentMethodLabel}
                  </Text>
                  {order.balanceDueLabel ? (
                    <Text style={styles.balanceDueText}>
                      Balance: {order.balanceDueLabel}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </DashboardTabScaffold>

      <OrderEditorModal
        visible={viewModel.isEditorVisible}
        mode={viewModel.editorMode}
        canManage={viewModel.canManage}
        form={viewModel.form}
        formPricingPreview={viewModel.formPricingPreview}
        customerOptions={viewModel.customerOptions}
        customerPhoneByRemoteId={viewModel.customerPhoneByRemoteId}
        productOptions={viewModel.productOptions}
        productPriceByRemoteId={viewModel.productPriceByRemoteId}
        paymentMethodOptions={viewModel.paymentMethodOptions}
        onClose={viewModel.onCloseEditor}
        onChange={viewModel.onFormChange}
        onLineItemChange={viewModel.onLineItemChange}
        onAddLineItem={viewModel.onAddLineItem}
        onRemoveLineItem={viewModel.onRemoveLineItem}
        onSubmit={viewModel.onSubmit}
      />

      <OrderDetailModal
        visible={viewModel.isDetailVisible}
        canManage={viewModel.canManage}
        detail={viewModel.detail}
        onClose={viewModel.onCloseDetail}
        onOpenEdit={viewModel.onOpenEdit}
        onOpenStatus={viewModel.onOpenStatusModal}
        onOpenPayment={() => viewModel.onOpenMoneyAction("payment")}
        onOpenRefund={() => viewModel.onOpenMoneyAction("refund")}
        onReturnOrder={() => Promise.resolve()}
        onCancelOrder={() => Promise.resolve()}
        onDelete={() => {
          if (!viewModel.detail) {
            return;
          }
          Alert.alert(
            "Delete order",
            `Delete ${viewModel.detail.order.orderNumber}?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  void viewModel.onDelete(viewModel.detail!.order.remoteId);
                },
              },
            ],
          );
        }}
      />

      <OrderStatusModal
        visible={viewModel.isStatusModalVisible}
        value={viewModel.statusDraft}
        options={viewModel.statusOptions}
        onChange={viewModel.onStatusDraftChange}
        onClose={viewModel.onCloseStatusModal}
        onSubmit={viewModel.onSubmitStatus}
      />

      <OrderMoneyActionModal
        form={viewModel.moneyForm}
        moneyAccountOptions={viewModel.moneyAccountOptions}
        onClose={viewModel.onCloseMoneyAction}
        onChange={viewModel.onMoneyFormChange}
        onSubmit={viewModel.onSubmitMoneyAction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchInputWrap: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterMedium",
    paddingVertical: 0,
  },
  quickActionIconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    marginTop: 2,
  },
  filterRowContent: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  activeSummaryValue: {
    color: colors.primary,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: "InterBold",
  },
  deliveredSummaryValue: {
    color: colors.success,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: "InterBold",
  },
  cancelledSummaryValue: {
    color: colors.destructive,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: "InterBold",
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  listHeaderText: {
    marginTop: spacing.xs,
    color: colors.cardForeground,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: "InterBold",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  centerState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 13,
    textAlign: "center",
    fontFamily: "InterMedium",
  },
  listWrap: {
    gap: spacing.sm,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  orderHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  orderHeaderTextWrap: {
    flex: 1,
    gap: 3,
  },
  titleWithStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  orderTitle: {
    color: colors.cardForeground,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "InterBold",
  },
  orderSubtitle: {
    color: colors.mutedForeground,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: "InterMedium",
  },
  orderAmountWrap: {
    alignItems: "flex-end",
    gap: 2,
  },
  orderTotalLabel: {
    color: colors.cardForeground,
    fontSize: 30,
    lineHeight: 34,
    fontFamily: "InterBold",
  },
  orderDateLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  orderMetaText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
  },
  balanceDueText: {
    color: colors.warning,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  fabFooter: {
    paddingTop: 0,
  },
  fabRow: {
    alignItems: "flex-end",
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(31, 99, 64, 0.2)",
  },
  fabButtonDisabled: {
    opacity: 0.5,
  },
});
