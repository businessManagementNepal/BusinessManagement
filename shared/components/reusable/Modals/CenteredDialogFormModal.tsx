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
import { useKeyboardInset } from "@/shared/components/reusable/layout/useKeyboardInset";

type CenteredDialogFormModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  headerContainerStyle?: StyleProp<ViewStyle>;
  footerContainerStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  closeOnBackdropPress?: boolean;
  scrollEnabled?: boolean;
  minHeight?: number;
  topGap?: number;
};

export function CenteredDialogFormModal({
  visible,
  onClose,
  children,
  header,
  footer,
  bodyStyle,
  contentContainerStyle,
  cardStyle,
  headerContainerStyle,
  footerContainerStyle,
  backdropStyle,
  closeOnBackdropPress = true,
  scrollEnabled = true,
  minHeight,
  topGap,
}: CenteredDialogFormModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardInset = useKeyboardInset();
  const keyboardOffset = Math.max(keyboardInset - insets.bottom, 0);
  const topPadding = insets.top + (topGap ?? theme.scaleSpace(spacing.lg));
  const rootBottomPadding =
    Math.max(insets.bottom, theme.scaleSpace(spacing.lg)) + keyboardOffset;
  const maxHeight = Math.max(windowHeight - topPadding - rootBottomPadding, 0);
  const bottomPadding = Math.max(
    insets.bottom,
    theme.scaleSpace(spacing.md),
  );
  const horizontalInset = theme.scaleSpace(spacing.lg);
  const resolvedMinHeight =
    typeof minHeight === "number" ? Math.min(maxHeight, minHeight) : undefined;

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: horizontalInset,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: theme.colors.overlay,
        },
        card: {
          width: "100%",
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          overflow: "hidden",
          alignSelf: "center",
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
    [horizontalInset, theme],
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
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View
        style={[
          styles.root,
          {
            paddingTop: topPadding,
            paddingBottom: rootBottomPadding,
          },
        ]}
      >
        <Pressable
          style={[styles.backdrop, backdropStyle]}
          onPress={handleBackdropPress}
        />

        <View
          style={[
            styles.card,
            {
              maxHeight,
              minHeight: resolvedMinHeight,
            },
            cardStyle,
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
