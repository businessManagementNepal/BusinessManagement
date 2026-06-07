import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { CardPressable } from "@/shared/components/reusable/Cards/Card";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";

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
  const styles = useThemedStyles(createStyles);

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

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    cardButton: {
      minHeight: 66,
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.sm),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
    },
    leadingIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.colors.accent,
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
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      fontFamily: "InterBold",
    },
    subtitle: {
      marginTop: 2,
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    disabled: {
      opacity: 0.6,
    },
  });
