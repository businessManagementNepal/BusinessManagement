import React from "react";
import {
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { KeyboardSafeEditableScreen } from "./KeyboardSafeEditableScreen";

interface ScreenContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
  showDivider?: boolean;
  dividerColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
  baseBottomPadding?: number;
  keyboardSafe?: boolean;
}

export function ScreenContainer({
  children,
  header,
  footer,
  padded = false,
  showDivider = true,
  dividerColor,
  contentContainerStyle,
  scrollProps,
  baseBottomPadding = 110,
  keyboardSafe = false,
}: ScreenContainerProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
        },
        scroll: {
          flex: 1,
        },
        content: {
          flexGrow: 1,
        },
        padded: {
          paddingHorizontal: theme.scaleSpace(16),
          paddingTop: theme.scaleSpace(16),
        },
      }),
    [theme],
  );
  const resolvedDividerColor = dividerColor ?? theme.colors.border;

  return (
    <View style={styles.container}>
      {header}
      {showDivider ? (
        <View
          style={[styles.divider, { backgroundColor: resolvedDividerColor }]}
        />
      ) : null}
      {keyboardSafe ? (
        <KeyboardSafeEditableScreen
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: theme.scaleSpace(baseBottomPadding) },
            padded ? styles.padded : null,
            contentContainerStyle,
          ]}
        >
          {children}
        </KeyboardSafeEditableScreen>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: theme.scaleSpace(baseBottomPadding) },
            padded ? styles.padded : null,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      )}
      {footer}
    </View>
  );
}
