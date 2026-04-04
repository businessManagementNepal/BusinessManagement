import {
  BUSINESS_CONTACT_TYPE_OPTIONS,
  PERSONAL_CONTACT_TYPE_OPTIONS,
} from "@/feature/contacts/types/contact.types";
import { ContactFormState } from "@/feature/contacts/viewModel/contacts.viewModel";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Dropdown } from "@/shared/components/reusable/DropDown/Dropdown";
import { AppTextInput } from "@/shared/components/reusable/Form/AppTextInput";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { X } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  disableSubmit = false,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.formWrap}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
              placeholder="Opening Balance (NPR)"
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

            <AppButton
              label="Save Contact"
              size="lg"
              onPress={() => {
                void onSubmit();
              }}
              disabled={disableSubmit}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: "86%",
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    zIndex: 1,
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
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  formWrap: {
    gap: spacing.md,
    paddingBottom: spacing.md,
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
});
