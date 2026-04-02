import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { LedgerDeleteViewModel } from "@/feature/ledger/viewModel/ledgerDelete.viewModel";

type LedgerDeleteModalProps = {
  viewModel: LedgerDeleteViewModel;
};

export function LedgerDeleteModal({
  viewModel,
}: LedgerDeleteModalProps) {
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
          <Text style={styles.title}>Delete ledger entry?</Text>
          <Text style={styles.subtitle}>
            This removes the selected ledger entry from this business ledger list.
            You can not undo this from the current screen.
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
              label={viewModel.isDeleting ? "Deleting..." : "Delete"}
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
  subtitle: {
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
});
