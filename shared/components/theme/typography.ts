import { Text, TextInput, TextStyle } from "react-native";

export const fontFamily = {
  regular: "InterRegular",
  medium: "InterMedium",
  semiBold: "InterSemiBold",
  bold: "InterBold",
} as const;

let hasAppliedTypographyDefaults = false;

const mergeWithRegularFont = (
  style: TextStyle | TextStyle[] | undefined,
): TextStyle | TextStyle[] => {
  if (!style) {
    return { fontFamily: fontFamily.regular };
  }

  if (Array.isArray(style)) {
    return [{ fontFamily: fontFamily.regular }, ...style];
  }

  return [{ fontFamily: fontFamily.regular }, style];
};

export const applyGlobalTypographyDefaults = (): void => {
  if (hasAppliedTypographyDefaults) {
    return;
  }

  hasAppliedTypographyDefaults = true;

  const TextComponent = Text as unknown as {
    defaultProps?: { style?: TextStyle | TextStyle[] };
  };
  const textDefaults = TextComponent.defaultProps ?? {};
  TextComponent.defaultProps = {
    ...textDefaults,
    style: mergeWithRegularFont(textDefaults.style as TextStyle | TextStyle[]),
  };

  const TextInputComponent = TextInput as unknown as {
    defaultProps?: { style?: TextStyle | TextStyle[] };
  };
  const textInputDefaults = TextInputComponent.defaultProps ?? {};
  TextInputComponent.defaultProps = {
    ...textInputDefaults,
    style: mergeWithRegularFont(
      textInputDefaults.style as TextStyle | TextStyle[],
    ),
  };
};
