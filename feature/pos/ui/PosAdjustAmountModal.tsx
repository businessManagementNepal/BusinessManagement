import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { CenteredDialogFormModal } from "@/shared/components/reusable/Modals/CenteredDialogFormModal";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

type PosAdjustAmountModalProps = {
  visible: boolean;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function PosAdjustAmountModal({
  visible,
  title,
  value,
  onChange,
  onConfirm,
  onClose,
}: PosAdjustAmountModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <CenteredDialogFormModal
      visible={visible}
      onClose={onClose}
      header={
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={22} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      }
      headerContainerStyle={styles.headerContainer}
      contentContainerStyle={styles.content}
      footer={<AppButton label="Apply" onPress={onConfirm} size="lg" />}
      footerContainerStyle={styles.footer}
      minHeight={260}
    >
      <Text style={styles.label}>Enter amount</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={theme.colors.mutedForeground}
        style={styles.input}
      />
    </CenteredDialogFormModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    headerContainer: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.lg),
      paddingBottom: theme.scaleSpace(spacing.sm),
    },
    content: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingBottom: theme.scaleSpace(spacing.sm),
      gap: theme.scaleSpace(spacing.md),
    },
    footer: {
      paddingHorizontal: theme.scaleSpace(spacing.lg),
      paddingTop: theme.scaleSpace(spacing.sm),
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    closeButton: {
      width: theme.scaleSpace(36),
      height: theme.scaleSpace(36),
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: theme.colors.cardForeground,
      fontFamily: "InterBold",
      fontSize: theme.scaleText(18),
    },
    label: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterMedium",
    },
    input: {
      minHeight: theme.scaleSpace(52),
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      fontFamily: "InterMedium",
    },
  });
