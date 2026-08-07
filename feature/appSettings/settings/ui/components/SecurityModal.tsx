import { Card } from "@/shared/components/reusable/Cards/Card";
import { useToastMessage } from "@/shared/components/reusable/Feedback/useToastMessage";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { KeyRound, LockKeyhole } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SecurityModalProps = {
  visible: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  passwordChangedLabel: string;
  onClose: () => void;
  onOpenChangePassword: () => void;
};

type SecurityRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  rightContent: React.ReactNode;
  onPress: () => void;
};

const SecurityRow = ({
  icon,
  title,
  subtitle,
  rightContent,
  onPress,
}: SecurityRowProps) => {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          minHeight: theme.scaleSpace(78),
          flexDirection: "row",
          alignItems: "center",
          gap: theme.scaleSpace(spacing.sm),
          paddingHorizontal: theme.scaleSpace(spacing.md),
          paddingVertical: theme.scaleSpace(spacing.md),
        },
        rowIconWrap: {
          width: theme.scaleSpace(36),
          height: theme.scaleSpace(36),
          borderRadius: radius.pill,
          backgroundColor: theme.colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        rowTextWrap: {
          flex: 1,
        },
        rowTitle: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(15),
          fontFamily: "InterBold",
          marginBottom: 2,
        },
        rowSubtitle: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(17),
          fontFamily: "InterMedium",
        },
      }),
    [theme],
  );

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.rowIconWrap}>{icon}</View>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {rightContent}
    </Pressable>
  );
};

export function SecurityModal({
  visible,
  errorMessage,
  successMessage,
  passwordChangedLabel,
  onClose,
  onOpenChangePassword,
}: SecurityModalProps) {
  useToastMessage({
    message: visible ? successMessage : null,
    type: "success",
  });

  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: theme.scaleSpace(spacing.md),
        },
        listCard: {
          padding: 0,
          overflow: "hidden",
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(17),
          fontFamily: "InterSemiBold",
        },
      }),
    [theme],
  );

  return (
    <FormSheetModal
      visible={visible}
      title="Security"
      onClose={onClose}
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
    >
      <Card style={styles.listCard}>
        <SecurityRow
          icon={<LockKeyhole size={18} color={theme.colors.primary} />}
          title="Change Password"
          subtitle={passwordChangedLabel}
          rightContent={
            <KeyRound size={18} color={theme.colors.mutedForeground} />
          }
          onPress={onOpenChangePassword}
        />
      </Card>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </FormSheetModal>
  );
}
