import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { colors } from "@/shared/components/theme/colors";
import { radius } from "@/shared/components/theme/spacing";

type LabeledTextInputProps = Omit<TextInputProps, "style"> & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function LabeledTextInput({
  label,
  containerStyle,
  labelStyle,
  inputStyle,
  editable = true,
  placeholderTextColor = colors.mutedForeground,
  ...props
}: LabeledTextInputProps) {
  return (
    <View style={containerStyle}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <TextInput
        {...props}
        editable={editable}
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, inputStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
  },
});
