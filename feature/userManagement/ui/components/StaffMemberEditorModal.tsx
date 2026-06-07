import {
  SignUpPhoneCountryCode,
  SignUpPhoneCountryOption,
} from "@/feature/auth/signUp/types/signUp.types";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import {
  ChipSelectorField,
  ChipSelectorOption,
} from "@/shared/components/reusable/Form/ChipSelectorField";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import {
  RoleOptionGrid,
  RoleOptionGridItem,
} from "@/shared/components/reusable/Form/RoleOptionGrid";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { UserManagementMemberEditorFieldErrors } from "@/feature/userManagement/viewModel/userManagement.state";

export type StaffMemberRoleOption = {
  remoteId: string;
  label: string;
  category: "default" | "custom";
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
  fieldErrors: UserManagementMemberEditorFieldErrors;
  canAssignRoles: boolean;
  canManageRolePermissions: boolean;
  isSaving: boolean;
  isSavingRole: boolean;
  onChangeFullName: (fullName: string) => void;
  onChangeSelectedPhoneCountry: (phoneCountryCode: SignUpPhoneCountryCode) => void;
  onChangePhone: (phone: string) => void;
  onChangeEmail: (email: string) => void;
  onChangePassword: (password: string) => void;
  onChangeRole: (roleRemoteId: string) => void;
  onStartCreateCustomRole: () => void;
  onManageRolePermissions: () => void;
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
  fieldErrors,
  canAssignRoles,
  canManageRolePermissions,
  isSaving,
  isSavingRole,
  onChangeFullName,
  onChangeSelectedPhoneCountry,
  onChangePhone,
  onChangeEmail,
  onChangePassword,
  onChangeRole,
  onStartCreateCustomRole,
  onManageRolePermissions,
  onCancel,
  onSave,
}: StaffMemberEditorModalProps) {
  const styles = useThemedStyles(createStyles);
  const title = mode === "create" ? "Add Staff Member" : "Edit Staff Member";
  const phoneCountrySelectorOptions: ChipSelectorOption<SignUpPhoneCountryCode>[] =
    phoneCountryOptions.map((phoneCountryOption) => ({
      value: phoneCountryOption.code,
      label: phoneCountryOption.label,
    }));

  const roleGridOptions: RoleOptionGridItem<string>[] = roleOptions.map((roleOption) => ({
    value: roleOption.remoteId,
    label: roleOption.label,
    category: roleOption.category,
  }));

  const selectedRole = roleOptions.find((roleOption) => roleOption.remoteId === roleRemoteId);
  const canManageSelectedRolePermissions =
    canManageRolePermissions && Boolean(roleRemoteId);

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle="Set profile and role access"
      onClose={onCancel}
      closeAccessibilityLabel="Close staff editor"
      contentContainerStyle={styles.content}
      presentation="bottom-sheet"
      footer={
        <FormModalActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={onCancel}
            disabled={isSaving}
          />
          <AppButton
            label={isSaving ? "Saving..." : "Save"}
            variant="primary"
            size="lg"
            style={styles.actionButton}
            onPress={onSave}
            disabled={isSaving}
          />
        </FormModalActionFooter>
      }
    >
      <LabeledTextInput
        label="Full Name"
        value={fullName}
        onChangeText={onChangeFullName}
        placeholder="Enter full name"
        editable={!isSaving}
        errorText={fieldErrors.fullName}
      />

      <ChipSelectorField
        label="Phone Country"
        options={phoneCountrySelectorOptions}
        selectedValue={phoneCountryCode}
        onSelect={onChangeSelectedPhoneCountry}
        disabled={isSaving}
      />

      <LabeledTextInput
        label="Phone Number"
        value={phone}
        onChangeText={onChangePhone}
        placeholder="Enter local phone number"
        keyboardType="phone-pad"
        editable={!isSaving}
        errorText={fieldErrors.phone}
      />

      <LabeledTextInput
        label="Email (Optional)"
        value={email}
        onChangeText={onChangeEmail}
        placeholder="Enter email"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isSaving}
      />

      <LabeledTextInput
        label={mode === "create" ? "Password" : "Reset Password (Optional)"}
        value={password}
        onChangeText={onChangePassword}
        placeholder={
          mode === "create" ? "Set password" : "Leave blank to keep current password"
        }
        secureTextEntry={true}
        editable={!isSaving}
        errorText={fieldErrors.password}
      />

      <View style={styles.roleSectionWrap}>
        <View style={styles.roleSectionHeader}>
          <Text style={styles.inlineFieldLabel}>Select Role</Text>
          {canManageRolePermissions ? (
            <AppButton
              label="Create Custom Role"
              variant="secondary"
              size="sm"
              onPress={onStartCreateCustomRole}
              disabled={isSaving || isSavingRole}
            />
          ) : null}
        </View>

        {roleGridOptions.length === 0 ? (
          <Text style={styles.noRoleText}>
            No roles available. Create a custom role to continue.
          </Text>
        ) : (
          <RoleOptionGrid
            options={roleGridOptions}
            selectedValue={roleRemoteId}
            onSelect={onChangeRole}
            disabled={isSaving}
            isOptionDisabled={() => !canAssignRoles}
          />
        )}

        {fieldErrors.roleRemoteId ? (
          <Text style={styles.inlineErrorText}>{fieldErrors.roleRemoteId}</Text>
        ) : null}
      </View>

      <Card style={styles.permissionCard}>
        <Text style={styles.permissionCardTitle}>Permission Access</Text>
        <Text style={styles.permissionCardSubtitle}>
          {selectedRole
            ? `You can view or modify permissions for ${selectedRole.label}.`
            : "Select a role first, then manage its permissions."}
        </Text>

        <AppButton
          label={isSavingRole ? "Opening..." : "Manage Permission"}
          variant="secondary"
          size="md"
          style={styles.permissionButton}
          onPress={onManageRolePermissions}
          disabled={isSaving || isSavingRole || !canManageSelectedRolePermissions}
        />
      </Card>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
      paddingBottom: theme.scaleSpace(spacing.xl),
    },
    inlineFieldLabel: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterBold",
    },
    roleSectionWrap: {
      gap: theme.scaleSpace(spacing.xs),
    },
    roleSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.scaleSpace(spacing.xs),
    },
    noRoleText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
    inlineErrorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    permissionCard: {
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.xs),
    },
    permissionCardTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    permissionCardSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterMedium",
    },
    permissionButton: {
      marginTop: theme.scaleSpace(spacing.xs),
    },
    actionButton: {
      flex: 1,
    },
  });
