import {
    BUSINESS_CONTACT_TYPE_OPTIONS,
    PERSONAL_CONTACT_TYPE_OPTIONS,
} from "@/feature/contacts/types/contact.types";
import { ContactFormState } from "@/feature/contacts/viewModel/contacts.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { StyleSheet } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  form: ContactFormState;
  typeOptions:
    | typeof BUSINESS_CONTACT_TYPE_OPTIONS
    | typeof PERSONAL_CONTACT_TYPE_OPTIONS;
  onClose: () => void;
  onChange: (field: keyof ContactFormState, value: string) => void;
  onSubmit: () => Promise<void>;
  openingBalancePlaceholder: string;
  disableSubmit: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: (() => void) | null;
};

export function ContactEditorModal({
  visible,
  title,
  form,
  typeOptions,
  onClose,
  onChange,
  onSubmit,
  openingBalancePlaceholder,
  disableSubmit,
  canDelete,
  isDeleting,
  onDelete,
}: Props): React.ReactElement {
  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Manage customer and supplier details"
      onClose={onClose}
      closeAccessibilityLabel="Close contact editor"
      presentation="bottom-sheet"
      contentContainerStyle={styles.formWrap}
      footer={
        <FormModalActionFooter>
          {onDelete && canDelete ? (
            <AppButton
              label={isDeleting ? "Archiving..." : "Archive"}
              variant="secondary"
              size="lg"
              style={styles.actionButton}
              onPress={onDelete}
              disabled={!canDelete || isDeleting}
            />
          ) : null}
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={onClose}
          />
          <AppButton
            label="Save Contact"
            size="lg"
            style={styles.actionButton}
            onPress={() => {
              void onSubmit();
            }}
            disabled={disableSubmit}
          />
        </FormModalActionFooter>
      }
    >
      <LabeledTextInput
        label="Full Name *"
        value={form.fullName}
        placeholder="Full Name"
        onChangeText={(value) => onChange("fullName", value)}
        autoCapitalize="words"
      />

      <LabeledDropdownField
        label="Contact Type"
        value={form.contactType}
        options={typeOptions.map((item) => ({
          label: item.label,
          value: item.value,
        }))}
        onChange={(value) => onChange("contactType", value)}
        placeholder="Select contact type"
        modalTitle="Select contact type"
      />

      <LabeledTextInput
        label="Phone Number *"
        value={form.phoneNumber}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        onChangeText={(value) => onChange("phoneNumber", value)}
      />

      <LabeledTextInput
        label="Email Address"
        value={form.emailAddress}
        placeholder="Email Address"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(value) => onChange("emailAddress", value)}
      />

      <LabeledTextInput
        label="Address"
        value={form.address}
        placeholder="Address"
        onChangeText={(value) => onChange("address", value)}
      />

      <LabeledTextInput
        label="PAN / Tax ID"
        value={form.taxId}
        placeholder="PAN / Tax ID"
        onChangeText={(value) => onChange("taxId", value)}
      />

      <LabeledTextInput
        label="Opening Balance"
        value={form.openingBalance}
        placeholder={openingBalancePlaceholder}
        keyboardType="decimal-pad"
        onChangeText={(value) => onChange("openingBalance", value)}
      />

      <LabeledTextInput
        label="Notes"
        value={form.notes}
        placeholder="Notes"
        multiline={true}
        numberOfLines={4}
        onChangeText={(value) => onChange("notes", value)}
      />
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  formWrap: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
});
