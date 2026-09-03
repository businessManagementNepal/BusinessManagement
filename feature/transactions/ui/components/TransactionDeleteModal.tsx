import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { TransactionDeleteViewModel } from "@/feature/transactions/viewModel/transactionDelete.viewModel";

type TransactionDeleteModalProps = {
  viewModel: TransactionDeleteViewModel;
};

export function TransactionDeleteModal({
  viewModel,
}: TransactionDeleteModalProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: theme.colors.overlay,
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
          lineHeight: theme.scaleLineHeight(22),
          fontFamily: "InterBold",
        },
        subtitle: {
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
      }),
    [theme],
  );

  return (
    <Modal
      visible={Boolean(viewModel.pendingDeleteRemoteId)}
      transparent={true}
      animationType="fade"
      onRequestClose={viewModel.closeDelete}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={viewModel.closeDelete} />

        <View style={styles.card}>
          <Text style={styles.title}>Void transaction?</Text>
          <Text style={styles.subtitle}>
            This reverses the money movement and keeps a voided entry in
            history. You can not undo this from the current screen.
          </Text>

          {viewModel.errorMessage ? (
            <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
          ) : null}

          <View style={styles.actionRow}>
            <AppButton
              label="Cancel"
              variant="secondary"
              size="md"
              style={styles.actionButton}
              onPress={viewModel.closeDelete}
              disabled={viewModel.isDeleting}
            />
            <AppButton
              label={viewModel.isDeleting ? "Voiding..." : "Void"}
              variant="primary"
              size="md"
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => void viewModel.confirmDelete()}
              disabled={viewModel.isDeleting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
