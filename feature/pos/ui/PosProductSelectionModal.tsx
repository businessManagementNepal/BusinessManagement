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
import { Search, X } from "lucide-react-native";
import { CardPressable } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { PosProduct } from "../types/pos.entity.types";
import { formatCurrency } from "./posScreen.shared";

type PosProductSelectionModalProps = {
  visible: boolean;
  products: readonly PosProduct[];
  currencyCode: string;
  countryCode: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
  onCreateProduct: () => void;
};

export function PosProductSelectionModal({
  visible,
  products,
  currencyCode,
  countryCode,
  searchTerm,
  onSearchChange,
  onClose,
  onSelectProduct,
  onCreateProduct,
}: PosProductSelectionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Select Product</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Search size={18} color={colors.mutedForeground} />
            <TextInput
              value={searchTerm}
              onChangeText={onSearchChange}
              placeholder="Search products..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>

          <Pressable style={styles.createButton} onPress={onCreateProduct}>
            <Text style={styles.createButtonText}>+ Create New Product</Text>
          </Pressable>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {products.map((product) => (
              <CardPressable
                key={product.id}
                style={styles.productRow}
                onPress={() => onSelectProduct(product.id)}
              >
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarText}>{product.shortCode}</Text>
                </View>
                <View style={styles.productBody}>
                  <Text style={styles.productTitle}>{product.name}</Text>
                  <Text style={styles.productMeta}>{product.categoryLabel}</Text>
                </View>
                <Text style={styles.productPrice}>
                  {formatCurrency(product.price, currencyCode, countryCode)}
                </Text>
              </CardPressable>
            ))}
          </ScrollView>
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
    padding: spacing.md,
    maxHeight: "75%",
  },
  headerRow: {
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
  createButton: {
    minHeight: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#B8D7C0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  createButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: "InterSemiBold",
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  avatarText: {
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
  },
});
