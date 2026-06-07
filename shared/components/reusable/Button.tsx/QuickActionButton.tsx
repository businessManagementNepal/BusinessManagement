import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../Cards/Card';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';


interface QuickActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

export function QuickActionButton({ label, icon, onPress }: QuickActionButtonProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Card style={styles.card}>
        <View style={styles.icon}>{icon}</View>
        <Text style={styles.label}>{label}</Text>
      </Card>
    </Pressable>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    pressable: {
      width: '23.5%',
    },
    card: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: theme.scaleSpace(88),
      paddingHorizontal: theme.scaleSpace(8),
    },
    icon: {
      marginBottom: theme.scaleSpace(8),
    },
    label: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterBold",
      textAlign: 'center',
    },
  });

