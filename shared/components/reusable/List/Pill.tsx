import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';


interface PillProps {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
}

export function Pill({ label, tone = 'neutral' }: PillProps) {
  const palette = {
    success: { backgroundColor: '#E4F4EA', color: colors.success },
    warning: { backgroundColor: '#FFF2D7', color: colors.warning },
    danger: { backgroundColor: '#FBE4E4', color: colors.destructive },
    neutral: { backgroundColor: colors.muted, color: colors.cardForeground },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontFamily: "InterBold",
  },
});

