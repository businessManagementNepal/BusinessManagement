import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { radius } from '../../theme/spacing';
import { useThemedStyles } from '../../theme/useThemedStyles';


interface PillProps {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
}

export function Pill({ label, tone = 'neutral' }: PillProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const palette = resolveTonePalette(theme, tone);

  return (
    <View style={[styles.pill, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const resolveTonePalette = (
  theme: ReturnType<typeof useAppTheme>,
  tone: PillProps["tone"],
): { backgroundColor: string; color: string } => {
  switch (tone) {
    case "success":
      return {
        backgroundColor: theme.isDarkMode
          ? "rgba(99, 211, 148, 0.16)"
          : "#E4F4EA",
        color: theme.colors.success,
      };
    case "warning":
      return {
        backgroundColor: theme.isDarkMode
          ? "rgba(244, 193, 93, 0.18)"
          : "#FFF2D7",
        color: theme.colors.warning,
      };
    case "danger":
      return {
        backgroundColor: theme.isDarkMode
          ? "rgba(255, 107, 107, 0.16)"
          : "#FBE4E4",
        color: theme.colors.destructive,
      };
    case "neutral":
    default:
      return {
        backgroundColor: theme.colors.muted,
        color: theme.colors.cardForeground,
      };
  }
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    pill: {
      borderRadius: radius.pill,
      paddingHorizontal: theme.scaleSpace(10),
      paddingVertical: theme.scaleSpace(6),
      alignSelf: 'flex-start',
    },
    label: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterBold",
    },
  });

