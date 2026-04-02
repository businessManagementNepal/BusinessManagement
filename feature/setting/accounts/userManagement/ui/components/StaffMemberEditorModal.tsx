import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { AppIconButton } from "@/shared/components/reusable/Buttons/AppIconButton";
import {
  ChipSelectorField,
  ChipSelectorOption,
} from "@/shared/components/reusable/Form/ChipSelectorField";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import {
  SignUpPhoneCountryCode,
  SignUpPhoneCountryOption,
} from "@/feature/auth/signUp/types/signUp.types";

export type StaffMemberRoleOption = {
  remoteId: string;
  label: string;
};

type StaffMemberEditorModalProps = {
  visible: boolean;
  mode: "create" | "edit";
  fullName: string;
  phoneCountryCode: SignUpPhoneCountryCode;
  phoneCountryOptions: readonly SignUpPhoneCountryOption[];
  phone: string;
  email: string;
  password: string;
  roleRemoteId: string | null;
  roleOptions: readonly StaffMemberRoleOption[];
  canAssignRoles: boolean;
  isSaving: boolean;
  onChangeFullName: (fullName: string) => void;
  onChangeSelectedPhoneCountry: (phoneCountryCode: SignUpPhoneCountryCode) => void;
  onChangePhone: (phone: string) => void;
  onChangeEmail: (email: string) => void;
  onChangePassword: (password: string) => void;
  onChangeRole: (roleRemoteId: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function StaffMemberEditorModal({
  visible,
  mode,
  fullName,
  phoneCountryCode,
  phoneCountryOptions,
  phone,
  email,
  password,
  roleRemoteId,
  roleOptions,
  canAssignRoles,
  isSaving,
  onChangeFullName,
  onChangeSelectedPhoneCountry,
  onChangePhone,
  onChangeEmail,
  onChangePassword,
  onChangeRole,
  onCancel,
  onSave,
}: StaffMemberEditorModalProps) {
  const title = mode === "create" ? "Add Staff Member" : "Edit Staff Member";
  const phoneCountrySelectorOptions: ChipSelectorOption<SignUpPhoneCountryCode>[] =
    phoneCountryOptions.map((phoneCountryOption) => ({
      value: phoneCountryOption.code,
      label: phoneCountryOption.label,
    }));
  const roleSelectorOptions: ChipSelectorOption<string>[] = roleOptions.map((roleOption) => ({
    value: roleOption.remoteId,
    label: roleOption.label,
  }));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={onCancel} />

        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>Set profile and role access</Text>
            </View>

            <AppIconButton
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Close staff editor"
            >
              <X size={18} color={colors.mutedForeground} />
            </AppIconButton>
          </View>

          <LabeledTextInput
            label="Full name"
            value={fullName}
            onChangeText={onChangeFullName}
            placeholder="Enter full name"
            editable={!isSaving}
            containerStyle={styles.fieldSpacing}
          />

          <ChipSelectorField
            label="Phone country"
            options={phoneCountrySelectorOptions}
            selectedValue={phoneCountryCode}
            onSelect={onChangeSelectedPhoneCountry}
            disabled={isSaving}
          />

          <LabeledTextInput
            label="Phone number"
            value={phone}
            onChangeText={onChangePhone}
            placeholder="Enter local phone number"
            keyboardType="phone-pad"
            editable={!isSaving}
            containerStyle={styles.fieldSpacing}
          />

          <LabeledTextInput
            label="Email (optional)"
            value={email}
            onChangeText={onChangeEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSaving}
            containerStyle={styles.fieldSpacing}
          />

          <LabeledTextInput
            label={mode === "create" ? "Password" : "Reset password (optional)"}
            value={password}
            onChangeText={onChangePassword}
            placeholder={mode === "create" ? "Set password" : "Leave blank to keep current password"}
            secureTextEntry={true}
            editable={!isSaving}
            containerStyle={styles.fieldSpacing}
          />

          <ChipSelectorField
            label="Role"
            options={roleSelectorOptions}
            selectedValue={roleRemoteId}
            onSelect={onChangeRole}
            disabled={isSaving}
            isOptionDisabled={() => !canAssignRoles}
          />

          <View style={styles.actionRow}>
            <AppButton
              label="Cancel"
              variant="secondary"
              size="md"
              style={styles.actionButton}
              onPress={onCancel}
              disabled={isSaving}
            />
            <AppButton
              label={isSaving ? "Saving..." : "Save"}
              variant="primary"
              size="md"
              style={styles.actionButton}
              onPress={onSave}
              disabled={isSaving}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    width: "100%",
    maxHeight: "88%",
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    zIndex: 1,
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  modalTitle: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  modalSubtitle: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  fieldSpacing: {
    marginBottom: spacing.sm,
  },
  actionRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});
