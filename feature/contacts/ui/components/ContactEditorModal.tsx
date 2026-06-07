import {
  BUSINESS_CONTACT_TYPE_OPTIONS,
  PERSONAL_CONTACT_TYPE_OPTIONS,
} from "@/feature/contacts/types/contact.types";
import { ContactFormState } from "@/feature/contacts/viewModel/contacts.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import {
  DefaultSection,
  MoreDetailsSection,
} from "@/shared/components/reusable/Form/FormSections";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledDropdownField } from "@/shared/components/reusable/Form/LabeledDropdownField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { StickyActionFooter } from "@/shared/components/reusable/Form/StickyActionFooter";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
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
  onChange: (
    field: keyof Omit<ContactFormState, "fieldErrors">,
    value: string,
  ) => void;
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
  const styles = useThemedStyles(createStyles);
  const shouldExpandMoreDetails =
    form.emailAddress.trim().length > 0 ||
    form.address.trim().length > 0 ||
    form.taxId.trim().length > 0 ||
    form.notes.trim().length > 0;

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
        <StickyActionFooter>
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
        </StickyActionFooter>
      }
    >
      <DefaultSection
        title="Contact Details"
        subtitle="Required identity and opening balance fields stay visible by default."
      >
        <LabeledTextInput
          label="Full Name *"
          value={form.fullName}
          placeholder="Full Name"
          onChangeText={(value) => onChange("fullName", value)}
          autoCapitalize="words"
          errorText={form.fieldErrors.fullName}
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
          errorText={form.fieldErrors.phoneNumber}
        />

        <LabeledTextInput
          label="Opening Balance"
          value={form.openingBalance}
          placeholder={openingBalancePlaceholder}
          keyboardType="decimal-pad"
          onChangeText={(value) => onChange("openingBalance", value)}
          errorText={form.fieldErrors.openingBalance}
        />
      </DefaultSection>

      <MoreDetailsSection
        title="More Details"
        subtitle="Optional contact details, tax ID, and notes."
        defaultExpanded={shouldExpandMoreDetails}
      >
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
          label="Notes"
          value={form.notes}
          placeholder="Notes"
          multiline={true}
          numberOfLines={4}
          onChangeText={(value) => onChange("notes", value)}
        />
      </MoreDetailsSection>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    formWrap: {
      gap: theme.scaleSpace(spacing.md),
      paddingBottom: theme.scaleSpace(spacing.xl),
    },
    actionButton: {
      flex: 1,
    },
  });
