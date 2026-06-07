import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { X } from "lucide-react-native";
import { AppIconButton } from "@/shared/components/reusable/Buttons/AppIconButton";
import { BottomSheetFormModal } from "@/shared/components/reusable/Modals/BottomSheetFormModal";
import { CenteredDialogFormModal } from "@/shared/components/reusable/Modals/CenteredDialogFormModal";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";

type FormSheetModalPresentation = "bottom-sheet" | "dialog";

type FormSheetModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeAccessibilityLabel?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  presentation?: FormSheetModalPresentation;
  backdropStyle?: StyleProp<ViewStyle>;
};

export function FormSheetModal({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
  closeAccessibilityLabel = "Close form",
  contentContainerStyle,
  sheetStyle,
  scrollEnabled = true,
  presentation = "bottom-sheet",
  backdropStyle,
}: FormSheetModalProps) {
  const isDialogPresentation = presentation === "dialog";
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        title: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(18),
          fontFamily: "InterBold",
        },
        subtitle: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
        handle: {
          width: theme.scaleSpace(42),
          height: theme.scaleSpace(4),
          borderRadius: radius.pill,
          backgroundColor: theme.colors.border,
          alignSelf: "center",
          marginBottom: theme.scaleSpace(spacing.sm),
        },
        headerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: theme.scaleSpace(spacing.sm),
        },
        headerTextWrap: {
          flex: 1,
          gap: 2,
        },
        bottomSheetHeader: {
          paddingHorizontal: theme.scaleSpace(spacing.lg),
          paddingTop: theme.scaleSpace(spacing.xs),
          paddingBottom: theme.scaleSpace(spacing.sm),
        },
        dialogHeader: {
          paddingHorizontal: theme.scaleSpace(spacing.md),
          paddingTop: theme.scaleSpace(spacing.md),
          paddingBottom: theme.scaleSpace(spacing.sm),
        },
        bottomSheetContent: {
          gap: theme.scaleSpace(spacing.sm),
          paddingHorizontal: theme.scaleSpace(spacing.lg),
          paddingBottom: theme.scaleSpace(spacing.md),
        },
        dialogContent: {
          gap: theme.scaleSpace(spacing.sm),
          paddingHorizontal: theme.scaleSpace(spacing.md),
          paddingBottom: theme.scaleSpace(spacing.md),
        },
        contentWithFooter: {
          paddingBottom: theme.scaleSpace(spacing.sm),
        },
        bottomSheetFooter: {
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: theme.scaleSpace(spacing.sm),
          paddingHorizontal: theme.scaleSpace(spacing.lg),
          backgroundColor: theme.colors.card,
        },
        dialogFooter: {
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: theme.scaleSpace(spacing.sm),
          paddingHorizontal: theme.scaleSpace(spacing.md),
          backgroundColor: theme.colors.card,
        },
      }),
    [theme],
  );

  const resolvedContentContainerStyle = React.useMemo(
    () => [
      isDialogPresentation ? styles.dialogContent : styles.bottomSheetContent,
      footer ? styles.contentWithFooter : null,
      contentContainerStyle,
    ],
    [
      contentContainerStyle,
      footer,
      isDialogPresentation,
      styles.bottomSheetContent,
      styles.contentWithFooter,
      styles.dialogContent,
    ],
  );

  const headerContent = (
    <>
      {isDialogPresentation ? null : <View style={styles.handle} />}

      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <AppIconButton
          size="md"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeAccessibilityLabel}
        >
          <X size={18} color={theme.colors.mutedForeground} />
        </AppIconButton>
      </View>
    </>
  );

  if (isDialogPresentation) {
    return (
      <CenteredDialogFormModal
        visible={visible}
        onClose={onClose}
        header={headerContent}
        headerContainerStyle={styles.dialogHeader}
        contentContainerStyle={resolvedContentContainerStyle}
        footer={footer}
        footerContainerStyle={styles.dialogFooter}
        cardStyle={sheetStyle}
        backdropStyle={backdropStyle}
        scrollEnabled={scrollEnabled}
      >
        {children}
      </CenteredDialogFormModal>
    );
  }

  return (
    <BottomSheetFormModal
      visible={visible}
      onClose={onClose}
      header={headerContent}
      headerContainerStyle={styles.bottomSheetHeader}
      contentContainerStyle={resolvedContentContainerStyle}
      footer={footer}
      footerContainerStyle={styles.bottomSheetFooter}
      sheetStyle={sheetStyle}
      backdropStyle={backdropStyle}
      scrollEnabled={scrollEnabled}
    >
      {children}
    </BottomSheetFormModal>
  );
}
