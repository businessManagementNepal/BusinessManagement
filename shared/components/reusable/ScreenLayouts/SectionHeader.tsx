import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel ? (
        <Pressable style={styles.action} onPress={onActionPress}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <ChevronRight size={14} color={theme.colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    row: {
      paddingHorizontal: theme.scaleSpace(16),
      paddingTop: theme.scaleSpace(18),
      paddingBottom: theme.scaleSpace(8),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      color: theme.colors.foreground,
      fontSize: theme.scaleText(17),
      lineHeight: theme.scaleLineHeight(21),
      fontFamily: "InterBold",
    },
    action: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(4),
    },
    actionLabel: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterBold",
    },
  });

