import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import {
    OrderStatus,
    OrderStatusValue,
} from "@/feature/orders/types/order.types";
import { OrdersViewModel } from "@/feature/orders/viewModel/orders.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { useToastMessage } from "@/shared/components/reusable/Feedback/useToastMessage";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { Pill } from "@/shared/components/reusable/List/Pill";
import { BottomTabAwareFooter } from "@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
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
import { OrderReturnDispositionModal } from "./components/OrderReturnDispositionModal";
import { OrderStatusModal } from "./components/OrderStatusModal";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const filteredOrders = Array.isArray(viewModel.orders) ? viewModel.orders : [];

  useToastMessage({
    message: viewModel.successMessage,
    type: "success",
  });

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
          <BottomTabAwareFooter>
            <AppButton
              label="Add Order"
              variant="primary"
              size="lg"
              style={styles.primaryActionButton}
              leadingIcon={
                <Plus size={18} color={theme.colors.primaryForeground} />
              }
              onPress={viewModel.onOpenCreate}
              disabled={!viewModel.canManage}
            />
          </BottomTabAwareFooter>
        }
        baseBottomPadding={140}
        contentContainerStyle={styles.content}
        showDivider={false}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Search size={17} color={theme.colors.mutedForeground} />
            <TextInput
              value={viewModel.searchQuery}
              onChangeText={viewModel.onSearchQueryChange}
              placeholder="Search orders..."
              placeholderTextColor={theme.colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>
          <Pressable
            style={styles.quickActionIconButton}
            onPress={showDataToolsHint}
            accessibilityRole="button"
          >
            <Download size={16} color={theme.colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={styles.quickActionIconButton}
            onPress={showDataToolsHint}
            accessibilityRole="button"
          >
            <Upload size={16} color={theme.colors.mutedForeground} />
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
            <ActivityIndicator color={theme.colors.primary} />
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
        visible={
          viewModel.isDetailVisible && !viewModel.returnDispositionForm.visible
        }
        canManage={viewModel.canManage}
        detail={viewModel.detail}
        onClose={viewModel.onCloseDetail}
        onOpenEdit={viewModel.onOpenEdit}
        onOpenStatus={viewModel.onOpenStatusModal}
        onOpenPayment={() => viewModel.onOpenMoneyAction("payment")}
        onOpenRefund={() => viewModel.onOpenMoneyAction("refund")}
        onReturnOrder={viewModel.onReturnOrder}
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

      <OrderReturnDispositionModal
        form={viewModel.returnDispositionForm}
        canManage={viewModel.canManage}
        onClose={viewModel.onCloseReturnDisposition}
        onChange={viewModel.onReturnDispositionLineChange}
        onSubmit={viewModel.onSubmitReturnOrder}
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

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  content: {
    gap: theme.scaleSpace(spacing.sm),
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.scaleSpace(spacing.sm),
  },
  searchInputWrap: {
    flex: 1,
    minHeight: theme.scaleSpace(42),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.pill,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.scaleSpace(spacing.md),
    flexDirection: "row",
    alignItems: "center",
    gap: theme.scaleSpace(8),
  },
  searchInput: {
    flex: 1,
    color: theme.colors.cardForeground,
    fontSize: theme.scaleText(16),
    fontFamily: "InterMedium",
    paddingVertical: 0,
  },
  quickActionIconButton: {
    width: theme.scaleSpace(42),
    height: theme.scaleSpace(42),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    marginTop: theme.scaleSpace(2),
  },
  filterRowContent: {
    gap: theme.scaleSpace(spacing.xs),
    paddingRight: theme.scaleSpace(spacing.md),
  },
  summaryGrid: {
    flexDirection: "row",
    gap: theme.scaleSpace(spacing.sm),
  },
  summaryCard: {
    flex: 1,
    minHeight: theme.scaleSpace(72),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.lg,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.scaleSpace(4),
  },
  activeSummaryValue: {
    color: theme.colors.primary,
    fontSize: theme.scaleText(34),
    lineHeight: theme.scaleLineHeight(38),
    fontFamily: "InterBold",
  },
  deliveredSummaryValue: {
    color: theme.colors.success,
    fontSize: theme.scaleText(34),
    lineHeight: theme.scaleLineHeight(38),
    fontFamily: "InterBold",
  },
  cancelledSummaryValue: {
    color: theme.colors.destructive,
    fontSize: theme.scaleText(34),
    lineHeight: theme.scaleLineHeight(38),
    fontFamily: "InterBold",
  },
  summaryLabel: {
    color: theme.colors.mutedForeground,
    fontSize: theme.scaleText(12),
    fontFamily: "InterMedium",
  },
  listHeaderText: {
    marginTop: theme.scaleSpace(spacing.xs),
    color: theme.colors.cardForeground,
    fontSize: theme.scaleText(24),
    lineHeight: theme.scaleLineHeight(30),
    fontFamily: "InterBold",
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.scaleText(13),
    fontFamily: "InterMedium",
  },
  centerState: {
    minHeight: theme.scaleSpace(180),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.scaleSpace(spacing.lg),
  },
  emptyText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.scaleText(13),
    textAlign: "center",
    fontFamily: "InterMedium",
  },
  listWrap: {
    gap: theme.scaleSpace(spacing.sm),
  },
  orderCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.lg,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.scaleSpace(spacing.md),
    paddingVertical: theme.scaleSpace(spacing.md),
    gap: theme.scaleSpace(spacing.sm),
  },
  orderHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.scaleSpace(spacing.sm),
  },
  orderHeaderTextWrap: {
    flex: 1,
    gap: theme.scaleSpace(3),
  },
  titleWithStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.scaleSpace(spacing.xs),
    flexWrap: "wrap",
  },
  orderTitle: {
    color: theme.colors.cardForeground,
    fontSize: theme.scaleText(18),
    lineHeight: theme.scaleLineHeight(22),
    fontFamily: "InterBold",
  },
  orderSubtitle: {
    color: theme.colors.mutedForeground,
    fontSize: theme.scaleText(16),
    lineHeight: theme.scaleLineHeight(20),
    fontFamily: "InterMedium",
  },
  orderAmountWrap: {
    alignItems: "flex-end",
    gap: theme.scaleSpace(2),
  },
  orderTotalLabel: {
    color: theme.colors.cardForeground,
    fontSize: theme.scaleText(30),
    lineHeight: theme.scaleLineHeight(34),
    fontFamily: "InterBold",
  },
  orderDateLabel: {
    color: theme.colors.mutedForeground,
    fontSize: theme.scaleText(12),
    fontFamily: "InterMedium",
  },
  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.scaleSpace(spacing.sm),
  },
  orderMetaText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.scaleText(14),
    fontFamily: "InterMedium",
  },
  balanceDueText: {
    color: theme.colors.warning,
    fontSize: theme.scaleText(14),
    fontFamily: "InterSemiBold",
  },
  primaryActionButton: {
    width: "100%",
  },
});
