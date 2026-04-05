import {
  BUSINESS_CONTACT_TYPE_OPTIONS,
  PERSONAL_CONTACT_TYPE_OPTIONS,
} from "@/feature/contacts/types/contact.types";
import { ContactFormState } from "@/feature/contacts/viewModel/contacts.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { AppTextInput } from "@/shared/components/reusable/Form/AppTextInput";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
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
  disableSubmit?: boolean;
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
  disableSubmit = false,
}: Props) {
  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Manage customer and supplier details"
      onClose={onClose}
      closeAccessibilityLabel="Close contact editor"
      presentation="dialog"
      contentContainerStyle={styles.formWrap}
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
      <AppTextInput
        value={form.fullName}
        placeholder="Full Name *"
        onChangeText={(value) => onChange("fullName", value)}
        autoCapitalize="words"
      />

      <Dropdown
        value={form.contactType}
        options={typeOptions.map((item) => ({
          label: item.label,
          value: item.value,
        }))}
        onChange={(value) => onChange("contactType", value)}
        placeholder="Select contact type"
        modalTitle="Select contact type"
        showLeadingIcon={false}
        triggerStyle={styles.dropdownTrigger}
        triggerTextStyle={styles.dropdownText}
      />

      <AppTextInput
        value={form.phoneNumber}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        onChangeText={(value) => onChange("phoneNumber", value)}
      />
      <AppTextInput
        value={form.emailAddress}
        placeholder="Email Address"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(value) => onChange("emailAddress", value)}
      />
      <AppTextInput
        value={form.address}
        placeholder="Address"
        onChangeText={(value) => onChange("address", value)}
      />
      <AppTextInput
        value={form.taxId}
        placeholder="PAN / Tax ID"
        onChangeText={(value) => onChange("taxId", value)}
      />
      <AppTextInput
        value={form.openingBalance}
        placeholder={openingBalancePlaceholder}
        keyboardType="decimal-pad"
        onChangeText={(value) => onChange("openingBalance", value)}
      />
      <AppTextInput
        value={form.notes}
        placeholder="Notes"
        multiline={true}
        numberOfLines={4}
        onChangeText={(value) => onChange("notes", value)}
        style={styles.multilineInput}
      />
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  formWrap: {
    gap: spacing.md,
  },
  dropdownTrigger: {
    minHeight: 54,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: "InterMedium",
    color: colors.cardForeground,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  actionButton: {
    flex: 1,
  },
});
