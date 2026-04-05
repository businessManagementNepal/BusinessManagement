import { ProductKind } from "@/feature/products/types/product.types";
import { ProductFormState } from "@/feature/products/viewModel/products.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type ProductEditorModalProps = {
  visible: boolean;
  mode: "create" | "edit";
  form: ProductFormState;
  categoryOptions: readonly string[];
  unitOptions: readonly string[];
  taxRateOptions: readonly string[];
  onClose: () => void;
  onChange: (field: keyof ProductFormState, value: string) => void;
  onSubmit: () => Promise<void>;
};

export function ProductEditorModal({
  visible,
  mode,
  form,
  categoryOptions,
  unitOptions,
  taxRateOptions,
  onClose,
  onChange,
  onSubmit,
}: ProductEditorModalProps) {
  const title = mode === "create" ? "New Product" : "Edit Product";
  const categoryDropdownOptions = [
    { label: "No category", value: "" },
    ...categoryOptions.map((categoryName) => ({
      label: categoryName,
      value: categoryName,
    })),
  ];

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Manage item or service pricing and stock details"
      onClose={onClose}
      closeAccessibilityLabel="Close product editor"
      presentation="dialog"
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
      <LabeledTextInput
        label="Image URL"
        value={form.imageUrl}
        placeholder="Product photo URL (optional)"
        onChangeText={(value) => onChange("imageUrl", value)}
      />

      <LabeledTextInput
        label="Product Name"
        value={form.name}
        placeholder="Enter product name"
        onChangeText={(value) => onChange("name", value)}
        autoCapitalize="words"
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.inputLabel}>Type</Text>
        <Dropdown
          value={form.kind}
          options={[
            { label: "Item", value: ProductKind.Item },
            { label: "Service", value: ProductKind.Service },
          ]}
          onChange={(value) => onChange("kind", value)}
          placeholder="Select type"
          modalTitle="Select product type"
          showLeadingIcon={false}
          triggerStyle={styles.dropdownTrigger}
          triggerTextStyle={styles.dropdownText}
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.inputLabel}>Category</Text>
        <Dropdown
          value={form.categoryName}
          options={categoryDropdownOptions}
          onChange={(value) => onChange("categoryName", value)}
          placeholder="No category"
          modalTitle="Select category"
          showLeadingIcon={false}
          triggerStyle={styles.dropdownTrigger}
          triggerTextStyle={styles.dropdownText}
        />
      </View>

      <View style={styles.doubleRow}>
        <LabeledTextInput
          label="Sale Price"
          value={form.salePrice}
          placeholder="0"
          keyboardType="decimal-pad"
          onChangeText={(value) => onChange("salePrice", value)}
          containerStyle={styles.flexOne}
        />
        <LabeledTextInput
          label="Cost Price"
          value={form.costPrice}
          placeholder="0"
          keyboardType="decimal-pad"
          onChangeText={(value) => onChange("costPrice", value)}
          containerStyle={styles.flexOne}
        />
      </View>

      {form.kind === ProductKind.Item ? (
        <View style={styles.doubleRow}>
          <LabeledTextInput
            label="Stock Quantity"
            value={form.stockQuantity}
            placeholder="0"
            keyboardType="decimal-pad"
            onChangeText={(value) => onChange("stockQuantity", value)}
            containerStyle={styles.flexOne}
          />
          <View style={[styles.flexOne, styles.fieldWrap]}>
            <Text style={styles.inputLabel}>Unit</Text>
            <Dropdown
              value={form.unitLabel}
              options={unitOptions.map((unitLabel) => ({
                label: unitLabel,
                value: unitLabel,
              }))}
              onChange={(value) => onChange("unitLabel", value)}
              placeholder="Select unit"
              modalTitle="Select unit"
              showLeadingIcon={false}
              triggerStyle={styles.dropdownTrigger}
              triggerTextStyle={styles.dropdownText}
            />
          </View>
        </View>
      ) : null}

      <LabeledTextInput
        label="SKU / Barcode"
        value={form.skuOrBarcode}
        placeholder="Optional SKU or barcode"
        onChangeText={(value) => onChange("skuOrBarcode", value)}
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.inputLabel}>Tax Rate</Text>
        <Dropdown
          value={form.taxRateLabel}
          options={taxRateOptions.map((taxRate) => ({
            label: taxRate,
            value: taxRate,
          }))}
          onChange={(value) => onChange("taxRateLabel", value)}
          placeholder="Select tax rate"
          modalTitle="Select tax rate"
          showLeadingIcon={false}
          triggerStyle={styles.dropdownTrigger}
          triggerTextStyle={styles.dropdownText}
        />
      </View>

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
  dropdownTrigger: {
    minHeight: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    borderColor: colors.border,
  },
  dropdownText: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
  },
  doubleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexOne: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
  },
});
