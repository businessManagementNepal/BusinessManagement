import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { AppTextInput } from "@/shared/components/reusable/Form/AppTextInput";
import { CenteredDialogFormModal } from "@/shared/components/reusable/Modals/CenteredDialogFormModal";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

type BusinessNotesModalProps = {
  visible: boolean;
  title: string;
  placeholder: string;
  notesInput: string;
  errorMessage: string | null;
  saveButtonLabel: string;
  isSaving: boolean;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onSave: () => Promise<void> | void;
};

export function BusinessNotesModal({
  visible,
  title,
  placeholder,
  notesInput,
  errorMessage,
  saveButtonLabel,
  isSaving,
  onNotesChange,
  onClose,
  onSave,
}: BusinessNotesModalProps) {
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
      footer={
        <AppButton
          label={saveButtonLabel}
          variant="primary"
          size="lg"
          style={styles.saveButton}
          onPress={() => {
            void onSave();
          }}
          disabled={isSaving}
        />
      }
      footerContainerStyle={styles.footer}
      minHeight={320}
    >
      <AppTextInput
        value={notesInput}
        onChangeText={onNotesChange}
        placeholder={placeholder}
        multiline
        numberOfLines={8}
        containerStyle={styles.inputWrap}
        style={styles.inputText}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
    title: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(18),
      fontFamily: "InterBold",
    },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    inputWrap: {
      minHeight: 220,
      alignItems: "flex-start",
      paddingTop: theme.scaleSpace(spacing.sm),
      backgroundColor: theme.colors.secondary,
    },
    inputText: {
      minHeight: 180,
      paddingTop: theme.scaleSpace(spacing.xs),
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterMedium",
    },
    saveButton: {
      width: "100%",
    },
  });
