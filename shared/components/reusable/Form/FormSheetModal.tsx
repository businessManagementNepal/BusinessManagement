import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { X } from "lucide-react-native";
import { AppIconButton } from "@/shared/components/reusable/Buttons/AppIconButton";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

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
  const keyboardBehavior: "height" | "padding" | "position" | undefined =
    Platform.OS === "ios"
      ? "padding"
      : Platform.OS === "android"
        ? "position"
        : undefined;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={isDialogPresentation ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.backdrop,
          isDialogPresentation ? styles.dialogBackdrop : styles.sheetBackdrop,
          backdropStyle,
        ]}
      >
        <Pressable
          style={isDialogPresentation ? styles.dialogDismissArea : styles.sheetDismissArea}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={keyboardBehavior}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          enabled={true}
          style={[
            isDialogPresentation ? styles.dialogKeyboardWrap : null,
            styles.keyboardWrap,
          ]}
        >
          <View
            style={[
              styles.sheet,
              isDialogPresentation ? styles.dialogSheet : styles.bottomSheet,
              sheetStyle,
            ]}
          >
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
                <X size={18} color={colors.mutedForeground} />
              </AppIconButton>
            </View>

            <View style={styles.body}>
              {scrollEnabled ? (
                <ScrollView
                  style={styles.scroll}
                  showsVerticalScrollIndicator={false}
                  automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                  contentContainerStyle={[
                    styles.content,
                    footer ? styles.contentWithFooter : null,
                    contentContainerStyle,
                  ]}
                >
                  {children}
                </ScrollView>
              ) : (
                <View
                  style={[
                    styles.content,
                    footer ? styles.contentWithFooter : null,
                    contentContainerStyle,
                  ]}
                >
                  {children}
                </View>
              )}
            </View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheetBackdrop: {
    justifyContent: "flex-end",
  },
  dialogBackdrop: {
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  sheetDismissArea: {
    flex: 1,
  },
  dialogDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogKeyboardWrap: {
    width: "100%",
  },
  keyboardWrap: {
    maxHeight: "100%",
  },
  sheet: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomSheet: {
    maxHeight: "92%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  dialogSheet: {
    maxHeight: "86%",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "InterMedium",
  },
  body: {
    flexShrink: 1,
  },
  scroll: {
    flexShrink: 1,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  contentWithFooter: {
    paddingBottom: spacing.sm,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    backgroundColor: colors.card,
  },
});
