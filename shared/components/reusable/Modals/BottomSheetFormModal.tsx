import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, radius } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { getSafeModalMaxHeight } from "@/shared/components/reusable/layout/getSafeModalHeight";
import { useKeyboardInset } from "@/shared/components/reusable/layout/useKeyboardInset";

type BottomSheetFormModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
  headerContainerStyle?: StyleProp<ViewStyle>;
  footerContainerStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  closeOnBackdropPress?: boolean;
  scrollEnabled?: boolean;
  minHeight?: number;
  topGap?: number;
};

export function BottomSheetFormModal({
  visible,
  onClose,
  children,
  header,
  footer,
  bodyStyle,
  contentContainerStyle,
  sheetStyle,
  headerContainerStyle,
  footerContainerStyle,
  backdropStyle,
  closeOnBackdropPress = true,
  scrollEnabled = true,
  minHeight,
  topGap,
}: BottomSheetFormModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardInset = useKeyboardInset();
  const keyboardOffset = Math.max(keyboardInset - insets.bottom, 0);
  const maxHeight = getSafeModalMaxHeight({
    windowHeight: windowHeight - keyboardOffset,
    topInset: insets.top,
    bottomInset: insets.bottom,
    topGap: topGap ?? theme.scaleSpace(spacing.sm),
  });
  const bottomPadding = Math.max(
    insets.bottom,
    theme.scaleSpace(spacing.md),
  );
  const resolvedMinHeight =
    typeof minHeight === "number" ? Math.min(maxHeight, minHeight) : undefined;

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          justifyContent: "flex-end",
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: theme.colors.overlay,
        },
        sheet: {
          width: "100%",
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          overflow: "hidden",
        },
        body: {
          flexShrink: 1,
          minHeight: 0,
        },
        scroll: {
          flexShrink: 1,
          minHeight: 0,
        },
      }),
    [theme],
  );

  const handleBackdropPress = React.useCallback(() => {
    if (!closeOnBackdropPress) {
      return;
    }

    onClose();
  }, [closeOnBackdropPress, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingBottom: keyboardOffset }]}>
        <Pressable
          style={[styles.backdrop, backdropStyle]}
          onPress={handleBackdropPress}
        />

        <View
          style={[
            styles.sheet,
            {
              maxHeight,
              minHeight: resolvedMinHeight,
            },
            sheetStyle,
          ]}
        >
          {header ? (
            <View style={headerContainerStyle}>{header}</View>
          ) : null}

          <View style={[styles.body, bodyStyle]}>
            {scrollEnabled ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  contentContainerStyle,
                  footer ? null : { paddingBottom: bottomPadding },
                ]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
                automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View
                style={[
                  contentContainerStyle,
                  footer ? null : { paddingBottom: bottomPadding },
                ]}
              >
                {children}
              </View>
            )}
          </View>

          {footer ? (
            <View
              style={[
                { paddingBottom: bottomPadding },
                footerContainerStyle,
              ]}
            >
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
