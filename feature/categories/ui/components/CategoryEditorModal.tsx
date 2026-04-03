import React from "react";
import { Text } from "react-native";
import { CategoryKind, CategoryKindValue } from "@/feature/categories/types/category.types";
import { CategoryFormState } from "@/feature/categories/viewModel/categories.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";

const CATEGORY_KIND_OPTIONS = [
  { label: "Income", value: CategoryKind.Income },
  { label: "Expense", value: CategoryKind.Expense },
  { label: "Business", value: CategoryKind.Business },
  { label: "Product", value: CategoryKind.Product },
] as const;

type Props = {
  visible: boolean;
  title: string;
  form: CategoryFormState;
  allowedKinds: readonly CategoryKindValue[];
  onClose: () => void;
  onChange: (field: keyof CategoryFormState, value: string) => void;
  onSubmit: () => Promise<void>;
};

export function CategoryEditorModal({
  visible,
  title,
  form,
  allowedKinds,
  onClose,
  onChange,
  onSubmit,
}: Props) {
  return (
    <FormSheetModal visible={visible} title={title} onClose={onClose}>
      <LabeledTextInput
        label="Category Name"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        placeholder="Category Name"
      />

      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "InterBold", textTransform: "uppercase", letterSpacing: 0.45 }}>Type</Text>
      <Dropdown
        value={form.kind}
        options={CATEGORY_KIND_OPTIONS.filter((item) => allowedKinds.includes(item.value))}
        onChange={(value) => onChange("kind", value)}
        placeholder="Choose category type"
        modalTitle="Choose category type"
        showLeadingIcon={false}
      />

      <LabeledTextInput
        label="Description"
        value={form.description}
        onChangeText={(value) => onChange("description", value)}
        placeholder="Description"
        multiline={true}
      />

      <AppButton label="Save Category" variant="primary" size="lg" onPress={() => void onSubmit()} />
    </FormSheetModal>
  );
}
