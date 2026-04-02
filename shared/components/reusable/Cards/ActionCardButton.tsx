import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { CardPressable } from "@/shared/components/reusable/Cards/Card";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";

type ActionCardButtonProps = {
  title: string;
  subtitle?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ActionCardButton({
  title,
  subtitle,
  leadingIcon,
  trailingIcon,
  onPress,
  disabled,
  style,
}: ActionCardButtonProps) {
  return (
    <CardPressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.cardButton, style, disabled ? styles.disabled : null]}
    >
      {leadingIcon ? <View style={styles.leadingIconWrap}>{leadingIcon}</View> : null}
      <View style={styles.copyWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailingIcon ? <View style={styles.trailingIconWrap}>{trailingIcon}</View> : null}
    </CardPressable>
  );
}

const styles = StyleSheet.create({
  cardButton: {
    minHeight: 66,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  leadingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  trailingIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  copyWrap: {
    flex: 1,
  },
  title: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  subtitle: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "InterMedium",
  },
  disabled: {
    opacity: 0.6,
  },
});
