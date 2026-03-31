import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  FlatList,
} from "react-native";
import { ChevronDown, Check, Globe } from "lucide-react-native";
import { colors } from "@/shared/components/theme/colors";
import { radius } from "@/shared/components/theme/spacing";

export type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  modalTitle?: string;
  showLeadingIcon?: boolean;
  triggerStyle?: StyleProp<ViewStyle>;
  triggerTextStyle?: StyleProp<TextStyle>;
};

export function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select language",
  disabled = false,
  modalTitle = "Choose option",
  showLeadingIcon = true,
  triggerStyle,
  triggerTextStyle,
}: DropdownProps) {
  const [visible, setVisible] = useState(false);

  const selectedOption = useMemo(() => {
    return options.find((item) => item.value === value);
  }, [options, value]);

  const handleSelect = (nextValue: string) => {
    setVisible(false);
    onChange(nextValue);
  };

  return (
    <>
      <Pressable
        style={[styles.trigger, triggerStyle, disabled && styles.triggerDisabled]}
        onPress={() => {
          if (!disabled) setVisible(true);
        }}
      >
        <View style={styles.leftContent}>
          {showLeadingIcon ? <Globe size={14} color={colors.primary} /> : null}
          <Text style={[styles.triggerText, triggerTextStyle]}>
            {selectedOption?.label ?? placeholder}
          </Text>
        </View>

        <ChevronDown size={16} color={colors.mutedForeground} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropDismissArea}
            onPress={() => setVisible(false)}
          />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{modalTitle}</Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;

                return (
                  <Pressable
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {isSelected ? (
                      <Check size={16} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  triggerText: {
    color: colors.cardForeground,
    fontSize: 12,
    fontFamily: "InterBold",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.24)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backdropDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.xl ?? 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "70%",
    zIndex: 1,
  },
  sheetTitle: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
    marginBottom: 12,
  },
  optionRow: {
    minHeight: 44,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionRowSelected: {
    backgroundColor: colors.muted,
  },
  optionText: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  optionTextSelected: {
    color: colors.primary,
    fontFamily: "InterBold",
  },
  separator: {
    height: 8,
  },
});

