import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { CardPressable } from "@/shared/components/reusable/Cards/Card";
import { CenteredDialogFormModal } from "@/shared/components/reusable/Modals/CenteredDialogFormModal";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <CenteredDialogFormModal
      visible={visible}
      onClose={onClose}
      header={
        <View style={styles.headerRow}>
          <Text style={styles.title}>Select Product</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={22} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      }
      headerContainerStyle={styles.headerContainer}
      contentContainerStyle={styles.content}
      cardStyle={styles.card}
      minHeight={360}
    >
      <View style={styles.searchWrap}>
        <Search size={18} color={theme.colors.mutedForeground} />
        <TextInput
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholder="Search products..."
          placeholderTextColor={theme.colors.mutedForeground}
          style={styles.searchInput}
        />
      </View>

      <Pressable style={styles.createButton} onPress={onCreateProduct}>
        <Text style={styles.createButtonText}>+ Create New Product</Text>
      </Pressable>

      <View style={styles.listContent}>
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
      </View>
    </CenteredDialogFormModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    headerContainer: {
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingTop: theme.scaleSpace(spacing.md),
      paddingBottom: theme.scaleSpace(spacing.sm),
    },
    content: {
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingBottom: theme.scaleSpace(spacing.sm),
      gap: theme.scaleSpace(spacing.md),
    },
    card: {
      maxWidth: 640,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.scaleSpace(spacing.md),
    },
    title: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(18),
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
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
      marginBottom: theme.scaleSpace(spacing.md),
    },
    searchInput: {
      flex: 1,
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
    },
    createButton: {
      minHeight: 46,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.isDarkMode ? "rgba(99, 211, 148, 0.36)" : "#B8D7C0",
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.scaleSpace(spacing.md),
    },
    createButtonText: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(15),
      fontFamily: "InterSemiBold",
    },
    listContent: {
      gap: theme.scaleSpace(spacing.sm),
      paddingBottom: theme.scaleSpace(spacing.sm),
    },
    productRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
    },
    avatarWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.accent,
    },
    avatarText: {
      color: theme.colors.primary,
      fontFamily: "InterBold",
      fontSize: theme.scaleText(22),
    },
    productBody: {
      flex: 1,
      gap: 4,
    },
    productTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
    productMeta: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterMedium",
    },
    productPrice: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(15),
      fontFamily: "InterBold",
    },
  });
