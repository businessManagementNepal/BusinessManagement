import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Check, ChevronDown, Globe } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    FlatList,
    Keyboard,
    Modal,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

export type DropdownOption = {
  label: string;
  value: string;
  customerData?: {
    remoteId: string;
    fullName: string;
    phone: string | null;
    address: string | null;
  };
};

type DropdownProps = {
  value: string;
  options: readonly DropdownOption[];
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
  placeholder = "Select option",
  disabled = false,
  modalTitle = "Choose option",
  showLeadingIcon = true,
  triggerStyle,
  triggerTextStyle,
}: DropdownProps) {
  const [visible, setVisible] = useState(false);
  const reopenBlockedUntilRef = useRef(0);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safeOptions = useMemo(
    () => (Array.isArray(options) ? options : []),
    [options],
  );

  const selectedOption = useMemo(() => {
    return safeOptions.find((item) => item.value === value);
  }, [safeOptions, value]);

  const closeDropdown = useCallback(() => {
    if (!visible) {
      return;
    }
    reopenBlockedUntilRef.current = Date.now() + 220;
    setVisible(false);
  }, [visible]);

  const openDropdown = useCallback(() => {
    if (disabled || visible || Date.now() < reopenBlockedUntilRef.current) {
      return;
    }

    Keyboard.dismiss();
    if (openTimeoutRef.current !== null) {
      clearTimeout(openTimeoutRef.current);
    }
    openTimeoutRef.current = setTimeout(() => {
      setVisible(true);
      openTimeoutRef.current = null;
    }, 90);
  }, [disabled, visible]);

  React.useEffect(() => {
    return () => {
      if (openTimeoutRef.current !== null) {
        clearTimeout(openTimeoutRef.current);
      }
    };
  }, []);

  const handleSelect = (nextValue: string) => {
    setVisible(false);
    reopenBlockedUntilRef.current = Date.now() + 220;
    onChange(nextValue);
  };

  return (
    <>
      <Pressable
        style={[styles.trigger, triggerStyle, disabled && styles.triggerDisabled]}
        onPress={openDropdown}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <View style={styles.leftContent}>
          {showLeadingIcon ? <Globe size={14} color={colors.primary} /> : null}
          <Text style={[styles.triggerText, triggerTextStyle]} numberOfLines={1}>
            {selectedOption?.label ?? placeholder}
          </Text>
        </View>

        <ChevronDown size={16} color={colors.mutedForeground} />
      </Pressable>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropDismissArea}
            onPress={closeDropdown}
          />

          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{modalTitle}</Text>

            <FlatList
              data={safeOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;

                return (
                  <Pressable
                    style={[
                      styles.optionRow,
                      isSelected ? styles.optionRowSelected : null,
                    ]}
                    onPress={() => handleSelect(item.value)}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected ? styles.optionTextSelected : null,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>

                    {isSelected ? <Check size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  triggerText: {
    color: colors.cardForeground,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "InterMedium",
    flexShrink: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  backdropDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "72%",
    zIndex: 1,
  },
  sheetTitle: {
    color: colors.cardForeground,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: "InterBold",
    marginBottom: spacing.sm,
  },
  optionRow: {
    minHeight: 44,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  optionRowSelected: {
    backgroundColor: colors.accent,
  },
  optionText: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontFamily: "InterBold",
  },
  separator: {
    height: 8,
  },
});

