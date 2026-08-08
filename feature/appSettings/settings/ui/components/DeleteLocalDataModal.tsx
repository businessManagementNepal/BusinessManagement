import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { StickyActionFooter } from "@/shared/components/reusable/Form/StickyActionFooter";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Trash2 } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  DELETE_LOCAL_DATA_CONFIRMATION,
  isDeleteLocalDataActionDisabled,
} from "../../viewModel/deleteLocalDataConfirmation.util";

const DELETED_DATA_ITEMS = [
  "Profile and login credentials",
  "Businesses and local users/permissions",
  "Products, inventory, contacts, and notes",
  "Transactions, expenses, orders, POS records, and invoices",
  "Money accounts, ledger, budgets, and EMI/loans",
  "Settings, local reminders, and other eLekha app data",
] as const;

type DeleteLocalDataModalProps = {
  visible: boolean;
  confirmation: string;
  isDeleting: boolean;
  errorMessage: string | null;
  onChangeConfirmation: (value: string) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteLocalDataModal({
  visible,
  confirmation,
  isDeleting,
  errorMessage,
  onChangeConfirmation,
  onClose,
  onConfirm,
}: DeleteLocalDataModalProps) {
  const theme = useAppTheme();
  const isDeleteDisabled = isDeleteLocalDataActionDisabled({
    confirmation,
    isDeleting,
  });
  const handleClose = React.useCallback(() => {
    if (!isDeleting) {
      onClose();
    }
  }, [isDeleting, onClose]);
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: theme.scaleSpace(spacing.md),
        },
        warningCard: {
          gap: theme.scaleSpace(spacing.sm),
          padding: theme.scaleSpace(spacing.md),
          borderWidth: 1,
          borderColor: theme.colors.destructive,
          borderRadius: radius.lg,
          backgroundColor: theme.colors.card,
        },
        warningHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.scaleSpace(spacing.sm),
        },
        warningTitle: {
          flex: 1,
          color: theme.colors.destructive,
          fontSize: theme.scaleText(14),
          lineHeight: theme.scaleLineHeight(19),
          fontFamily: "InterBold",
        },
        warningText: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(13),
          lineHeight: theme.scaleLineHeight(19),
          fontFamily: "InterSemiBold",
        },
        secondaryWarning: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
        list: {
          gap: theme.scaleSpace(6),
        },
        listTitle: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(13),
          fontFamily: "InterBold",
        },
        listItem: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
        externalFilesNote: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterSemiBold",
        },
        errorText: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(17),
          fontFamily: "InterSemiBold",
        },
        actionButton: {
          flex: 1,
        },
        deleteButton: {
          backgroundColor: theme.colors.destructive,
        },
        deleteButtonLabel: {
          color: theme.colors.destructiveForeground,
        },
      }),
    [theme],
  );

  return (
    <FormSheetModal
      visible={visible}
      title="Delete Profile & All Data"
      subtitle="Permanent local-device deletion"
      onClose={handleClose}
      closeAccessibilityLabel="Close delete data confirmation"
      presentation="dialog"
      contentContainerStyle={styles.content}
      footer={
        <StickyActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={handleClose}
            disabled={isDeleting}
          />
          <AppButton
            label={isDeleting ? "Deleting..." : "Delete All Data"}
            size="lg"
            style={[styles.actionButton, styles.deleteButton]}
            labelStyle={styles.deleteButtonLabel}
            isLoading={isDeleting}
            onPress={() => {
              void onConfirm();
            }}
            disabled={isDeleteDisabled}
          />
        </StickyActionFooter>
      }
    >
      <View style={styles.warningCard}>
        <View style={styles.warningHeader}>
          <Trash2 size={20} color={theme.colors.destructive} />
          <Text style={styles.warningTitle}>
            This permanently deletes your eLekha profile, businesses, and all
            eLekha data stored on this device.
          </Text>
        </View>
        <Text style={styles.warningText}>
          This cannot be undone. Export anything you want to keep before
          deleting.
        </Text>
      </View>

      <View style={styles.list}>
        <Text style={styles.listTitle}>Deletion includes:</Text>
        {DELETED_DATA_ITEMS.map((item) => (
          <Text key={item} style={styles.listItem}>{`• ${item}`}</Text>
        ))}
      </View>

      <Text style={styles.externalFilesNote}>
        Files you previously exported or shared outside eLekha will not be
        deleted.
      </Text>
      <Text style={styles.secondaryWarning}>
        eLekha support cannot recover the deleted offline database.
      </Text>

      <LabeledTextInput
        label={`Type ${DELETE_LOCAL_DATA_CONFIRMATION} to confirm`}
        value={confirmation}
        onChangeText={onChangeConfirmation}
        editable={!isDeleting}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={DELETE_LOCAL_DATA_CONFIRMATION}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </FormSheetModal>
  );
}
