import React from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardInset } from "@/shared/components/reusable/layout/useKeyboardInset";

const FOCUSED_INPUT_EXTRA_OFFSET = 52;
const FOCUS_SCROLL_DELAY_MS = 80;
const FOCUS_SCROLL_RECHECK_DELAY_MS = 180;
const FOCUS_SCROLL_RECHECK_COUNT = 2;

type KeyboardSafeEditableScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  bottomInsetPadding?: number;
};

export function KeyboardSafeEditableScreen({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  bottomInsetPadding = 24,
}: KeyboardSafeEditableScreenProps) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();
  const keyboardOffset = Math.max(keyboardInset - insets.bottom, 0);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const scrollOffsetYRef = React.useRef(0);
  const keyboardTopRef = React.useRef<number | null>(null);
  const focusScrollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const scrollFocusedInputAboveKeyboard = React.useCallback((): void => {
    if (focusScrollTimeoutRef.current) {
      clearTimeout(focusScrollTimeoutRef.current);
    }

    const ensureFocusedInputIsVisible = (remainingRechecks: number): void => {
      focusScrollTimeoutRef.current = setTimeout(() => {
        const input = TextInput.State.currentlyFocusedInput();
        const keyboardTop = keyboardTopRef.current;

        if (!input || keyboardTop === null) {
          focusScrollTimeoutRef.current = null;
          return;
        }

        input.measureInWindow((_x, inputTop, _width, inputHeight) => {
          const inputBottom = inputTop + inputHeight;
          const visibleBottom = keyboardTop - FOCUSED_INPUT_EXTRA_OFFSET;
          const overlap = inputBottom - visibleBottom;

          if (overlap > 0) {
            scrollViewRef.current?.scrollTo({
              y: scrollOffsetYRef.current + overlap,
              animated: true,
            });
          }

          if (remainingRechecks > 0) {
            ensureFocusedInputIsVisible(remainingRechecks - 1);
            return;
          }

          focusScrollTimeoutRef.current = null;
        });
      }, remainingRechecks === FOCUS_SCROLL_RECHECK_COUNT
        ? FOCUS_SCROLL_DELAY_MS
        : FOCUS_SCROLL_RECHECK_DELAY_MS);
    };

    ensureFocusedInputIsVisible(FOCUS_SCROLL_RECHECK_COUNT);
  }, []);

  React.useEffect(() => {
    const keyboardShowEvent = "keyboardDidShow";
    const keyboardHideEvent = "keyboardDidHide";
    const keyboardShowSubscription = Keyboard.addListener(
      keyboardShowEvent,
      (event) => {
        keyboardTopRef.current = event.endCoordinates.screenY;
        scrollFocusedInputAboveKeyboard();
      },
    );
    const keyboardHideSubscription = Keyboard.addListener(
      keyboardHideEvent,
      () => {
        keyboardTopRef.current = null;
      },
    );

    return () => {
      keyboardShowSubscription.remove();
      keyboardHideSubscription.remove();

      if (focusScrollTimeoutRef.current) {
        clearTimeout(focusScrollTimeoutRef.current);
      }
    };
  }, [scrollFocusedInputAboveKeyboard]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.scroll, style]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom:
            Math.max(insets.bottom, bottomInsetPadding) + keyboardOffset,
          paddingTop: keyboardVerticalOffset,
        },
        contentContainerStyle,
      ]}
      onFocus={scrollFocusedInputAboveKeyboard}
      onScroll={(event) => {
        scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
