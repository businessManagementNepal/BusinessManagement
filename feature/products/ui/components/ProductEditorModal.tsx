import { ProductKind } from "@/feature/products/types/product.types";
import { ProductFormFieldErrors, ProductFormState } from "@/feature/products/viewModel/products.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Box, Camera } from "lucide-react-native";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type ProductEditorModalProps = {
  visible: boolean;
  mode: "create" | "edit";
  form: ProductFormState;
  fieldErrors: ProductFormFieldErrors;
  categoryOptions: readonly string[];
  unitOptions: readonly string[];
  taxRateOptions: readonly string[];
  onClose: () => void;
  onChange: (field: keyof ProductFormState, value: string) => void;
  onPickImage: () => Promise<void>;
  onClearImage: () => void;
  onSubmit: () => Promise<void>;
};

export function ProductEditorModal({
  visible,
  mode,
  form,
  fieldErrors,
  categoryOptions,
  unitOptions,
  taxRateOptions,
  onClose,
  onChange,
  onPickImage,
  onClearImage,
  onSubmit,
}: ProductEditorModalProps) {
  const [isPickingImage, setIsPickingImage] = React.useState(false);
  const isItemKind = form.kind === ProductKind.Item;
  const title = mode === "create" ? "New Product" : "Edit Product";
  const productImageUrl = form.imageUrl.trim();
  const categoryDropdownOptions = [
    { label: "No category", value: "" },
    ...categoryOptions.map((categoryName) => ({
      label: categoryName,
      value: categoryName,
    })),
  ];

  const handlePickImage = React.useCallback(async () => {
    if (isPickingImage) {
      return;
    }

    setIsPickingImage(true);
    try {
      await onPickImage();
    } finally {
      setIsPickingImage(false);
    }
  }, [isPickingImage, onPickImage]);

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Manage item or service pricing and stock details"
      onClose={onClose}
      closeAccessibilityLabel="Close product editor"
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
      footer={
        <FormModalActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={onClose}
          />
          <AppButton
            label={mode === "create" ? "Save Product" : "Update Product"}
            size="lg"
            style={styles.actionButton}
            onPress={() => {
              void onSubmit();
            }}
          />
        </FormModalActionFooter>
      }
    >
      <View style={styles.fieldWrap}>
        <Text style={styles.inputLabel}>Product Image</Text>
        <Pressable
          onPress={() => {
            void handlePickImage();
          }}
          style={styles.imagePreview}
          accessibilityRole="button"
        >
          {productImageUrl.length > 0 ? (
            <Image
              source={{ uri: productImageUrl }}
              style={styles.imagePreviewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Box size={20} color={colors.mutedForeground} />
              <Text style={styles.imagePlaceholderText}>No image selected</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.imageActions}>
          <AppButton
            label={isPickingImage ? "Selecting..." : "Choose from gallery"}
            variant="secondary"
            size="sm"
            leadingIcon={<Camera size={14} color={colors.primary} />}
            onPress={() => {
              void handlePickImage();
            }}
            disabled={isPickingImage}
            style={styles.imageActionButton}
          />
          {productImageUrl.length > 0 ? (
            <AppButton
              label="Remove"
              variant="secondary"
              size="sm"
              onPress={onClearImage}
              style={styles.imageActionButton}
              labelStyle={styles.removeImageLabel}
            />
          ) : null}
        </View>
      </View>

      <LabeledTextInput
        label="Product Name"
        value={form.name}
        placeholder="Enter product name"
        onChangeText={(value) => onChange("name", value)}
        autoCapitalize="words"
        errorText={fieldErrors.name}
      />

      <LabeledDropdownField
        label="Type"
        value={form.kind}
        options={[
          { label: "Item", value: ProductKind.Item },
          { label: "Service", value: ProductKind.Service },
        ]}
        onChange={(value) => onChange("kind", value)}
        placeholder="Select type"
        modalTitle="Select product type"
      />

      <LabeledDropdownField
        label="Category"
        value={form.categoryName}
        options={categoryDropdownOptions}
        onChange={(value) => onChange("categoryName", value)}
        placeholder="No category"
        modalTitle="Select category"
      />

      <LabeledTextInput
        label="Sale Price"
        value={form.salePrice}
        placeholder="0"
        keyboardType="decimal-pad"
        onChangeText={(value) => onChange("salePrice", value)}
        errorText={fieldErrors.salePrice}
      />

      <LabeledTextInput
        label="Cost Price"
        value={form.costPrice}
        placeholder="0"
        keyboardType="decimal-pad"
        onChangeText={(value) => onChange("costPrice", value)}
      />

      <LabeledTextInput
        label="Stock Quantity"
        value={form.stockQuantity}
        placeholder="0"
        keyboardType="decimal-pad"
        onChangeText={(value) => onChange("stockQuantity", value)}
        editable={isItemKind}
      />

      <LabeledDropdownField
        label="Unit"
        value={form.unitLabel}
        options={unitOptions.map((unitLabel) => ({
          label: unitLabel,
          value: unitLabel,
        }))}
        onChange={(value) => onChange("unitLabel", value)}
        placeholder="Select unit"
        modalTitle="Select unit"
        disabled={!isItemKind}
      />

      <LabeledTextInput
        label="SKU / Barcode"
        value={form.skuOrBarcode}
        placeholder="Optional SKU or barcode"
        onChangeText={(value) => onChange("skuOrBarcode", value)}
      />

      <LabeledDropdownField
        label="Tax Rate"
        value={form.taxRateLabel}
        options={taxRateOptions.map((taxRate) => ({
          label: taxRate,
          value: taxRate,
        }))}
        onChange={(value) => onChange("taxRateLabel", value)}
        placeholder="Select tax rate"
        modalTitle="Select tax rate"
      />

      <LabeledTextInput
        label="Description"
        value={form.description}
        placeholder="Optional description"
        onChangeText={(value) => onChange("description", value)}
        multiline={true}
        numberOfLines={4}
      />

    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  fieldWrap: {
    gap: 6,
  },
  inputLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterBold",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  actionButton: {
    flex: 1,
  },
  imagePreview: {
    width: "100%",
    height: 142,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  imagePreviewImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  imagePlaceholderText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  imageActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  imageActionButton: {
    minWidth: 126,
  },
  removeImageLabel: {
    color: colors.destructive,
  },
});
