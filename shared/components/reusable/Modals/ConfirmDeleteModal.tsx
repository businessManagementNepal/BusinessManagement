import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

type ConfirmDeleteModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isDeleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps): React.ReactElement {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onCancel} />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.actionRow}>
            <AppButton
              label={cancelLabel}
              variant="secondary"
              size="md"
              style={styles.actionButton}
              onPress={onCancel}
              disabled={isDeleting}
            />
            <AppButton
              label={isDeleting ? "Deleting..." : confirmLabel}
              size="md"
              style={[styles.actionButton, styles.deleteButton]}
              labelStyle={styles.deleteLabel}
              onPress={onConfirm}
              disabled={isDeleting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      paddingHorizontal: theme.scaleSpace(spacing.lg),
    },
    dismissArea: {
      ...StyleSheet.absoluteFill,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.scaleSpace(spacing.lg),
      zIndex: 1,
    },
    title: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(18),
      fontFamily: "InterBold",
    },
    message: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      marginTop: theme.scaleSpace(spacing.xs),
      lineHeight: theme.scaleLineHeight(20),
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      marginTop: theme.scaleSpace(spacing.sm),
      fontFamily: "InterMedium",
    },
    actionRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
      marginTop: theme.scaleSpace(spacing.lg),
    },
    actionButton: {
      flex: 1,
    },
    deleteButton: {
      backgroundColor: theme.colors.destructive,
    },
    deleteLabel: {
      color: theme.colors.destructiveForeground,
    },
  });
