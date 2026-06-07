import React from "react";
import {
  Keyboard,
  KeyboardEvent,
  Platform,
  useWindowDimensions,
} from "react-native";

const resolveKeyboardInset = (
  event: KeyboardEvent,
  windowHeight: number,
): number => {
  const screenY = event.endCoordinates?.screenY;

  if (typeof screenY === "number") {
    return Math.max(windowHeight - screenY, 0);
  }

  const keyboardHeight = event.endCoordinates?.height;
  return typeof keyboardHeight === "number" ? Math.max(keyboardHeight, 0) : 0;
};

export function useKeyboardInset(): number {
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardInset, setKeyboardInset] = React.useState(0);

  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const changeEvent =
      Platform.OS === "ios" ? "keyboardWillChangeFrame" : null;
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event: KeyboardEvent) => {
      setKeyboardInset(resolveKeyboardInset(event, windowHeight));
    };

    const handleHide = () => {
      setKeyboardInset(0);
    };

    const subscriptions = [
      Keyboard.addListener(showEvent, handleShow),
      Keyboard.addListener(hideEvent, handleHide),
    ];

    if (changeEvent) {
      subscriptions.push(Keyboard.addListener(changeEvent, handleShow));
    }

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [windowHeight]);

  return keyboardInset;
}
