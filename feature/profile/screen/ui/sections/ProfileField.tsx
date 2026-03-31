import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

type ProfileFieldProps = {
  label: string;
  value: string;
  editable: boolean;
  onChangeText: (nextValue: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: TextInputProps["keyboardType"];
  multiline?: boolean;
  numberOfLines?: number;
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
};

export function ProfileField({
  label,
  value,
  editable,
  onChangeText,
  placeholder,
  autoCapitalize = "none",
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  autoComplete,
  textContentType,
}: ProfileFieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.inputField, multiline ? styles.multilineField : undefined]}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoComplete={autoComplete}
          textContentType={textContentType}
          textAlignVertical={multiline ? "top" : "center"}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || "-"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "InterBold",
  },
  fieldValue: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  inputField: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    color: colors.cardForeground,
    fontSize: 14,
    backgroundColor: colors.background,
  },
  multilineField: {
    minHeight: 88,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});

