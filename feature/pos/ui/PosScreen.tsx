import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { AppIconButton } from "@/shared/components/reusable/Buttons/AppIconButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import {
    Minus,
    Percent,
    Plus,
    PlusCircle,
    ShoppingCart,
    Trash2,
    WalletCards,
} from "lucide-react-native";
import React, { useCallback, useMemo, useRef } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { PosProduct, PosSlot } from "../types/pos.entity.types";
import { PosScreenViewModel } from "../types/pos.state.types";
import { PosCustomerCreateModal } from "./components/PosCustomerCreateModal";
import { PosCustomerSelector } from "./components/PosCustomerSelector";
import { PosAdjustAmountModal } from "./PosAdjustAmountModal";
import { PosPaymentModal } from "./PosPaymentModal";
import { PosProductSelectionModal } from "./PosProductSelectionModal";
import { PosQuickProductModal } from "./PosQuickProductModal";
import { PosReceiptModal } from "./PosReceiptModal";
import { buildSlotProductLookup, formatCurrency } from "./posScreen.shared";

type PosScreenProps = {
  viewModel: PosScreenViewModel;
};

const SLOT_COLUMN_COUNT = 4;

export function PosScreen({ viewModel }: PosScreenProps) {
  const isShareAvailable = Platform.OS !== "web";
  const productLookup = useMemo(
    () => buildSlotProductLookup(viewModel.products),
    [viewModel.products],
  );

  const slotRows = useMemo(() => {
    const rows: PosSlot[][] = [];
    for (
      let index = 0;
      index < viewModel.slots.length;
      index += SLOT_COLUMN_COUNT
    ) {
      rows.push(viewModel.slots.slice(index, index + SLOT_COLUMN_COUNT));
    }
    return rows;
  }, [viewModel.slots]);

  const selectedSlotId = viewModel.selectedSlotId;
  const cartLines = viewModel.cartLines;

  const selectedCartLine = useMemo(
    () =>
      selectedSlotId
        ? (cartLines.find((cartLine) => cartLine.slotId === selectedSlotId) ??
          null)
        : null,
    [cartLines, selectedSlotId],
  );

  const selectedSlotLabel = selectedSlotId
    ? `Slot ${selectedSlotId.replace("slot-", "")}`
    : null;

  const selectedSlot = useMemo(
    () =>
      selectedSlotId
        ? (viewModel.slots.find((slot) => slot.slotId === selectedSlotId) ??
          null)
        : null,
    [selectedSlotId, viewModel.slots],
  );

  const selectedAssignedProduct = selectedSlot?.assignedProductId
    ? productLookup[selectedSlot.assignedProductId]
    : null;

  const longPressTriggeredRef = useRef<string | null>(null);

  const handleSlotPress = useCallback(
    (slotId: string) => {
      if (longPressTriggeredRef.current === slotId) {
        longPressTriggeredRef.current = null;
        return;
      }

      void viewModel.onPressSlot(slotId);
    },
    [viewModel],
  );

  const handleSlotLongPress = useCallback(
    (slotId: string) => {
      longPressTriggeredRef.current = slotId;
      viewModel.onLongPressSlot(slotId);
    },
    [viewModel],
  );

  return (
    <>
      <ScreenContainer
        showDivider={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>Products</Text>
              <Text style={styles.sectionSubtitle}>
                Search and add products directly to cart
              </Text>
            </View>
            <AppIconButton onPress={viewModel.onOpenCreateProductModal}>
              <PlusCircle size={20} color={colors.primary} />
            </AppIconButton>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value={viewModel.productSearchTerm}
              onChangeText={(value) =>
                void viewModel.onProductSearchChange(value)
              }
              placeholder="Search products..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>

          {viewModel.recentProducts.length > 0 && (
            <View style={styles.quickProductsSection}>
              <Text style={styles.quickProductsTitle}>Recent Products</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickProductsScroll}
                contentContainerStyle={styles.quickProductsContent}
              >
                {viewModel.recentProducts.map((product) => (
                  <Pressable
                    key={product.id}
                    style={styles.quickProductChip}
                    onPress={() =>
                      void viewModel.onAddProductToCart(product.id)
                    }
                  >
                    <Text style={styles.quickProductChipText}>
                      {product.name}
                    </Text>
                    <Text style={styles.quickProductChipPrice}>
                      {formatCurrency(
                        product.price,
                        viewModel.currencyCode,
                        viewModel.countryCode,
                      )}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {viewModel.productSearchTerm === "" ? (
            <View style={styles.emptySearchState}>
              <Text style={styles.emptySearchTitle}>Search for Products</Text>
              <Text style={styles.emptySearchSubtitle}>
                Type a product name or category to find and add items to your
                cart
              </Text>
            </View>
          ) : viewModel.filteredProducts.length > 0 ? (
            <ScrollView style={styles.productsList} nestedScrollEnabled>
              <View style={styles.productsContent}>
                {viewModel.filteredProducts.map((product: PosProduct) => (
                  <Pressable
                    key={product.id}
                    style={styles.productRow}
                    onPress={() =>
                      void viewModel.onAddProductToCart(product.id)
                    }
                  >
                    <View style={styles.productAvatarWrap}>
                      <Text style={styles.productAvatarText}>
                        {product.shortCode}
                      </Text>
                    </View>
                    <View style={styles.productBody}>
                      <Text style={styles.productTitle}>{product.name}</Text>
                      <Text style={styles.productMeta}>
                        {product.categoryLabel}
                      </Text>
                    </View>
                    <Text style={styles.productPrice}>
                      {formatCurrency(
                        product.price,
                        viewModel.currencyCode,
                        viewModel.countryCode,
                      )}
                    </Text>
                    <View style={styles.productAddButton}>
                      <Plus size={16} color={colors.primary} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptySearchState}>
              <Text style={styles.emptySearchTitle}>No products found</Text>
              <Text style={styles.emptySearchSubtitle}>
                Try a different product name or category, or create a new
                product from POS
              </Text>
            </View>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.cartHeaderRow}>
            <Text style={styles.cartTitle}>Cart Summary</Text>
            <View style={styles.itemsPill}>
              <Text style={styles.itemsPillText}>
                {viewModel.totals.itemCount} items
              </Text>
            </View>
          </View>

          {viewModel.cartLines.length === 0 ? (
            <Text style={styles.emptyCartText}>
              Search and tap products to add them to cart.
            </Text>
          ) : (
            viewModel.cartLines.map((cartLine) => (
              <View key={cartLine.lineId} style={styles.cartLineRow}>
                <View style={styles.cartLineBody}>
                  <Text style={styles.cartLineTitle}>
                    {cartLine.productName}
                  </Text>
                  <Text style={styles.cartLineMeta}>
                    {formatCurrency(
                      cartLine.unitPrice,
                      viewModel.currencyCode,
                      viewModel.countryCode,
                    )}{" "}
                    x {cartLine.quantity}
                  </Text>
                </View>
                <View style={styles.cartLineActions}>
                  <AppIconButton
                    onPress={() => {
                      void viewModel.onDecreaseQuantity(cartLine.lineId);
                    }}
                  >
                    <Minus size={14} color={colors.mutedForeground} />
                  </AppIconButton>
                  <Text style={styles.cartLineQty}>{cartLine.quantity}</Text>
                  <AppIconButton
                    onPress={() => {
                      void viewModel.onIncreaseQuantity(cartLine.lineId);
                    }}
                  >
                    <Plus size={14} color={colors.mutedForeground} />
                  </AppIconButton>
                </View>
                <Text style={styles.cartLineAmount}>
                  {formatCurrency(
                    cartLine.lineSubtotal,
                    viewModel.currencyCode,
                    viewModel.countryCode,
                  )}
                </Text>
                <Pressable
                  style={styles.cartDeleteButton}
                  onPress={() => {
                    void viewModel.onRemoveCartLine(cartLine.lineId);
                  }}
                >
                  <Trash2 size={16} color={colors.destructive} />
                </Pressable>
              </View>
            ))
          )}

          <View style={styles.totalsWrap}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Gross</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(
                  viewModel.totals.gross,
                  viewModel.currencyCode,
                  viewModel.countryCode,
                )}
              </Text>
            </View>
            {viewModel.totals.discountAmount > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>
                  -{" "}
                  {formatCurrency(
                    viewModel.totals.discountAmount,
                    viewModel.currencyCode,
                    viewModel.countryCode,
                  )}
                </Text>
              </View>
            ) : null}
            {viewModel.totals.surchargeAmount > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Surcharge</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(
                    viewModel.totals.surchargeAmount,
                    viewModel.currencyCode,
                    viewModel.countryCode,
                  )}
                </Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{viewModel.taxSummaryLabel}</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(
                  viewModel.totals.taxAmount,
                  viewModel.currencyCode,
                  viewModel.countryCode,
                )}
              </Text>
            </View>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(
                viewModel.totals.grandTotal,
                viewModel.currencyCode,
                viewModel.countryCode,
              )}
            </Text>
          </View>
        </Card>

        <Card style={styles.customerCard}>
          <PosCustomerSelector
            selectedCustomer={viewModel.selectedCustomer}
            customerSearchTerm={viewModel.customerSearchTerm}
            customerOptions={viewModel.customerOptions}
            onCustomerSearchChange={viewModel.onCustomerSearchChange}
            onSelectCustomer={viewModel.onSelectCustomer}
            onClearCustomer={viewModel.onClearCustomer}
            onOpenCustomerCreateModal={viewModel.onOpenCustomerCreateModal}
          />
        </Card>

        <Card style={styles.actionCard}>
          <View style={styles.actionRowPrimary}>
            <AppButton
              label="Pay"
              size="lg"
              style={styles.actionButtonPrimary}
              leadingIcon={
                <WalletCards size={18} color={colors.primaryForeground} />
              }
              onPress={viewModel.onOpenPaymentModal}
            />
            <AppButton
              label="Clear"
              size="lg"
              variant="secondary"
              style={styles.actionButtonDanger}
              labelStyle={styles.clearButtonLabel}
              leadingIcon={<Trash2 size={18} color={colors.destructive} />}
              onPress={() => {
                void viewModel.onClearCart();
              }}
            />
            <AppButton
              label="Split Bill"
              size="lg"
              variant="accent"
              style={styles.actionButtonAccent}
              onPress={viewModel.onOpenSplitBillModal}
            />
          </View>
          <View style={styles.actionRowSecondary}>
            <AppButton
              label="% Discount"
              variant="secondary"
              style={styles.secondaryActionButton}
              leadingIcon={<Percent size={16} color={colors.mutedForeground} />}
              onPress={viewModel.onOpenDiscountModal}
            />
            <AppButton
              label="+ Surcharge"
              variant="secondary"
              style={styles.secondaryActionButton}
              onPress={viewModel.onOpenSurchargeModal}
            />
          </View>
        </Card>

        <AppButton
          label={`Pay ${formatCurrency(
            viewModel.totals.grandTotal,
            viewModel.currencyCode,
            viewModel.countryCode,
          )}`}
          size="lg"
          style={styles.bottomPayButton}
          leadingIcon={
            <ShoppingCart size={18} color={colors.primaryForeground} />
          }
          onPress={viewModel.onOpenPaymentModal}
        />

        {viewModel.infoMessage ? (
          <Text style={styles.infoText}>{viewModel.infoMessage}</Text>
        ) : null}
        {viewModel.errorMessage ? (
          <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
        ) : null}
      </ScreenContainer>

      <PosProductSelectionModal
        visible={viewModel.activeModal === "product-selection"}
        products={viewModel.products}
        currencyCode={viewModel.currencyCode}
        countryCode={viewModel.countryCode}
        searchTerm={viewModel.productSearchTerm}
        onSearchChange={(value) => {
          void viewModel.onProductSearchChange(value);
        }}
        onClose={viewModel.onCloseModal}
        onSelectProduct={(productId) => {
          void viewModel.onSelectProduct(productId);
        }}
        onCreateProduct={viewModel.onOpenCreateProductModal}
      />

      <PosQuickProductModal
        visible={viewModel.activeModal === "create-product"}
        name={viewModel.quickProductNameInput}
        salePrice={viewModel.quickProductPriceInput}
        categoryName={viewModel.quickProductCategoryInput}
        onNameChange={viewModel.onQuickProductNameInputChange}
        onSalePriceChange={viewModel.onQuickProductPriceInputChange}
        onCategoryNameChange={viewModel.onQuickProductCategoryInputChange}
        onCreate={() => {
          void viewModel.onCreateProductFromPos();
        }}
        onClose={viewModel.onCloseCreateProductModal}
      />

      <PosAdjustAmountModal
        visible={viewModel.activeModal === "discount"}
        title="Apply Discount"
        value={viewModel.discountInput}
        onChange={viewModel.onDiscountInputChange}
        onConfirm={() => {
          void viewModel.onApplyDiscount();
        }}
        onClose={viewModel.onCloseModal}
      />

      <PosAdjustAmountModal
        visible={viewModel.activeModal === "surcharge"}
        title="Apply Surcharge"
        value={viewModel.surchargeInput}
        onChange={viewModel.onSurchargeInputChange}
        onConfirm={() => {
          void viewModel.onApplySurcharge();
        }}
        onClose={viewModel.onCloseModal}
      />

      <PosPaymentModal
        visible={viewModel.activeModal === "payment"}
        totals={viewModel.totals}
        currencyCode={viewModel.currencyCode}
        countryCode={viewModel.countryCode}
        paidAmount={viewModel.paymentInput}
        selectedCustomer={viewModel.selectedCustomer}
        selectedSettlementAccountRemoteId={
          viewModel.selectedSettlementAccountRemoteId
        }
        moneyAccountOptions={viewModel.moneyAccountOptions}
        onPaidAmountChange={viewModel.onPaymentInputChange}
        onSettlementAccountChange={viewModel.onSettlementAccountChange}
        onConfirm={() => {
          void viewModel.onCompletePayment();
        }}
        onClose={viewModel.onCloseModal}
      />

      <PosReceiptModal
        visible={viewModel.activeModal === "receipt"}
        receipt={viewModel.receipt}
        currencyCode={viewModel.currencyCode}
        countryCode={viewModel.countryCode}
        onClose={viewModel.onCloseReceiptModal}
        onPrint={viewModel.onPrintReceipt}
        onShare={viewModel.onShareReceipt}
        isPrintAvailable={true}
        isShareAvailable={Platform.OS !== "web"}
      />

      <PosCustomerCreateModal
        visible={viewModel.activeModal === "customer-create"}
        form={viewModel.customerCreateForm}
        onFormChange={viewModel.onCustomerCreateFormChange}
        onSubmit={viewModel.onCreateCustomer}
        onClose={viewModel.onCloseCustomerCreateModal}
        isSubmitting={viewModel.isCreatingCustomer}
        canSubmit={viewModel.customerCreateForm.fullName.trim().length > 0}
      />
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },

  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: colors.destructiveForeground,
    fontSize: 10,
    fontFamily: "InterBold",
  },
  sectionCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  sectionSubtitle: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontFamily: "InterMedium",
  },
  slotScrollArea: {
    maxHeight: 280,
  },
  slotRowsWrap: {
    gap: spacing.sm,
    paddingRight: 2,
  },
  slotRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  slotCard: {
    flex: 1,
    minHeight: 130,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: spacing.xs,
    position: "relative",
  },
  slotCardFilled: {
    backgroundColor: colors.accent,
    borderColor: "#B8D7C0",
  },
  slotCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  slotRemoveButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  slotAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: "rgba(31, 99, 64, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  slotAvatarText: {
    color: colors.primary,
    fontSize: 28,
    fontFamily: "InterBold",
  },
  slotProductName: {
    color: colors.cardForeground,
    fontSize: 11,
    textAlign: "center",
    fontFamily: "InterSemiBold",
  },
  slotPriceText: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 11,
    fontFamily: "InterBold",
  },
  slotPlus: {
    color: colors.mutedForeground,
    fontSize: 28,
    fontFamily: "InterMedium",
  },
  slotEmptyLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginTop: spacing.sm,
  },
  cartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cartTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  itemsPill: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    minHeight: 28,
    borderRadius: radius.pill,
    justifyContent: "center",
  },
  itemsPillText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  slotDetailCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    padding: spacing.sm,
    gap: 4,
    marginBottom: spacing.sm,
  },
  slotDetailLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterSemiBold",
  },
  slotDetailTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  slotDetailMeta: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  slotDetailHint: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: spacing.sm,
    fontFamily: "InterMedium",
  },
  emptyCartText: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  cartLineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  cartLineRowSelected: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
  },
  cartLineBody: {
    flex: 1,
    gap: 2,
  },
  cartLineTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  cartLineMeta: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  cartLineActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cartLineQty: {
    color: colors.cardForeground,
    minWidth: 16,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  cartLineAmount: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
    minWidth: 72,
    textAlign: "right",
  },
  cartDeleteButton: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  totalsWrap: {
    paddingTop: spacing.sm,
    gap: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  totalValue: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterSemiBold",
  },
  grandTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLabel: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  grandTotalValue: {
    color: colors.primary,
    fontSize: 20,
    fontFamily: "InterBold",
  },
  customerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionRowPrimary: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionRowSecondary: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButtonPrimary: {
    flex: 1,
  },
  actionButtonDanger: {
    flex: 1,
    borderColor: "#F2C7C7",
    backgroundColor: "#FDF1F1",
  },
  clearButtonLabel: {
    color: colors.destructive,
  },
  actionButtonAccent: {
    flex: 1,
  },
  secondaryActionButton: {
    flex: 1,
  },
  bottomPayButton: {
    marginBottom: spacing.sm,
  },
  infoText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "InterMedium",
    paddingBottom: spacing.xs,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "InterMedium",
    paddingBottom: spacing.xs,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  searchWrap: {
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.cardForeground,
    fontSize: 14,
  },
  quickProductsSection: {
    marginBottom: spacing.md,
  },
  quickProductsTitle: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterSemiBold",
    marginBottom: spacing.sm,
  },
  quickProductsScroll: {
    flexGrow: 0,
  },
  quickProductsContent: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  quickProductChip: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#B8D7C0",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 120,
    alignItems: "center",
  },
  quickProductChipText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterSemiBold",
    textAlign: "center",
  },
  quickProductChipPrice: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: "InterBold",
    marginTop: 2,
  },
  productsList: {
    maxHeight: 280,
  },
  productsContent: {
    gap: spacing.sm,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
  },
  productAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  productAvatarText: {
    color: colors.primary,
    fontFamily: "InterBold",
    fontSize: 22,
  },
  productBody: {
    flex: 1,
    gap: 4,
  },
  productTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  productMeta: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  productPrice: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: "InterBold",
    minWidth: 80,
    textAlign: "right",
  },
  productAddButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySearchState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptySearchTitle: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterSemiBold",
    textAlign: "center",
  },
  emptySearchSubtitle: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
});
