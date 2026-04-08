import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { SettingsChangePasswordForm } from "../../viewModel/settings.viewModel";

type ChangePasswordModalProps = {
  visible: boolean;
  form: SettingsChangePasswordForm;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onClose: () => void;
  onChange: (field: keyof SettingsChangePasswordForm, value: string) => void;
  onSubmit: () => Promise<void>;
};

export function ChangePasswordModal({
  visible,
  form,
  isSubmitting,
  errorMessage,
  successMessage,
  onClose,
  onChange,
  onSubmit,
}: ChangePasswordModalProps) {
  return (
    <FormSheetModal
      visible={visible}
      title="Change Password"
      subtitle="Update your login password"
      onClose={onClose}
      presentation="dialog"
      contentContainerStyle={styles.content}
    >
      <LabeledTextInput
        label="Current Password"
        value={form.currentPassword}
        onChangeText={(value) => onChange("currentPassword", value)}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <LabeledTextInput
        label="New Password"
        value={form.nextPassword}
        onChangeText={(value) => onChange("nextPassword", value)}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <LabeledTextInput
        label="Confirm Password"
        value={form.confirmPassword}
        onChangeText={(value) => onChange("confirmPassword", value)}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <AppButton
        label={isSubmitting ? "Updating Password..." : "Update Password"}
        size="lg"
        onPress={() => {
          void onSubmit();
        }}
        disabled={isSubmitting}
      />
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterSemiBold",
  },
  successText: {
    color: colors.success,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterSemiBold",
  },
});
