import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

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

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    zIndex: 1,
  },
  title: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  message: {
    color: colors.mutedForeground,
    fontSize: 13,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    marginTop: spacing.sm,
    fontFamily: "InterMedium",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: colors.destructive,
  },
  deleteLabel: {
    color: colors.destructiveForeground,
  },
});
