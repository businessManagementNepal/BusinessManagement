import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import {
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Monitor,
  Shield,
} from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SecuritySessionItem } from "../../types/settings.types";

type SecurityModalProps = {
  visible: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  isSavingPreference: boolean;
  passwordChangedLabel: string;
  biometricLoginEnabled: boolean;
  twoFactorAuthEnabled: boolean;
  securitySessions: readonly SecuritySessionItem[];
  onClose: () => void;
  onOpenChangePassword: () => void;
  onToggleBiometricLogin: (value: boolean) => Promise<void>;
  onToggleTwoFactorAuth: (value: boolean) => Promise<void>;
};

const SecurityRow = ({
  icon,
  title,
  subtitle,
  borderBottom,
  rightContent,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  borderBottom?: boolean;
  rightContent?: React.ReactNode;
  onPress?: () => void;
}) => {
  const content = (
    <>
      <View style={styles.rowIconWrap}>{icon}</View>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {rightContent}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.row, borderBottom ? styles.rowBorder : null]}
        onPress={onPress}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, borderBottom ? styles.rowBorder : null]}>{content}</View>;
};

export function SecurityModal({
  visible,
  errorMessage,
  successMessage,
  isSavingPreference,
  passwordChangedLabel,
  biometricLoginEnabled,
  twoFactorAuthEnabled,
  securitySessions,
  onClose,
  onOpenChangePassword,
  onToggleBiometricLogin,
  onToggleTwoFactorAuth,
}: SecurityModalProps) {
  return (
    <FormSheetModal
      visible={visible}
      title="Security"
      onClose={onClose}
      presentation="dialog"
      contentContainerStyle={styles.content}
    >
      <Card style={styles.listCard}>
        <SecurityRow
          icon={<LockKeyhole size={18} color={colors.primary} />}
          title="Change Password"
          subtitle={passwordChangedLabel}
          borderBottom={true}
          rightContent={<KeyRound size={18} color={colors.mutedForeground} />}
          onPress={onOpenChangePassword}
        />

        <SecurityRow
          icon={<Fingerprint size={18} color={colors.primary} />}
          title="Biometric Login"
          subtitle="Fingerprint or Face ID"
          borderBottom={true}
          rightContent={
            <Switch
              value={biometricLoginEnabled}
              onValueChange={(value) => {
                void onToggleBiometricLogin(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          }
        />

        <SecurityRow
          icon={<Shield size={18} color={colors.primary} />}
          title="Two-Factor Auth (2FA)"
          subtitle="Extra layer of security"
          rightContent={
            <Switch
              value={twoFactorAuthEnabled}
              onValueChange={(value) => {
                void onToggleTwoFactorAuth(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          }
        />
      </Card>

      <Card style={styles.activeSessionCard}>
        <View style={styles.activeSessionHeader}>
          <Shield size={16} color={colors.primary} />
          <Text style={styles.activeSessionTitle}>Active Sessions</Text>
        </View>

        {securitySessions.map((session, index) => {
          const isLast = index === securitySessions.length - 1;

          return (
            <View
              key={session.id}
              style={[styles.sessionRow, !isLast ? styles.sessionRowBorder : null]}
            >
              <View style={styles.sessionTextWrap}>
                <View style={styles.sessionLabelWrap}>
                  <Monitor size={14} color={colors.mutedForeground} />
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                </View>
                <Text style={styles.sessionSubtitle}>{session.subtitle}</Text>
              </View>

              <Text
                style={[
                  styles.sessionActivity,
                  session.isActive ? styles.sessionActivityActive : null,
                ]}
              >
                {session.activityLabel}
              </Text>
            </View>
          );
        })}

        <AppButton
          label="Sign out all other sessions"
          variant="accent"
          size="md"
          disabled={true}
          style={styles.signOutButton}
        />
      </Card>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      {isSavingPreference ? <Text style={styles.infoText}>Saving security preference...</Text> : null}
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  listCard: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
    marginBottom: 2,
  },
  rowSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterMedium",
  },
  activeSessionCard: {
    backgroundColor: colors.accent,
    gap: spacing.sm,
  },
  activeSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeSessionTitle: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 2,
  },
  sessionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(31, 99, 64, 0.12)",
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  sessionTextWrap: {
    flex: 1,
  },
  sessionLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  sessionSubtitle: {
    marginTop: 4,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "InterMedium",
  },
  sessionActivity: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterSemiBold",
    textAlign: "right",
  },
  sessionActivityActive: {
    color: colors.primary,
  },
  signOutButton: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
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
  infoText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterMedium",
  },
});
