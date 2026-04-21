import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import {
  Dropdown,
  DropdownOption,
} from "@/shared/components/reusable/DropDown/Dropdown";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";

type LabeledDropdownFieldProps = {
  label: string;
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  modalTitle?: string;
  showLeadingIcon?: boolean;
  helperText?: string;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  triggerStyle?: StyleProp<ViewStyle>;
  triggerTextStyle?: StyleProp<TextStyle>;
};

export function LabeledDropdownField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select option",
  disabled = false,
  modalTitle = "Choose option",
  showLeadingIcon = false,
  helperText,
  errorText,
  containerStyle,
  labelStyle,
  triggerStyle,
  triggerTextStyle,
}: LabeledDropdownFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>

      <Dropdown
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        modalTitle={modalTitle}
        showLeadingIcon={showLeadingIcon}
        triggerStyle={triggerStyle}
        triggerTextStyle={triggerTextStyle}
      />

      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterBold",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  helperText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "InterMedium",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "InterSemiBold",
  },
});
